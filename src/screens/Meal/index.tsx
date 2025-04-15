import dayjs from 'dayjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {RefreshControl, ScrollView, Text, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import {Easing} from 'react-native-reanimated';
import Share from 'react-native-share';

import Content from '../Tab/Settings/components/Content';
import {getMeal} from '@/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
import TouchableScale from '@/components/TouchableScale';
import {clearCache} from '@/lib/cache';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';
import {Meal as MealType} from '@/types/api';
import {MealItem} from '@/types/meal';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import analytics from '@react-native-firebase/analytics';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const Meal = () => {
  const [meal, setMeal] = useState<MealType[]>([]);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [showAllergy, setShowAllergy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [schoolName, setSchoolName] = useState<string>('알 수 없음');
  const [selectedMeal, setSelectedMeal] = useState<string>('');
  const [selectedMealDate, setSelectedMealDate] = useState<string>('');

  const scrollViewRef = useRef<ScrollView | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    (async () => {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
      setSchoolName(school.schoolName);
    })();
  }, []);

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

      showToast('급식을 불러오는 중 오류가 발생했어요.');
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
      showToast('다음 달 급식을 불러오는 중 오류가 발생했어요.');
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

  const openBottomSheet = (_meal: string, date: string) => {
    setSelectedMeal(_meal);
    setSelectedMealDate(date);
    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(0);
    }
  };

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} pressBehavior="close" disappearsOnIndex={-1} />, []);

  return loading ? (
    <Loading fullScreen />
  ) : (
    <>
      <Container
        scrollView
        bounce={!loading}
        scrollViewRef={scrollViewRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.secondaryText} />}
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
              const mealData = m.meal.filter(mealItem => typeof mealItem === 'string' || (mealItem as MealItem).food !== '');
              const mealText = mealData.map(mealItem => (typeof mealItem === 'string' ? mealItem : (mealItem as MealItem).food)).join('\n');

              return (
                <TouchableScale key={i} pressInEasing={Easing.elastic(0.5)} pressOutEasing={Easing.elastic(0.5)} pressInDuration={100} pressOutDuration={100} scaleTo={0.98} onPress={() => openBottomSheet(mealText, date)}>
                  <Card title={date}>
                    <FlatList data={m.meal} renderItem={({item, index}) => renderMealItem(item, index)} scrollEnabled={false} />
                  </Card>
                </TouchableScale>
              );
            })
          ) : (
            <View style={{alignItems: 'center', justifyContent: 'center', width: '100%'}}>
              <Text style={{color: theme.colors.primaryText, fontFamily: theme.fontWeights.light, fontSize: 16}}>급식 데이터가 없어요.</Text>
            </View>
          )}
        </View>
      </Container>

      <BottomSheet backdropComponent={renderBackdrop} ref={bottomSheetRef} index={-1} enablePanDownToClose backgroundStyle={{backgroundColor: theme.colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}} handleIndicatorStyle={{backgroundColor: theme.colors.secondaryText}}>
        <BottomSheetView style={{paddingHorizontal: 18, paddingVertical: 20, gap: 16, backgroundColor: theme.colors.card, justifyContent: 'center'}}>
          <Content
            title="복사하기"
            arrow
            onPress={() => {
              analytics().logEvent('meal_copy');
              Clipboard.setString(`🍴${schoolName} ${selectedMealDate} 급식\n\n- ${selectedMeal.split('\n').join('\n- ')}`);
              showToast('클립보드에 복사되었어요.');
              bottomSheetRef.current?.close();
            }}
          />
          <Content
            title="공유하기"
            arrow
            onPress={() => {
              analytics().logEvent('meal_share');
              Share.open({
                title: `${schoolName} ${selectedMealDate} 급식`,
                message: `🍴${schoolName} ${selectedMealDate} 급식\n\n- ${selectedMeal.split('\n').join('\n- ')}`,
                type: 'text/plain',
              })
                .then(res => console.log(res))
                .catch(err => console.log(err));
              bottomSheetRef.current?.close();
            }}
          />
          <Content
            title="인스타그램 스토리로 공유하기"
            arrow
            onPress={() => {
              analytics().logEvent('meal_instagram_share');
              navigation.navigate('Share', {data: {meal: selectedMeal, date: selectedMealDate, school: schoolName}});
              bottomSheetRef.current?.close();
            }}
          />
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

export default Meal;
