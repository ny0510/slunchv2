import dayjs from 'dayjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {RefreshControl, ScrollView, Text, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';

import {getMeal} from '@/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
import {clearCache} from '@/lib/cache';
import {showToast} from '@/lib/toast';
import {theme} from '@/styles/theme';
import {Meal as MealType} from '@/types/api';
import {MealItem} from '@/types/meal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';

const Meal = () => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [meal, setMeal] = useState<MealType[]>([]);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [showAllergy, setShowAllergy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
    const today = dayjs();
    setShowAllergy(settings.showAllergy);

    try {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');

      const mealResponse = await getMeal(school.neisCode, school.neisRegionCode, today.format('YYYY'), today.format('MM'), undefined, showAllergy, true, true);
      const afterToday = mealResponse.filter(m => dayjs(m.date).isSame(today, 'day') || dayjs(m.date).isAfter(today, 'day'));
      if (afterToday.length === 0) {
        showToast('급식이 없습니다.');
        return;
      }
      setMeal(afterToday);
    } catch (e) {
      const err = e as Error;

      showToast('급식을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [showAllergy]);

  const fetchNextMonthData = useCallback(async () => {
    try {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
      const nextMonth = currentDate.add(1, 'month');

      const mealResponse = await getMeal(school.neisCode, school.neisRegionCode, nextMonth.format('YYYY'), nextMonth.format('MM'), undefined, showAllergy, true, true);

      setMeal(prevMeal => [...prevMeal, ...mealResponse]);
      if (!mealResponse.length) {
        showToast('더 이상 급식이 없습니다.');
      }
      setCurrentDate(nextMonth);
    } catch (e) {
      const err = e as Error;
      showToast('다음 달 급식을 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching next month data:', err);
    }
  }, [currentDate, showAllergy]);

  useEffect(() => {
    analytics().logScreenView({screen_name: '급식 상세 페이지', screen_class: 'Meal'});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await clearCache('@cache/meal');
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const renderMealItem = (mealItem: string | MealItem, index: number) => {
    if (typeof mealItem === 'string') {
      return (
        <Text key={index} style={[theme.typography.body, {fontFamily: theme.fontWeights.light}]}>
          - {mealItem}
        </Text>
      );
    }

    const allergyInfo = showAllergy && mealItem.allergy && mealItem.allergy.length > 0 ? ` ${mealItem.allergy.map(allergy => allergy.code).join(', ')}` : '';

    return (
      <Text key={index} style={[theme.typography.body, {fontFamily: theme.fontWeights.light}]}>
        - {mealItem.food}
        <Text style={[theme.typography.small, {color: theme.colors.secondaryText}]}>{allergyInfo}</Text>
      </Text>
    );
  };

  return loading ? (
    <Loading fullScreen />
  ) : (
    <Container
      scrollView
      bounce={!loading}
      scrollViewRef={scrollViewRef}
      style={{height: '100%'}}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onScroll={async (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        const height = event.nativeEvent.layoutMeasurement.height;
        const contentHeight = event.nativeEvent.contentSize.height;
        if (y + height >= contentHeight - 20) {
          await fetchNextMonthData();
        }
      }}>
      <View style={{gap: 12, width: '100%'}}>
        {meal?.length > 0 ? (
          meal.map((m, i) => {
            const date = dayjs(m.date).format('M월 D일 ddd요일');

            return (
              <Card key={i} title={date}>
                <FlatList data={m.meal} renderItem={({item, index}) => renderMealItem(item, index)} scrollEnabled={false} />
              </Card>
            );
          })
        ) : (
          <View style={{alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%'}}>
            <Text style={{color: theme.colors.primaryText, fontFamily: theme.fontWeights.light, fontSize: 16}}>급식 데이터가 없어요.</Text>
          </View>
        )}
      </View>
    </Container>
  );
};

export default Meal;
