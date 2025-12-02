import {ANDROID_HOME_BANNER_AD_UNIT_ID, IOS_HOME_BANNER_AD_UNIT_ID} from '@env';
import dayjs from 'dayjs';
import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Platform, RefreshControl, Text, TouchableOpacity, View} from 'react-native';
import {trigger} from 'react-native-haptic-feedback';
import Share from 'react-native-share';
import TouchableScale from 'react-native-touchable-scale';

import Content from '../Tab/Settings/components/Content';
import {getMeal} from '@/api';
import BannerAdCard from '@/components/BannerAdCard';
import Loading from '@/components/Loading';
import {useTheme} from '@/contexts/ThemeContext';
import {clearCache} from '@/lib/cache';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import {Meal as MealType} from '@/types/api';
import {MealItem} from '@/types/meal';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {NavigationProp, useFocusEffect, useNavigation} from '@react-navigation/native';

const Meal = () => {
  const [meal, setMeal] = useState<MealType[]>([]);
  const [showAllergy, setShowAllergy] = useState<boolean>(false);
  const [prevShowAllergy, setPrevShowAllergy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [schoolName, setSchoolName] = useState<string>('알 수 없음');
  const [selectedMeal, setSelectedMeal] = useState<string>('');
  const [selectedMealDate, setSelectedMealDate] = useState<string>('');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());

  const {theme, typography} = useTheme();
  const flatListRef = useRef<FlatList | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const initialLoadDone = useRef<boolean>(false);
  const isAutoLoading = useRef<boolean>(false);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // 광고 빈도 설정 (N개마다 1개 광고 표시)
  const AD_FREQUENCY = 4;
  const MAX_ADS = 10;

  useEffect(() => {
    (async () => {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
      setSchoolName(school.schoolName);
    })();
  }, []);

  const fetchData = useCallback(async (month?: dayjs.Dayjs, append: boolean = false) => {
    const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
    const today = dayjs();
    const targetMonth = month || today;
    const currentShowAllergy = settings.showAllergy || false;
    setPrevShowAllergy(showAllergy);
    setShowAllergy(currentShowAllergy);

    try {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');

      const mealResponse = await getMeal(school.neisCode, school.neisRegionCode, targetMonth.format('YYYY'), targetMonth.format('MM'), undefined, currentShowAllergy, true, true);
      
      // API 응답이 배열이 아닌 경우 빈 배열로 처리
      const mealArray = Array.isArray(mealResponse) ? mealResponse : [];
      
      let filteredMeals = mealArray;
      
      // 첫 번째 로드일 때만 오늘 이후 데이터 필터링
      if (!append) {
        filteredMeals = mealArray.filter(m => dayjs(m.date).isSame(today, 'day') || dayjs(m.date).isAfter(today, 'day'));
      }

      let newMealsCount = 0;
      if (append) {
        setMeal(prev => {
          // 중복 데이터 필터링 (date + type으로 구분)
          const existingKeys = new Set(prev.map(m => `${m.date}-${m.type}`));
          const uniqueNewMeals = filteredMeals.filter(m => !existingKeys.has(`${m.date}-${m.type}`));
          const newMeals = [...prev, ...uniqueNewMeals];
          newMealsCount = newMeals.length;
          return newMeals;
        });
      } else {
        setMeal(filteredMeals);
        newMealsCount = filteredMeals.length;
      }

      // 데이터가 있으면 hasMore 유지
      if (mealArray.length > 0) {
        setHasMore(true);
      }

      // 10개 미만이면 자동으로 다음 달 불러오기
      return newMealsCount;
    } catch (e) {
      const err = e as Error;

      if (!append) {
        showToast('급식을 불러오는 중 오류가 발생했어요.');
      }
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [showAllergy]);

  const loadMore = useCallback(async (silent: boolean = false) => {
    if (loadingMore || !hasMore) return;

    const nextMonth = currentMonth.add(1, 'month');
    const limitDate = dayjs().add(1, 'year').month(1).endOf('month'); // 다음 년도 2월 말
    
    // 다음 년도 2월까지만 불러오기
    if (nextMonth.isAfter(limitDate, 'month')) {
      setHasMore(false);
      if (!silent) {
        showToast('더 이상 급식 데이터가 없어요.');
      }
      return;
    }

    setLoadingMore(true);
    setCurrentMonth(nextMonth);
    await fetchData(nextMonth, true);
  }, [loadingMore, hasMore, currentMonth, fetchData]);

  useEffect(() => {
    analytics().logScreenView({screen_name: '급식 상세 페이지', screen_class: 'Meal'});
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
    if (initialLoadDone.current && !loading && !loadingMore && !refreshing && meal.length < 10 && hasMore && !isAutoLoading.current) {
      isAutoLoading.current = true;
      loadMore(true).finally(() => {
        isAutoLoading.current = false;
      });
    }
  }, [loading, loadingMore, refreshing, meal.length, hasMore, loadMore]);

  // Handle allergy setting changes when screen is focused
  useFocusEffect(
    useCallback(() => {
      const checkAllergySettingChange = async () => {
        const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
        const currentShowAllergy = settings.showAllergy || false;
        const allergySettingChanged = prevShowAllergy !== currentShowAllergy;

        if (allergySettingChanged) {
          setRefreshing(true);
          await clearCache('@cache/meal_');
          setCurrentMonth(dayjs());
          setHasMore(true);
          await fetchData();
          setRefreshing(false);
        }
      };

      checkAllergySettingChange();
    }, [prevShowAllergy, fetchData]),
  );

  const onRefresh = useCallback(async () => {
    initialLoadDone.current = false;
    setRefreshing(true);
    await clearCache('@cache/meal');
    setCurrentMonth(dayjs());
    setHasMore(true);
    await fetchData();
    setRefreshing(false);
    // 약간의 딜레이 후 initialLoadDone 설정 (useEffect 트리거 방지)
    setTimeout(() => {
      initialLoadDone.current = true;
    }, 100);
  }, [fetchData]);

  const openBottomSheet = (_meal: string, date: string) => {
    trigger('impactLight');
    setSelectedMeal(_meal);
    setSelectedMealDate(date);
    setIsBottomSheetOpen(true);
  };

  // Open bottom sheet after it mounts
  useEffect(() => {
    if (isBottomSheetOpen && bottomSheetRef.current) {
      // Small delay to ensure the bottom sheet is fully mounted
      const timer = setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isBottomSheetOpen]);

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} pressBehavior="close" disappearsOnIndex={-1} />, []);

  const today = dayjs();

  const renderMealItem = useCallback(({item: m, index}: {item: MealType; index: number}) => {
    const isToday = today.isSame(m.date, 'day');
    const date = dayjs(m.date);
    const mealData = m.meal.filter(mealItem => typeof mealItem === 'string' || (mealItem as MealItem).food !== '');
    const mealText = mealData.map(mealItem => (typeof mealItem === 'string' ? mealItem : (mealItem as MealItem).food)).join('\n');

    // 광고 삽입 로직
    const shouldShowAd = AD_FREQUENCY > 0 && index > 0 && index % AD_FREQUENCY === 0 && Math.floor(index / AD_FREQUENCY) <= MAX_ADS;

    return (
      <Fragment key={index}>
        {shouldShowAd && <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />}
        <MealCard date={date} isToday={isToday} meal={m} mealType={m.type} showAllergy={showAllergy} onLongPress={() => openBottomSheet(mealText, date.format('M월 D일 ddd요일'))} />
      </Fragment>
    );
  }, [today, showAllergy, AD_FREQUENCY, MAX_ADS]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={{paddingVertical: 20, alignItems: 'center'}}>
        <ActivityIndicator size="small" color={theme.highlight} />
        <Text style={[typography.caption, {color: theme.secondaryText, marginTop: 8}]}>더 불러오는 중...</Text>
      </View>
    );
  }, [loadingMore, theme, typography]);

  const renderEmpty = useCallback(() => {
    return (
      <View style={{alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 40}}>
        <FontAwesome6 name="utensils" size={48} color={theme.secondaryText} iconStyle="solid" />
        <Text style={[typography.body, {color: theme.secondaryText, marginTop: 12}]}>급식 데이터가 없어요.</Text>
        <Text style={[typography.caption, {color: theme.secondaryText, marginTop: 4}]}>학교에서 제공하지 않는 경우도 있어요.</Text>
      </View>
    );
  }, [theme, typography]);

  // 급식 데이터가 없을 때 Toast 표시 (더 이상 불러올 데이터도 없을 때만)
  useEffect(() => {
    if (!loading && !loadingMore && meal.length === 0 && !hasMore) {
      showToast('급식이 없습니다.');
    }
  }, [loading, loadingMore, meal.length, hasMore]);

  const renderHeader = useCallback(() => (
    <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />
  ), []);

  return loading ? (
    <Loading fullScreen />
  ) : (
    <>
      <View style={{flex: 1, backgroundColor: theme.background}}>
        <FlatList
          ref={flatListRef}
          data={meal}
          renderItem={renderMealItem}
          keyExtractor={(item, index) => `${item.date}-${item.type}-${index}`}
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

      {isBottomSheetOpen && (
        <BottomSheet
          backdropComponent={renderBackdrop}
          ref={bottomSheetRef}
          index={-1}
          enablePanDownToClose
          onClose={() => setIsBottomSheetOpen(false)}
          backgroundStyle={{backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}}
          handleIndicatorStyle={{backgroundColor: theme.secondaryText}}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore">
          <BottomSheetView style={{paddingHorizontal: 18, paddingBottom: 12, gap: 16, backgroundColor: theme.card, justifyContent: 'center'}}>
            <Content
              title="복사하기"
              arrow
              onPress={() => {
                analytics().logEvent('meal_copy');
                Clipboard.setString(`🍴${schoolName} ${selectedMealDate} 급식\n\n- ${selectedMeal.split('\n').join('\n- ')}`);
                showToast('클립보드에 복사되었어요.');
                bottomSheetRef.current?.close();
                setIsBottomSheetOpen(false);
              }}
            />
            <Content
              title="텍스트로 공유하기"
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
                setIsBottomSheetOpen(false);
              }}
            />
            <Content
              title="이미지로 공유하기"
              arrow
              onPress={() => {
                analytics().logEvent('meal_instagram_share');
                navigation.navigate('Share', {data: {meal: selectedMeal, date: selectedMealDate, school: schoolName}});
                bottomSheetRef.current?.close();
                setIsBottomSheetOpen(false);
              }}
            />
          </BottomSheetView>
        </BottomSheet>
      )}
    </>
  );
};

