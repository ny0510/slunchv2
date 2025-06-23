import {ANDROID_HOME_BANNER_AD_UNIT_ID, ANDROID_SCHEDULE_NATIVE_AD_UNIT_ID, IOS_HOME_BANNER_AD_UNIT_ID, IOS_SCHEDULE_NATIVE_AD_UNIT_ID} from '@env';
import dayjs from 'dayjs';
import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react';
import {Platform, RefreshControl, ScrollView, Text, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';

import {getSchedules} from '@/api';
import BannerAdCard from '@/components/BannerAdCard';
import Card from '@/components/Card';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
import NativeAdCard from '@/components/NaviveAdCard';
import {useTheme} from '@/contexts/ThemeContext';
import {clearCache} from '@/lib/cache';
import {showToast} from '@/lib/toast';
import {Schedule as ScheduleType} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';

const Schedules = () => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const {theme} = useTheme();

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

  return loading ? (
    <Loading fullScreen />
  ) : (
    <Container scrollView bounce={!loading} scrollViewRef={scrollViewRef} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondaryText} />}>
      <View style={{gap: 12, width: '100%'}}>
        {schedules?.length > 0 ? (
          (() => {
            // 5개마다 1개 광고, 최소 1개, 최대10개
            const scheduleCount = schedules.length;
            const MAX_ADS = 10;
            const MIN_ADS = 1;
            const adsToShow = Math.max(MIN_ADS, Math.min(MAX_ADS, Math.floor(scheduleCount / 5)));
            const adIndexes = scheduleCount <= 1 ? [] : Array.from({length: adsToShow}, (_, idx) => Math.round(((idx + 1) * scheduleCount) / (adsToShow + 1)));

            return schedules.map((m, i) => {
              const shouldShowAd = adIndexes.includes(i);
              return (
                <Fragment key={i}>
                  {shouldShowAd && <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />}
                  <ScheduleItem item={m} />
                </Fragment>
              );
            });
          })()
        ) : (
          <View style={{alignItems: 'center', justifyContent: 'center', width: '100%'}}>
            <Text style={{color: theme.primaryText, fontWeight: '300', fontSize: 16}}>학사일정 데이터가 없어요.</Text>
            <Text style={{color: theme.primaryText, fontWeight: '300', fontSize: 16}}>학교에서 제공하지 않는 경우도 있어요.</Text>
          </View>
        )}
      </View>
    </Container>
  );
};

const ScheduleItem = ({item}: {item: ScheduleType}) => {
  const startDate = dayjs(item.date.start);
  const endDate = dayjs(item.date.end || item.date.start);
  const isSameDay = startDate.isSame(endDate, 'day');

  const schedules = item.schedule.split(', ');

  const {theme} = useTheme();

  return (
    <Card title={startDate.format('M/D') + (isSameDay ? '' : ` ~ ${endDate.format('M/D')}`)}>
      <FlatList data={schedules} scrollEnabled={false} renderItem={({item: scheduleItem}) => <Text style={{color: theme.primaryText, fontWeight: '300', fontSize: 16}}>{schedules.length > 1 ? `- ${scheduleItem}` : scheduleItem}</Text>} />
    </Card>
  );
};

export default Schedules;
