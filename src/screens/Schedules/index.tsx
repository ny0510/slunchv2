import dayjs from 'dayjs';
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, RefreshControl, Text, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';

import {getSchedules} from '@/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import {theme} from '@/styles/theme';
import {Schedule as ScheduleType} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Schedules = () => {
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
      const today = dayjs();

      const scheduleResponse = await getSchedules(school.neisCode, school.neisRegionCode, today.format('YYYY'), today.format('MM'));
      setSchedules(scheduleResponse);
    } catch (e) {
      const err = e as Error;

      Alert.alert('데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.', '오류 메시지: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return loading ? (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size="large" color={theme.colors.primaryText} />
    </View>
  ) : (
    <Container
      scrollView
      bounce={!loading}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchData().then(() => setRefreshing(false));
          }}
        />
      }>
      <View style={{gap: 12, width: '100%'}}>
        {schedules.map((m, i) => {
          return <ScheduleItem key={i} item={m} />;
        })}
      </View>
    </Container>
  );
};

const ScheduleItem = ({item}: {item: ScheduleType}) => {
  const startDate = dayjs(item.date.start);
  const endDate = dayjs(item.date.end || item.date.start);
  const isSameDay = startDate.isSame(endDate, 'day');

  const schedules = item.schedule.split(', ');

  return (
    <Card title={startDate.format('M/D') + (isSameDay ? '' : ` ~ ${endDate.format('M/D')}`)}>
      <FlatList data={schedules} scrollEnabled={false} renderItem={({item: scheduleItem}) => <Text style={{color: theme.colors.primaryText, fontFamily: theme.fontWeights.light, fontSize: 16}}>{schedules.length > 1 ? `- ${scheduleItem}` : scheduleItem}</Text>} />
    </Card>
  );
};

export default Schedules;