const MealCard = ({date, isToday, meal, mealType, showAllergy, onLongPress}: {date: dayjs.Dayjs; isToday: boolean; meal: MealType; mealType?: string; showAllergy: boolean; onLongPress: () => void}) => {
  const {theme, typography} = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const getMealTypeColor = (mealType?: string) => {
    if (!mealType) return theme.primaryText;

    if (mealType.includes('조식')) return '#FF9500'; // 주황색
    if (mealType.includes('중식')) return theme.highlight; // 파란색
    if (mealType.includes('석식')) return theme.highlightSecondary; // 보라색
    return theme.primaryText;
  };

  const renderMealItem = (mealItem: string | MealItem, index: number) => {
    if (typeof mealItem === 'string') {
      return (
        <View key={index} style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <View style={{width: 4, height: 4, borderRadius: 2, backgroundColor: theme.secondaryText}} />
          <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300', flex: 1}]}>{mealItem}</Text>
        </View>
      );
    }

    const allergyInfo = showAllergy && mealItem.allergy && mealItem.allergy.length > 0 ? ` ${mealItem.allergy.map(allergy => allergy.code).join(', ')}` : '';

    return (
      <View key={index} style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <View style={{width: 4, height: 4, borderRadius: 2, backgroundColor: theme.secondaryText}} />
        <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300', flex: 1}]}>
          {mealItem.food}
          <Text style={[typography.small, {color: theme.secondaryText}]}>{allergyInfo}</Text>
        </Text>
      </View>
    );
  };

  const mealData = meal.meal.filter(mealItem => typeof mealItem === 'string' || (mealItem as MealItem).food !== '');
  const mealText = mealData.map(mealItem => (typeof mealItem === 'string' ? mealItem : (mealItem as MealItem).food)).join('\n');
  const schoolName = useRef<string>('알 수 없음');

  useEffect(() => {
    (async () => {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
      schoolName.current = school.schoolName;
    })();
  }, []);

  const handleShare = () => {
    trigger('impactLight');
    navigation.navigate('Share', {data: {meal: mealText, date: date.format('M월 D일 ddd요일'), school: schoolName.current}});
  };

  return (
    <TouchableScale onLongPress={onLongPress} activeScale={0.98} tension={100} friction={10} style={{marginBottom: 4}}>
      <View
        style={{
          backgroundColor: isToday ? `${theme.highlight}10` : theme.card,
          borderRadius: 16,
          padding: 20,
          borderWidth: isToday ? 1 : 0,
          borderColor: isToday ? `${theme.highlight}80` : 'transparent',
        }}>
        {/* 날짜 헤더 */}
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1}}>
            <Text
              style={[
                typography.subtitle,
                {
                  color: theme.primaryText,
                  fontWeight: '600',
                },
              ]}>
              {date.format('M월 D일 (ddd)')}
            </Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>{mealType && <Text style={[typography.caption, {color: getMealTypeColor(mealType), fontWeight: '600'}]}>{mealType}</Text>}</View>
        </View>

        {/* 급식 내용 */}
        <View style={{gap: 2}}>{meal.meal.map((item, idx) => renderMealItem(item, idx))}</View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border}}>
          {/* 열량 정보가 있으면 표시 */}
          {meal.calorie && <Text style={[typography.caption, {color: theme.secondaryText}]}>{meal.calorie} kcal</Text>}
          <TouchableOpacity onPress={handleShare} style={{padding: 4}} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <FontAwesome6 name="share-from-square" size={14} color={theme.secondaryText} iconStyle="solid" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableScale>
  );
};

export default Meal;
