import {ANDROID_HOME_BANNER_AD_UNIT_ID, IOS_HOME_BANNER_AD_UNIT_ID} from '@env';
import dayjs from 'dayjs';
import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Platform, RefreshControl, Text, View} from 'react-native';

import {getSchedules} from '@/api';
import BannerAdCard from '@/components/BannerAdCard';
import Loading from '@/components/Loading';
import {useTheme} from '@/contexts/ThemeContext';
import {clearCache} from '@/lib/cache';
import {showToast} from '@/lib/toast';
import {Schedule as ScheduleType} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Schedules = () => {
  const flatListRef = useRef<FlatList | null>(null);
  const initialLoadDone = useRef<boolean>(false);
  const isAutoLoading = useRef<boolean>(false);
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());

  const {theme, typography} = useTheme();

  // 광고 빈도 설정 (N개마다 1개 광고 표시)
  const AD_FREQUENCY = 3;
  const MAX_ADS = 10;

  const fetchData = useCallback(async (month?: dayjs.Dayjs, append: boolean = false) => {
    try {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
      const targetMonth = month || dayjs();

      const scheduleResponse = await getSchedules(school.neisCode, school.neisRegionCode, targetMonth.format('YYYY'), targetMonth.format('MM'));
      
      let newSchedulesCount = 0;
      if (append) {
        setSchedules(prev => {
          // 중복 데이터 필터링 (date + schedule로 구분)
          const existingKeys = new Set(prev.map(s => `${s.date}-${s.schedule}`));
          const uniqueNewSchedules = scheduleResponse.filter(s => !existingKeys.has(`${s.date}-${s.schedule}`));
          const newSchedules = [...prev, ...uniqueNewSchedules];
          newSchedulesCount = newSchedules.length;
          return newSchedules;
        });
      } else {
        setSchedules(scheduleResponse);
        newSchedulesCount = scheduleResponse.length;
      }

      // 데이터가 있으면 hasMore 유지
      if (scheduleResponse.length > 0) {
        setHasMore(true);
      }

      // 10개 미만이면 자동으로 다음 달 불러오기
      return newSchedulesCount;
    } catch (e) {
      const err = e as Error;

      if (!append) {
        showToast('학사일정을 불러오는 중 오류가 발생했어요.');
      }
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(async (silent: boolean = false) => {
    if (loadingMore || !hasMore) return;

    const nextMonth = currentMonth.add(1, 'month');
    const limitDate = dayjs().add(1, 'year').month(1).endOf('month'); // 다음 년도 2월 말
    
    // 다음 년도 2월까지만 불러오기
    if (nextMonth.isAfter(limitDate, 'month')) {
      setHasMore(false);
      if (!silent) {
        showToast('더 이상 학사일정 데이터가 없어요.');
      }
      return;
    }

    setLoadingMore(true);
    setCurrentMonth(nextMonth);
    await fetchData(nextMonth, true);
  }, [loadingMore, hasMore, currentMonth, fetchData]);

  useEffect(() => {
    analytics().logScreenView({screen_name: '학사일정 상세 페이지', screen_class: 'Schedules'});
  }, []);

  useEffect(() => {
    // 이미 로드된 상태면 스킵
    if (initialLoadDone.current) return;
    fetchData().then(() => {
      initialLoadDone.current = true;
    });
  }, []);

  // 10개 미만이면 자동으로 다음 달 불러오기
  useEffect(() => {
    if (initialLoadDone.current && !loading && !loadingMore && !refreshing && schedules.length < 10 && hasMore && !isAutoLoading.current) {
      isAutoLoading.current = true;
      loadMore(true).finally(() => {
        isAutoLoading.current = false;
      });
    }
  }, [loading, loadingMore, refreshing, schedules.length, hasMore, loadMore]);

  const onRefresh = useCallback(async () => {
    initialLoadDone.current = false;
    setRefreshing(true);
    await clearCache('@cache/schedules');
    setCurrentMonth(dayjs());
    setHasMore(true);
    await fetchData();
    setRefreshing(false);
    // 약간의 딜레이 후 initialLoadDone 설정 (useEffect 트리거 방지)
    setTimeout(() => {
      initialLoadDone.current = true;
    }, 100);
  }, [fetchData]);

  // 일정 유형별 키워드 정의
  const scheduleKeywords = {
    exam: ['시험', '평가', '고사', '모의고사', '수능', '지필'],
    vacation: ['방학', '휴업', '휴일', '재량휴업일', '개교기념일'],
    ceremony: ['입학', '졸업', '입학식', '졸업식', '시업식', '종업식', '개학식'],
    event: ['체육', '축제', '대회', '수학여행', '수련회', '체험학습', '운동회', '학예회'],
  };

  // 일정 유형 감지 - 정규식 패턴 사용
  const getScheduleType = (schedule: string): string => {
    for (const [type, keywords] of Object.entries(scheduleKeywords)) {
      const pattern = new RegExp(keywords.join('|'));
      if (pattern.test(schedule)) {
        return type;
      }
    }
    return 'default';
  };

  const getScheduleColor = (type: string) => {
    const colors: {[key: string]: string} = {
      exam: '#FF6B6B', // 빨간색
      vacation: theme.highlightLight, // 초록색 계열
      ceremony: theme.highlightSecondary, // 보라색 계열
      event: theme.highlight, // 파란색 계열
      default: theme.secondaryText,
    };
    return colors[type] || theme.secondaryText;
  };

  const today = dayjs();

  const renderScheduleItem = useCallback(({item, index}: {item: ScheduleType; index: number}) => {
    const isToday = today.isSame(item.date.start, 'day');

    // 광고 삽입 로직
    const shouldShowAd = AD_FREQUENCY > 0 && index > 0 && index % AD_FREQUENCY === 0 && Math.floor(index / AD_FREQUENCY) <= MAX_ADS;

    return (
      <Fragment key={index}>
        {shouldShowAd && <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />}
        <TimelineItem item={item} isLast={index === schedules.length - 1} isToday={isToday} getScheduleType={getScheduleType} getScheduleColor={getScheduleColor} />
      </Fragment>
    );
  }, [today, schedules.length, AD_FREQUENCY, MAX_ADS, getScheduleType, getScheduleColor]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={{paddingVertical: 20, alignItems: 'center'}}>
        <ActivityIndicator size="small" color={theme.highlight} />
        <Text style={[typography.caption, {color: theme.secondaryText, marginTop: 8}]}>더 불러오는 중...</Text>
      </View>
    );
  }, [loadingMore, theme, typography]);

  const renderEmpty = useCallback(() => (
    <View style={{alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 40}}>
      <FontAwesome6 name="calendar-xmark" size={48} color={theme.secondaryText} iconStyle="solid" />
      <Text style={[typography.body, {color: theme.secondaryText, marginTop: 12}]}>학사일정 데이터가 없어요.</Text>
      <Text style={[typography.caption, {color: theme.secondaryText, marginTop: 4}]}>학교에서 제공하지 않는 경우도 있어요.</Text>
    </View>
  ), [theme, typography]);

  const renderHeader = useCallback(() => (
    <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />
  ), []);

  return loading ? (
    <Loading fullScreen />
  ) : (
    <View style={{flex: 1, backgroundColor: theme.background}}>
      <FlatList
        ref={flatListRef}
        data={schedules}
        renderItem={renderScheduleItem}
        keyExtractor={(item, index) => `${item.date.start}-${index}`}
        contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 16, gap: 12}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondaryText} />}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const TimelineItem = ({item, isLast, isToday, getScheduleType, getScheduleColor}: {item: ScheduleType; isLast: boolean; isToday: boolean; getScheduleType: (schedule: string) => string; getScheduleColor: (type: string) => string}) => {
  const startDate = dayjs(item.date.start);
  const endDate = dayjs(item.date.end || item.date.start);
  const isSameDay = startDate.isSame(endDate, 'day');
  const duration = endDate.diff(startDate, 'day') + 1;

  const schedules = item.schedule.split(', ');
  const {theme, typography} = useTheme();

  return (
    <View style={{marginBottom: isLast ? 0 : 4}}>
      <View
        style={{
          backgroundColor: isToday ? `${theme.highlight}10` : theme.card,
          borderRadius: 12,
          padding: 14,
          borderWidth: isToday ? 1 : 0,
          borderColor: isToday ? `${theme.highlight}80` : 'transparent',
        }}>
        {!isSameDay && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8}}>
            <FontAwesome6 name="calendar-days" size={12} color={theme.secondaryText} iconStyle="solid" />
            <Text style={[typography.caption, {color: theme.secondaryText}]}>
              {startDate.format('M월 D일')} ~ {endDate.format('M월 D일')} ({duration}일간)
            </Text>
          </View>
        )}
        {isSameDay && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8}}>
            <FontAwesome6 name="calendar-day" size={12} color={theme.secondaryText} iconStyle="solid" />
            <Text style={[typography.caption, {color: theme.secondaryText}]}>{startDate.format('M월 D일')}</Text>
          </View>
        )}

        <View style={{gap: 6}}>
          {schedules.map((scheduleItem, idx) => {
            const type = getScheduleType(scheduleItem);
            const color = getScheduleColor(type);

            return (
              <View key={idx} style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: color,
                  }}
                />
                <Text
                  style={[
                    typography.body,
                    {
                      color: theme.primaryText,
                      fontWeight: '400',
                      flex: 1,
                    },
                  ]}>
                  {scheduleItem}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default Schedules;
