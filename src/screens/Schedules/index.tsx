import {ANDROID_HOME_BANNER_AD_UNIT_ID, IOS_HOME_BANNER_AD_UNIT_ID} from '@env';
import dayjs from 'dayjs';
import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react';
import {Platform, RefreshControl, ScrollView, Text, View} from 'react-native';

import {getSchedules} from '@/api';
import BannerAdCard from '@/components/BannerAdCard';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
import {useTheme} from '@/contexts/ThemeContext';
import {clearCache} from '@/lib/cache';
import {showToast} from '@/lib/toast';
import {Schedule as ScheduleType} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Schedules = () => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const {theme, typography} = useTheme();

  // 광고 빈도 설정 (N개마다 1개 광고 표시)
  const AD_FREQUENCY = 3;
  const MAX_ADS = 10;

  const fetchData = useCallback(async () => {
    try {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
      const today = dayjs();

      const scheduleResponse = await getSchedules(school.neisCode, school.neisRegionCode, today.format('YYYY'), today.format('MM'));
      setSchedules(scheduleResponse);
    } catch (e) {
      const err = e as Error;

      showToast('학사일정을 불러오는 중 오류가 발생했어요.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    analytics().logScreenView({screen_name: '학사일정 상세 페이지', screen_class: 'Schedules'});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await clearCache('@cache/schedules');
    await fetchData();
    setRefreshing(false);
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

  return loading ? (
    <Loading fullScreen />
  ) : (
    <Container scrollView bounce={!loading} scrollViewRef={scrollViewRef} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondaryText} />}>
      <View style={{gap: 16, width: '100%'}}>
        {schedules?.length > 0 ? (
          schedules.map((item, index) => {
            const isToday = today.isSame(item.date.start, 'day');

            // 광고 삽입 로직
            const shouldShowAd = AD_FREQUENCY > 0 && index > 0 && index % AD_FREQUENCY === 0 && Math.floor(index / AD_FREQUENCY) <= MAX_ADS;

            return (
              <Fragment key={index}>
                {shouldShowAd && (
                  <View style={{marginBottom: 16}}>
                    <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />
                  </View>
                )}
                <TimelineItem item={item} isLast={index === schedules.length - 1} isToday={isToday} getScheduleType={getScheduleType} getScheduleColor={getScheduleColor} />
              </Fragment>
            );
          })
        ) : (
          <View style={{alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 40}}>
            <FontAwesome6 name="calendar-xmark" size={48} color={theme.secondaryText} iconStyle="solid" />
            <Text style={[typography.body, {color: theme.secondaryText, marginTop: 12}]}>학사일정 데이터가 없어요.</Text>
            <Text style={[typography.caption, {color: theme.secondaryText, marginTop: 4}]}>학교에서 제공하지 않는 경우도 있어요.</Text>
          </View>
        )}
      </View>
    </Container>
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
    <View style={{marginBottom: isLast ? 0 : 16}}>
      <View
        style={{
          backgroundColor: isToday ? `${theme.highlight}10` : theme.card,
          borderRadius: 12,
          padding: 14,
          borderWidth: isToday ? 1 : 0,
          borderColor: isToday ? theme.highlight : 'transparent',
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
