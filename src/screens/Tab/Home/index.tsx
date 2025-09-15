import {ANDROID_HOME_BANNER_AD_UNIT_ID, IOS_HOME_BANNER_AD_UNIT_ID} from '@env';
import dayjs from 'dayjs';
import React, {Fragment, ReactNode, useCallback, useEffect} from 'react';
import {AppState, FlatList, Keyboard, Platform, RefreshControl, Text, TouchableOpacity, View} from 'react-native';
import {trigger} from 'react-native-haptic-feedback';
import Midnight from 'react-native-midnight';

import HomeCard from './components/HomeCard';
import LoadingView from './components/LoadingView';
import ScheduleItem from './components/ScheduleItem';
import TimetableRow from './components/TimetableRow';
import {useHomeData} from './hooks/useHomeData';
import {useTimeTableEditor} from './hooks/useTimeTableEditor';
import {styles as s} from './styles';
import Logo from '@/assets/images/logo.svg';
import BannerAdCard from '@/components/BannerAdCard';
import Card from '@/components/Card';
import Container from '@/components/Container';
import EmptyState from '@/components/EmptyState';
import {SkeletonCard} from '@/components/SkeletonLoader';
import {useTheme} from '@/contexts/ThemeContext';
import {useUser} from '@/contexts/UserContext';
import {clearCache} from '@/lib/cache';
import {STORAGE_KEYS, StorageHelper} from '@/lib/storage';
import {RootStackParamList} from '@/navigation/RootStacks';
import {MealItem} from '@/types/meal';
import BottomSheet, {BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView} from '@gorhom/bottom-sheet';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const Home = () => {
  const {theme, typography} = useTheme();
  const {schoolInfo} = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // 홈 데이터 관리 훅
  const {timetable, meal, schedules, loading, refreshing, showAllergy, todayIndex, mealDayOffset, setMidnightTrigger, fetchData, handleRefresh, dispatch} = useHomeData();

  // 시간표 편집 훅
  const {selectedSubject, selectedSubjectIndices, tempSubject, bottomSheetRef, handleSubjectSelect, updateTempSubject, saveSubject, resetSubject, closeBottomSheet} = useTimeTableEditor(timetable, newTimetable => {
    dispatch({type: 'SET_TIMETABLE', payload: newTimetable});
  });

  // 중복된 함수들은 훅으로 이동됨

  // 새로고침 시 캐시 정리 추가
  const onRefresh = useCallback(async () => {
    await clearCache('@cache/');
    await handleRefresh();
  }, [handleRefresh]);

  useEffect(() => {
    analytics().logScreenView({screen_name: '홈', screen_class: 'Home'});
  }, []);

  // 탭 이동 시 BottomSheet 자동 닫힘
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', closeBottomSheet);
    return unsubscribe;
  }, [navigation, closeBottomSheet]);

  // 화면 포커스 시 알레르기 설정 다시 로드
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      // 설정 다시 로드하여 알레르기 표시 여부 업데이트
      const settings = await StorageHelper.getItem<{showAllergy?: boolean}>(STORAGE_KEYS.SETTINGS, {});
      const currentShowAllergy = settings.showAllergy ?? true;

      // 설정이 변경되었으면 데이터 다시 가져오기
      if (currentShowAllergy !== showAllergy) {
        await fetchData(currentShowAllergy);
      }
    });
    return unsubscribe;
  }, [navigation, showAllergy, fetchData]);

  // 매일 자정마다 오늘 인덱스 업데이트
  useEffect(() => {
    const listener = Midnight.addListener(() => setMidnightTrigger(prev => !prev));
    return () => listener.remove();
  }, []);

  // 시간표가 변경될 때 저장 (useHomeData와 useTimeTableEditor에서 처리됨)

  const renderMealItem = (mealItem: string | MealItem, index: number) => {
    if (typeof mealItem === 'string') {
      return (
        <Text key={index} style={[typography.body, {color: theme.primaryText, fontWeight: 300}]}>
          - {mealItem}
        </Text>
      );
    }

    const allergyInfo = showAllergy && mealItem.allergy && mealItem.allergy.length > 0 ? ` ${mealItem.allergy.map(allergy => allergy.code).join(', ')}` : '';

    return (
      <Text key={index} style={[typography.body, {color: theme.primaryText, fontWeight: 300}]}>
        - {mealItem.food}
        <Text style={[typography.small, {color: theme.secondaryText}]}>{allergyInfo}</Text>
      </Text>
    );
  };

  const handleSheetChanges = useCallback(
    async (index: number) => {
      if (index === -1) {
        // BottomSheet가 닫힐 때 변경 사항 저장
        if (tempSubject && selectedSubject && (tempSubject.subject !== selectedSubject.subject || tempSubject.teacher !== selectedSubject.teacher)) {
          await saveSubject();
        }
        closeBottomSheet();
      }
    },
    [closeBottomSheet, saveSubject, tempSubject, selectedSubject],
  );

  const openBottomSheet = useCallback(
    ({row, col}: {row: number; col: number}) => {
      trigger('impactLight');
      handleSubjectSelect(timetable[row]?.[col] || null, row, col);
    },
    [timetable, handleSubjectSelect],
  );

  const renderBackdrop = useCallback(
    (props: Parameters<typeof BottomSheetBackdrop>[0]) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        disappearsOnIndex={-1}
        onPress={() => {
          Keyboard.dismiss();
          if (props.onPress) {
            props.onPress();
          }
        }}
      />
    ),
    [],
  );

  return (
    <Fragment>
      <Container bounce scrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondaryText} />}>
        <View style={s.container}>
          <View style={s.header}>
            <Logo width={24} height={24} />
            <Text style={[typography.subtitle, {color: theme.primaryText}]}>{schoolInfo.schoolName || '학교 정보 없음'}</Text>
          </View>

          <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />

          <HomeCard title="학사일정" titleIcon={<FontAwesome6 name="calendar" size={16} color={theme.primaryText} iconStyle="solid" />} arrow onPress={() => navigation.navigate('Schedules')}>
            {loading ? (
              <View style={{gap: 8}}>
                <SkeletonCard />
              </View>
            ) : schedules.length === 0 ? (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8}}>
                <FontAwesome6 name="calendar-xmark" size={16} color={theme.secondaryText} iconStyle="regular" />
                <Text style={[typography.body, {color: theme.secondaryText, fontWeight: '300'}]}>학사일정이 없어요</Text>
              </View>
            ) : (
              <FlatList data={schedules} renderItem={({item}) => <ScheduleItem item={item} />} scrollEnabled={false} />
            )}
          </HomeCard>
          <HomeCard title="급식" titleIcon={<FontAwesome6 name="utensils" size={16} color={theme.primaryText} iconStyle="solid" />} arrow onPress={() => navigation.navigate('Meal')}>
            {loading ? (
              <View style={{gap: 8}}>
                <SkeletonCard />
              </View>
            ) : meal.length === 0 ? (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8}}>
                <FontAwesome6 name="utensils" size={16} color={theme.secondaryText} iconStyle="solid" />
                <Text style={[typography.body, {color: theme.secondaryText, fontWeight: '300'}]}>급식 정보가 없어요</Text>
              </View>
            ) : (
              <View style={{gap: 4}}>
                <FlatList data={meal} renderItem={({item}) => <View>{item.meal.map(renderMealItem)}</View>} scrollEnabled={false} />
                {mealDayOffset > 0 && (
                  <Text style={[typography.caption, {color: theme.secondaryText, marginTop: 4}]}>
                    {mealDayOffset}일 뒤, {dayjs().add(mealDayOffset, 'day').format('dddd')} 급식이에요.
                  </Text>
                )}
              </View>
            )}
          </HomeCard>
          <Card title="시간표" subtitle="길게 눌러 편집" titleIcon={<FontAwesome6 name="table" size={16} color={theme.primaryText} iconStyle="solid" />}>
            {loading ? (
              <LoadingView height={250} />
            ) : timetable.length === 0 ? (
              <EmptyState icon="table" title="시간표가 없어요" subtitle="이번 주 시간표가 등록되지 않았습니다" style={{padding: 16}} />
            ) : (
              <FlatList data={timetable} contentContainerStyle={{gap: 3}} renderItem={({item, index}) => <TimetableRow item={item} index={index} todayIndex={todayIndex} openBottomSheet={openBottomSheet} />} scrollEnabled={false} />
            )}
          </Card>
        </View>
      </Container>

      <BottomSheet
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backdropComponent={renderBackdrop}
        ref={bottomSheetRef}
        index={-1}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backgroundStyle={{backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}}
        handleIndicatorStyle={{backgroundColor: theme.secondaryText}}>
        <BottomSheetView style={{padding: 18, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', gap: 8}}>
          <View style={{gap: 4, width: '100%'}}>
            <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '600', alignSelf: 'flex-start'}]}>과목명 변경</Text>
            <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300', alignSelf: 'flex-start'}]}>시간표가 알맞지 않다면 직접 변경해주세요.</Text>
          </View>
          <View style={{flexDirection: 'row', gap: 8, width: '100%'}}>
            <BottomSheetTextInput
              style={{
                flex: 1,
                backgroundColor: theme.background,
                color: theme.primaryText,
                fontSize: 16,
                fontWeight: '500',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              maxLength={5}
              placeholder="과목명"
              placeholderTextColor={theme.secondaryText}
              onChangeText={text => {
                if (selectedSubjectIndices && tempSubject) {
                  const formattedText = text === '없음' ? '-' : text;
                  updateTempSubject(formattedText, tempSubject.teacher);
                }
              }}
              value={tempSubject ? tempSubject.subject : ''}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="done"
            />
            <BottomSheetTextInput
              style={{
                flex: 1,
                backgroundColor: theme.background,
                color: theme.primaryText,
                fontSize: 16,
                fontWeight: '500',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              maxLength={5}
              placeholder="선생님"
              placeholderTextColor={theme.secondaryText}
              onChangeText={text => {
                if (selectedSubjectIndices && tempSubject) {
                  updateTempSubject(tempSubject.subject, text);
                }
              }}
              value={tempSubject ? tempSubject.teacher : ''}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            delayPressIn={0}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            style={{backgroundColor: theme.background, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.border, width: '100%', minHeight: 44}}
            onPress={resetSubject}>
            <Text style={[typography.baseTextStyle, {color: theme.primaryText, textAlign: 'center', fontWeight: '600'}]}>원래 시간표로 되돌리기</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </Fragment>
  );
};

export default Home;
