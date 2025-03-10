import dayjs from 'dayjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, RefreshControl, ScrollView, Text, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';

import {getMeal} from '@/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import {theme} from '@/styles/theme';
import {Meal as MealType} from '@/types/api';
import {MealItem} from '@/types/meal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Meal = () => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [meal, setMeal] = useState<MealType[]>([]);
  const [showAllergy, setShowAllergy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
    setShowAllergy(settings.showAllergy);

    try {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
      const today = dayjs();

      const mealResponse = await getMeal(school.neisCode, school.neisRegionCode, today.format('YYYY'), today.format('MM'), undefined, showAllergy, true, true);
      const afterToday = mealResponse.filter(m => dayjs(m.date).isSame(today, 'day') || dayjs(m.date).isAfter(today, 'day'));
      setMeal(afterToday);
    } catch (e) {
      const err = e as Error;

      Alert.alert('데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.', '오류 메시지: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [showAllergy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderMealItem = (mealItem: string | MealItem, index: number) => {
    if (typeof mealItem === 'string') {
      return <Text key={index}>- {mealItem}</Text>;
    }

    const allergyInfo = showAllergy && mealItem.allergy && mealItem.allergy.length > 0 ? ` ${mealItem.allergy.map(allergy => allergy.code).join(', ')}` : '';

    return (
      <Text key={index}>
        - {mealItem.food}
        <Text style={[theme.typography.small, {color: theme.colors.secondaryText}]}>{allergyInfo}</Text>
      </Text>
    );
  };

  return loading ? (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size="large" color={theme.colors.primaryText} />
    </View>
  ) : (
    <Container
      scrollView
      bounce={!loading}
      scrollViewRef={scrollViewRef}
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
        {meal.map((m, i) => {
          const date = dayjs(m.date).format('M월 D일 ddd요일');

          return (
            <Card key={i} title={date}>
              <FlatList data={m.meal} renderItem={({item, index}) => renderMealItem(item, index)} scrollEnabled={false} />
            </Card>
          );
        })}
      </View>
    </Container>
  );
};

export default Meal;
