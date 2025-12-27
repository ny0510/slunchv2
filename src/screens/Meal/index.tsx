import { ANDROID_HOME_BANNER_AD_UNIT_ID, IOS_HOME_BANNER_AD_UNIT_ID } from '@env';
import dayjs from 'dayjs';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, Text, View } from 'react-native';
import { trigger } from 'react-native-haptic-feedback';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import BottomSheet from '@gorhom/bottom-sheet';

import BannerAdCard from '@/components/BannerAdCard';
import Loading from '@/components/Loading';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/lib/toast';
import { Meal as MealType } from '@/types/api';
import { MealItem } from '@/types/meal';

import MealCard from './components/MealCard';
import MealBottomSheet from './components/MealBottomSheet';
import { useMealData } from './hooks/useMealData';

const AD_FREQUENCY = 4;
const MAX_ADS = 10;

const Meal = () => {
  const { theme, typography } = useTheme();
  const {
    meal,
    showAllergy,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    onRefresh,
    loadMore,
  } = useMealData();

  const [selectedMeal, setSelectedMeal] = useState<string>('');
  const [selectedMealDate, setSelectedMealDate] = useState<string>('');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const flatListRef = useRef<FlatList | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    analytics().logScreenView({ screen_name: '급식 상세 페이지', screen_class: 'Meal' });
  }, []);

  const openBottomSheet = useCallback((_meal: string, date: string) => {
    trigger('impactLight');
    setSelectedMeal(_meal);
    setSelectedMealDate(date);
    setIsBottomSheetOpen(true);

    // Small delay to ensure the bottom sheet is fully mounted if it was closed
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(0);
    }, 50);
  }, []);

  const renderMealItem = useCallback(({ item: m, index }: { item: MealType; index: number }) => {
    const isToday = dayjs().isSame(m.date, 'day');
    const date = dayjs(m.date);
    const mealData = m.meal.filter(mealItem => typeof mealItem === 'string' || (mealItem as MealItem).food !== '');
    const mealText = mealData.map(mealItem => (typeof mealItem === 'string' ? mealItem : (mealItem as MealItem).food)).join('\n');

    const shouldShowAd = AD_FREQUENCY > 0 && index > 0 && index % AD_FREQUENCY === 0 && Math.floor(index / AD_FREQUENCY) <= MAX_ADS;

    return (
      <Fragment key={`${m.date}-${m.type}-${index}`}>
        {shouldShowAd && <View style={{ marginBottom: 16 }}>
          <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />
        </View>}
        <MealCard
          date={date}
          isToday={isToday}
          meal={m}
          mealType={m.type}
          showAllergy={showAllergy}
          onLongPress={() => openBottomSheet(mealText, date.format('M월 D일 ddd요일'))}
        />
      </Fragment>
    );
  }, [showAllergy, openBottomSheet]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={theme.highlight} />
        <Text style={[typography.caption, { color: theme.secondaryText, marginTop: 8 }]}>더 불러오는 중...</Text>
      </View>
    );
  }, [loadingMore, theme, typography]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 40 }}>
        <FontAwesome6 name="utensils" size={48} color={theme.secondaryText} iconStyle="solid" />
        <Text style={[typography.body, { color: theme.secondaryText, marginTop: 12 }]}>급식 데이터가 없어요.</Text>
        <Text style={[typography.caption, { color: theme.secondaryText, marginTop: 4 }]}>학교에서 제공하지 않는 경우도 있어요.</Text>
      </View>
    );
  }, [loading, theme, typography]);

  useEffect(() => {
    if (!loading && !loadingMore && meal.length === 0 && !hasMore) {
      showToast('급식이 없습니다.');
    }
  }, [loading, loadingMore, meal.length, hasMore]);

  const renderHeader = useCallback(() => (
    <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />
  ), []);

  if (loading && meal.length === 0) {
    return <Loading fullScreen />;
  }

  return (
    <>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <FlatList
          ref={flatListRef}
          data={meal}
          renderItem={renderMealItem}
          keyExtractor={(item, index) => `${item.date}-${item.type}-${index}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
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
        <MealBottomSheet
          ref={bottomSheetRef}
          selectedMeal={selectedMeal}
          selectedMealDate={selectedMealDate}
          onClose={() => setIsBottomSheetOpen(false)}
        />
      )}
    </>
  );
};

export default Meal;
