import {ANDROID_HOME_BANNER_AD_UNIT_ID, IOS_HOME_BANNER_AD_UNIT_ID} from '@env';
import dayjs from 'dayjs';
import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react';
import {Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import {trigger} from 'react-native-haptic-feedback';
import Share from 'react-native-share';
import TouchableScale from 'react-native-touchable-scale';

import Content from '../Tab/Settings/components/Content';
import {getMeal} from '@/api';
import BannerAdCard from '@/components/BannerAdCard';
import Card from '@/components/Card';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
import {useTheme} from '@/contexts/ThemeContext';
import {clearCache} from '@/lib/cache';
import {STORAGE_KEYS, StorageHelper} from '@/lib/storage';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import {Meal as MealType} from '@/types/api';
import {MealItem} from '@/types/meal';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const Meal = () => {
  const [meal, setMeal] = useState<MealType[]>([]);
  const [showAllergy, setShowAllergy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [schoolName, setSchoolName] = useState<string>('알 수 없음');
  const [selectedMeal, setSelectedMeal] = useState<string>('');
  const [selectedMealDate, setSelectedMealDate] = useState<string>('');

  const {theme, typography} = useTheme();
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
    const settings = await StorageHelper.getItem<{showAllergy?: boolean}>(STORAGE_KEYS.SETTINGS, {});
    const today = dayjs();
    const allergyPreference = settings.showAllergy ?? true;
    setShowAllergy(allergyPreference);

    try {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');

      const mealResponse = await getMeal(school.neisCode, school.neisRegionCode, parseInt(today.format('YYYY')), parseInt(today.format('MM')), undefined, allergyPreference, true, true);
      const afterToday = mealResponse.filter(m => dayjs(m.date).isSame(today, 'day') || dayjs(m.date).isAfter(today, 'day'));
      if (afterToday.length === 0) {
        showToast('급식이 없습니다.');
        return;
      }
      setMeal(afterToday);
    } catch (e: any) {
      console.error('Error fetching data:', e);

      // 521 오류 체크
      if (e?.response?.status === 521) {
        showToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      } else {
        showToast('급식을 불러오는 중 오류가 발생했어요.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 화면 포커스 시 알레르기 설정 확인 및 데이터 재로드
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);

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
        <Text key={index} style={[typography.body, {color: theme.primaryText, fontWeight: '300'}]}>
          - {mealItem}
        </Text>
      );
    }

    const allergyInfo = showAllergy && mealItem.allergy && mealItem.allergy.length > 0 ? ` ${mealItem.allergy.map(allergy => allergy.code).join(', ')}` : '';

    return (
      <Text key={index} style={[typography.body, {color: theme.primaryText, fontWeight: '300'}]}>
        - {mealItem.food}
        <Text style={[typography.small, {color: theme.secondaryText}]}>{allergyInfo}</Text>
      </Text>
    );
  };

  const openBottomSheet = (_meal: string, date: string) => {
    trigger('impactLight');
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
      <Container scrollView bounce={!loading} scrollViewRef={scrollViewRef} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondaryText} />}>
        <View style={{gap: 12, width: '100%'}}>
          {meal?.length > 0 ? (
            (() => {
              // mealCount에 비례하여 광고 개수 동적 계산 (5개마다 1개, 최소 1개, 최대 10개)
              const mealCount = meal.length;
              const MAX_ADS = 10;
              const MIN_ADS = 1;
              const adsToShow = Math.max(MIN_ADS, Math.min(MAX_ADS, Math.floor(mealCount / 5)));
              const adIndexes = mealCount <= 1 ? [] : Array.from({length: adsToShow}, (_, idx) => Math.round(((idx + 1) * mealCount) / (adsToShow + 1)));

              return meal.map((m, i) => {
                const date = dayjs(m.date).format('M월 D일 ddd요일');
                const mealData = m.meal.filter(mealItem => typeof mealItem === 'string' || (mealItem as MealItem).food !== '');
                const mealText = mealData.map(mealItem => (typeof mealItem === 'string' ? mealItem : (mealItem as MealItem).food)).join('\n');

                const shouldShowAd = adIndexes.includes(i);

                return (
                  <Fragment key={i}>
                    {shouldShowAd && <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />}
                    <TouchableScale onLongPress={() => openBottomSheet(mealText, date)} activeScale={0.98} tension={40} friction={3}>
                      <Card
                        title={date}
                        titleRight={
                          <TouchableOpacity onPress={() => openBottomSheet(mealText, date)} style={{padding: 4}} accessibilityLabel="급식 공유">
                            <FontAwesome6 name="share" size={14} color={theme.secondaryText} iconStyle="solid" />
                          </TouchableOpacity>
                        }>
                        <FlatList data={m.meal} renderItem={({item, index}) => renderMealItem(item, index)} scrollEnabled={false} />
                      </Card>
                    </TouchableScale>
                  </Fragment>
                );
              });
            })()
          ) : (
            <View style={{alignItems: 'center', justifyContent: 'center', width: '100%'}}>
              <Text style={[typography.baseTextStyle, {color: theme.primaryText, fontWeight: '300', fontSize: 16}]}>급식 데이터가 없어요.</Text>
            </View>
          )}
        </View>
      </Container>

      <BottomSheet backdropComponent={renderBackdrop} ref={bottomSheetRef} index={-1} enablePanDownToClose backgroundStyle={{backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}} handleIndicatorStyle={{backgroundColor: theme.secondaryText}}>
        <BottomSheetView style={{paddingHorizontal: 18, paddingVertical: 20, gap: 16, backgroundColor: theme.card, justifyContent: 'center'}}>
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
            }}
          />
          <Content
            title="이미지로 공유하기"
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
