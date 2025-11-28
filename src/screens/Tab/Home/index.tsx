import { ANDROID_HOME_BANNER_AD_UNIT_ID, IOS_HOME_BANNER_AD_UNIT_ID } from '@env';
import dayjs from 'dayjs';
import React, { Fragment, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, FlatList, Keyboard, Platform, RefreshControl, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { OpacityDecorator, RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { trigger } from 'react-native-haptic-feedback';
import Midnight from 'react-native-midnight';
import TouchableScale from 'react-native-touchable-scale';

import { styles as s } from './styles';
import { getMeal, getSchedules, getTimetable } from '@/api';
import Logo from '@/assets/images/logo.svg';
import SunrinLogo from '@/assets/images/sunrin.svg';
import BannerAdCard from '@/components/BannerAdCard';
import Card from '@/components/Card';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
// import TouchableScale from '@/components/TouchableScale';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { clearCache } from '@/lib/cache';
import { showToast } from '@/lib/toast';
import { RootStackParamList } from '@/navigation/RootStacks';
import { Meal, Schedule, Timetable } from '@/types/api';
import { MealItem } from '@/types/meal';
import BottomSheet, { BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import 'dayjs/locale/ko';
import { Switch } from 'react-native-gesture-handler';
import ToggleSwitch from '@/components/ToggleSwitch';

interface CardData {
  id: 'schedule' | 'meal' | 'timetable';
  title: string;
  iconName: string;
}

const Home = ({ setScrollRef }: { setScrollRef?: (ref: any) => void }) => {
  const [timetable, setTimetable] = useState<Timetable[][]>([]);
  const [meal, setMeal] = useState<Meal[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showAllergy, setShowAllergy] = useState<boolean>(true);
  const [prevShowAllergy, setPrevShowAllergy] = useState<boolean>(true);
  const [loadingTimetable, setLoadingTimetable] = useState<boolean>(true);
  const [loadingMeal, setLoadingMeal] = useState<boolean>(true);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(true);
  const [todayIndex, setTodayIndex] = useState<number>(dayjs().day() - 1);
  const [mealDayOffset, setMealDayOffset] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<Timetable | null>(null);
  const [selectedSubjectIndices, setSelectedSubjectIndices] = useState<{ row: number; col: number } | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isNextWeek, setIsNextWeek] = useState(false);
  const [cardOrder, setCardOrder] = useState<CardData[]>([
    { id: 'schedule', title: '학사일정', iconName: 'calendar' },
    { id: 'meal', title: '급식', iconName: 'utensils' },
    { id: 'timetable', title: '시간표', iconName: 'table' },
  ]);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const backPressedOnceRef = useRef(false);
  const scrollViewRef = useRef<any>(null);

  const { theme, typography } = useTheme();
  const { schoolInfo, classInfo, classChangedTrigger, setClassChangedTrigger } = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Use the scroll-to-top hook
  useScrollToTop(scrollViewRef, setScrollRef);

  // Load saved card order
  useEffect(() => {
    AsyncStorage.getItem('homeCardOrder').then(savedOrder => {
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          setCardOrder(parsedOrder);
        } catch (error) {
          console.error('Failed to parse saved card order:', error);
        }
      }
    });
  }, []);

  // Save card order when it changes
  const handleCardOrderChange = useCallback((newOrder: CardData[]) => {
    setCardOrder(newOrder);
    AsyncStorage.setItem('homeCardOrder', JSON.stringify(newOrder));
  }, []);

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    trigger('impactLight');
    setIsEditMode(prev => !prev);
  }, []);

  // Handle card long press
  const handleCardLongPress = useCallback(() => {
    if (!isEditMode) {
      toggleEditMode();
    }
  }, [isEditMode, toggleEditMode]);

  const getSettings = useCallback(async () => {
    const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
    const newShowAllergy = settings.showAllergy || false;
    setPrevShowAllergy(showAllergy);
    setShowAllergy(newShowAllergy);
    return newShowAllergy;
  }, [showAllergy]);

  const transpose = useCallback((array: Timetable[][]) => {
    const maxColLength = Math.max(...array.map(row => row.length));
    return Array.from({ length: maxColLength }, (_, colIndex) =>
      array.map(row => {
        const entry = row[colIndex];
        if (!entry) {
          return { subject: '-', teacher: '-', changed: false };
        }
        return {
          ...entry,
          subject: entry.subject === '없음' ? '-' : entry.subject,
          teacher: entry.teacher === '없음' ? '-' : entry.teacher,
        };
      }),
    );
  }, []);

  const fetchTimetable = useCallback(async () => {
    if (!schoolInfo.comciganCode || !classInfo.grade || !classInfo.class) {
      setLoadingTimetable(false);
      return;
    }

    setLoadingTimetable(true);
    try {
      const timetableResult = await getTimetable(schoolInfo.comciganCode, classInfo.grade, classInfo.class, isNextWeek);
      const newTimetable = transpose(timetableResult);

      // 기존 커스텀 시간표가 있는 경우, 사용자가 변경한 항목만 보존
      const existingCustomTimetable = JSON.parse((await AsyncStorage.getItem('customTimetable')) || 'null');

      if (existingCustomTimetable) {
        const mergedTimetable = newTimetable.map((row, rowIndex) =>
          row.map((subject, colIndex) => {
            const existingSubject = existingCustomTimetable[rowIndex]?.[colIndex];
            // userChanged가 true인 항목만 보존
            if (existingSubject?.userChanged) {
              return existingSubject;
            }
            return subject;
          }),
        );
        setTimetable(mergedTimetable);
      } else {
        setTimetable(newTimetable);
      }
    } catch (e) {
      console.error('Error fetching timetable:', e);
      showToast('시간표를 불러오는 중 오류가 발생했어요.');
    } finally {
      setLoadingTimetable(false);
    }
  }, [schoolInfo.comciganCode, classInfo.grade, classInfo.class, isNextWeek, transpose]);

  const fetchMeal = useCallback(async () => {
    if (!schoolInfo.neisCode || !schoolInfo.neisRegionCode) {
      setLoadingMeal(false);
      return;
    }

    setLoadingMeal(true);
    const currentShowAllergy = await getSettings();

    try {
      const today = dayjs();
      let mealResponse = await getMeal(schoolInfo.neisCode, schoolInfo.neisRegionCode, today.format('YYYY'), today.format('MM'), today.format('DD'), currentShowAllergy, true, true);
      const isPastNoon = today.hour() > 14;
      setMealDayOffset(0);

      if (mealResponse.length === 0 || isPastNoon) {
        // 병렬로 다음 3일 확인
        const nextDayPromises = [1, 2, 3].map(async i => {
          const nextDay = today.add(i, 'day');
          try {
            const data = await getMeal(schoolInfo.neisCode, schoolInfo.neisRegionCode, nextDay.format('YYYY'), nextDay.format('MM'), nextDay.format('DD'), currentShowAllergy, true, true);
            return { data, offset: i };
          } catch {
            return { data: [], offset: i };
          }
        });

        const nextDayResults = await Promise.all(nextDayPromises);
        const validResult = nextDayResults.find(result => result.data.length > 0);

        if (validResult) {
          mealResponse = validResult.data;
          setMealDayOffset(validResult.offset);
        }
      }
      setMeal(mealResponse);
    } catch (e) {
      console.error('Error fetching meal:', e);
      showToast('급식을 불러오는 중 오류가 발생했어요.');
    } finally {
      setLoadingMeal(false);
    }
  }, [schoolInfo.neisCode, schoolInfo.neisRegionCode, getSettings]);

  const fetchSchedules = useCallback(async () => {
    if (!schoolInfo.neisCode || !schoolInfo.neisRegionCode) {
      setLoadingSchedule(false);
      return;
    }

    setLoadingSchedule(true);
    try {
      const today = dayjs();
      const scheduleResult = await getSchedules(schoolInfo.neisCode, schoolInfo.neisRegionCode, today.format('YYYY'), today.format('MM'));
      const scheduleResponse =
        scheduleResult?.length > 0
          ? scheduleResult.filter(schedule => {
            const startDate = dayjs(schedule.date.start);
            const endDate = dayjs(schedule.date.end || schedule.date.start);
            // 오늘이 일정 기간 내에 있거나 아직 시작하지 않은 일정만 표시
            return startDate.isSameOrAfter(today, 'day') || (startDate.isBefore(today, 'day') && endDate.isSameOrAfter(today, 'day'));
          })
          : [];
      setSchedules(scheduleResponse);
    } catch (e) {
      console.error('Error fetching schedules:', e);
      showToast('학사일정을 불러오는 중 오류가 발생했어요.');
    } finally {
      setLoadingSchedule(false);
    }
  }, [schoolInfo.neisCode, schoolInfo.neisRegionCode]);

  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchTimetable(), fetchMeal(), fetchSchedules()]);
  }, [fetchTimetable, fetchMeal, fetchSchedules]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await clearCache('@cache/');
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  useEffect(() => {
    analytics().logScreenView({ screen_name: '홈', screen_class: 'Home' });
  }, []);

  // Android 뒤로가기 버튼 처리
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const onBackPress = () => {
          // Bottom Sheet가 열려있으면 먼저 닫기
          if (isBottomSheetOpen) {
            bottomSheetRef.current?.close();
            setIsBottomSheetOpen(false);
            return true;
          }

          // Edit mode가 활성화되어 있으면 비활성화
          if (isEditMode) {
            setIsEditMode(false);
            return true;
          }

          // 앱 종료 로직
          if (backPressedOnceRef.current) {
            BackHandler.exitApp();
            return true;
          }
          backPressedOnceRef.current = true;
          ToastAndroid.show('뒤로가기를 한 번 더 누르면 종료돼요.', ToastAndroid.SHORT);
          setTimeout(() => (backPressedOnceRef.current = false), 2000);
          return true;
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }
    }, [isBottomSheetOpen, isEditMode]),
  );

  // 탭 이동 시 BottomSheet 자동 닫힘
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (bottomSheetRef.current) {
        bottomSheetRef.current.close();
      }
      setIsBottomSheetOpen(false);
    });
    return unsubscribe;
  }, [navigation]);

  // 다른 탭에 있다 홈으로 이동시 classChangedTrigger가 true라면 데이터 갱신
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      // Always reload allergy settings when screen is focused
      const newShowAllergy = await getSettings();
      const allergySettingChanged = prevShowAllergy !== newShowAllergy;

      // If allergy setting changed or classChangedTrigger is true, refresh data
      if (classChangedTrigger || allergySettingChanged) {
        setRefreshing(true);
        // Clear cache if allergy setting changed
        if (allergySettingChanged) {
          await clearCache('@cache/meal_');
        } else {
          await clearCache('@cache/');
        }
        await fetchAllData();
        setRefreshing(false);
        if (classChangedTrigger) {
          setClassChangedTrigger(false);
        }
      }
    });
    return unsubscribe;
  }, [navigation, classChangedTrigger, setClassChangedTrigger, fetchAllData, getSettings, prevShowAllergy]);

  // 매일 자정마다 데이터를 갱신
  useEffect(() => {
    const listener = Midnight.addListener(() => {
      setTodayIndex(dayjs().day() - 1);
      fetchAllData();
    });
    return () => listener.remove();
  }, [fetchAllData]);

  // 앱이 백그라운드에서 포그라운드로 돌아올 때 데이터를 갱신
  useEffect(() => {
    const checkOnForeground = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        fetchAllData();
      }
    });

    return () => checkOnForeground.remove();
  }, [fetchAllData]);

  // 초기 데이터 로드 (시간표 제외 - isNextWeek 변경 시 별도 로드)
  useEffect(() => {
    setTodayIndex(dayjs().day() - 1);
    fetchMeal();
    fetchSchedules();
  }, [fetchMeal, fetchSchedules]);

  // 시간표는 isNextWeek 변경 시에도 로드
  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  useEffect(() => {
    if (timetable.length > 0) {
      AsyncStorage.setItem('customTimetable', JSON.stringify(timetable));
    }
  }, [timetable]);

  const renderMealItem = (mealItem: string | MealItem, index: number) => {
    if (typeof mealItem === 'string') {
      return (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.secondaryText }} />
          <Text style={[typography.body, { color: theme.primaryText, fontWeight: '300', flex: 1 }]}>{mealItem}</Text>
        </View>
      );
    }

    const allergyInfo = showAllergy && mealItem.allergy && mealItem.allergy.length > 0 ? ` ${mealItem.allergy.map(allergy => allergy.code).join(', ')}` : '';

    return (
      <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.secondaryText }} />
        <Text style={[typography.body, { color: theme.primaryText, fontWeight: '300', flex: 1 }]}>
          {mealItem.food}
          <Text style={{ fontSize: 12, color: theme.secondaryText }}>{allergyInfo}</Text>
        </Text>
      </View>
    );
  };

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setSelectedSubject(null);
        setSelectedSubjectIndices(null);
        showToast('시간표가 변경되었어요.');
      }
    },
    [setSelectedSubject, setSelectedSubjectIndices],
  );

  // 키보드가 닫힐 때 BottomSheet 위치 재설정
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (isBottomSheetOpen && bottomSheetRef.current) {
        bottomSheetRef.current.snapToIndex(0);
      }
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, [isBottomSheetOpen]);

  const openBottomSheet = ({ row, col }: { row: number; col: number }) => {
    trigger('impactLight');
    setSelectedSubject(timetable[row]?.[col] || null);
    setSelectedSubjectIndices({ row, col });
    setIsBottomSheetOpen(true);
  };

  // Open bottom sheet after it mounts
  useEffect(() => {
    if (isBottomSheetOpen && bottomSheetRef.current) {
      const timer = setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isBottomSheetOpen]);

  // Render placeholder for dragged item
  const renderPlaceholder = useCallback(() => {
    return (
      <View
        style={{
          backgroundColor: theme.border,
          borderRadius: 16,
          height: 100,
          opacity: 0.3,
          borderWidth: 2,
          borderColor: theme.primaryText,
          borderStyle: 'dashed',
        }}
      />
    );
  }, [theme]);

  // Render draggable card item
  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<CardData>) => {
      // In edit mode, all cards are draggable with long press
      if (item.id === 'timetable') {
        return (
          <ScaleDecorator activeScale={0.95}>
            <OpacityDecorator activeOpacity={isActive ? 0.95 : 1}>
              <TouchableOpacity onLongPress={drag} disabled={false} activeOpacity={1}>
                <Card
                  title={item.title}
                  titleIcon={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FontAwesome6 name="grip-vertical" iconStyle="solid" size={14} color={theme.secondaryText} />
                    </View>
                  }>
                  {/* In edit mode, show only title without content */}
                  <View style={{ height: 40, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={[typography.caption, { color: theme.secondaryText }]}>길게 눌러 순서 변경</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            </OpacityDecorator>
          </ScaleDecorator>
        );
      }

      // For other cards (schedule, meal)
      return (
        <ScaleDecorator activeScale={0.95}>
          <OpacityDecorator activeOpacity={isActive ? 0.95 : 1}>
            <TouchableOpacity onLongPress={drag} disabled={false} activeOpacity={1}>
              <Card
                title={item.title}
                titleIcon={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <FontAwesome6 name="grip-vertical" iconStyle="solid" size={14} color={theme.secondaryText} />
                  </View>
                }>
                {/* In edit mode, show only title without content */}
                <View style={{ height: 40, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={[typography.caption, { color: theme.secondaryText }]}>길게 눌러 순서 변경</Text>
                </View>
              </Card>
            </TouchableOpacity>
          </OpacityDecorator>
        </ScaleDecorator>
      );
    },
    [theme, typography],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
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
      {isEditMode ? (
        <Container bounce={false} scrollView={false}>
          <View style={s.container}>
            {/* Edit mode header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {schoolInfo.schoolName === '선린인터넷고' ? <SunrinLogo width={22} height={22} /> : <Logo width={22} height={22} />}
                <Text style={[typography.subtitle, { color: theme.primaryText, fontWeight: '600' }]}>{schoolInfo.schoolName || '학교 정보 없음'}</Text>
              </View>
              <TouchableOpacity
                onPress={toggleEditMode}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: '#5865F2',
                  borderRadius: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 3,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <FontAwesome6 name="check" size={14} color="#fff" iconStyle="solid" />
                  <Text style={[typography.body, { color: '#fff', fontWeight: '700' }]}>완료</Text>
                </View>
              </TouchableOpacity>
            </View>

            <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />

            {/* Draggable cards */}
            <DraggableFlatList
              data={cardOrder}
              keyExtractor={item => item.id}
              onDragEnd={({ data }) => handleCardOrderChange(data)}
              renderItem={renderDraggableItem}
              renderPlaceholder={renderPlaceholder}
              contentContainerStyle={{ gap: 8, height: '100%' }}
              scrollEnabled={true}
              activationDistance={20}
              autoscrollThreshold={100}
              autoscrollSpeed={200}
              animationConfig={{
                damping: 20,
                stiffness: 200,
              }}
              onDragBegin={() => {
                trigger('impactMedium');
              }}
              onRelease={() => {
                trigger('impactLight');
              }}
              dragItemOverflow={true}
              dragHitSlop={{ top: -10, left: -10, bottom: -10, right: -10 }}
            />
          </View>
        </Container>
      ) : (
        <Container bounce scrollView scrollViewRef={scrollViewRef} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondaryText} />}>
          <View style={s.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              {schoolInfo.schoolName === '선린인터넷고' ? <SunrinLogo width={22} height={22} /> : <Logo width={22} height={22} />}
              <Text style={[typography.subtitle, { color: theme.primaryText, fontWeight: '600' }]}>{schoolInfo.schoolName || '학교 정보 없음'}</Text>
            </View>

            <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />

            {/* Render cards based on saved order */}
            {cardOrder.map(card => {
              if (card.id === 'timetable') {
                return (
                  <TouchableOpacity key={card.id} onLongPress={handleCardLongPress} activeOpacity={1}>
                    <Card
                      title={card.title}
                      subtitle="길게 눌러 편집"
                      titleIcon={<FontAwesome6 name={card.iconName as any} size={16} color={theme.primaryText} iconStyle="solid" />}
                      rightComponent={<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <TouchableOpacity onPress={() => setIsNextWeek(prev => !prev)} style={{ padding: 4 }}>
                          <Text style={[typography.caption, { color: isNextWeek ? theme.highlightLight : theme.secondaryText }, isNextWeek ? { fontWeight: '800' } : {}]}>{isNextWeek ? '🌠' : ''} 다음주</Text>
                        </TouchableOpacity>
                      </View>}
                    >
                      {loadingTimetable ? (
                        <LoadingView height={250} />
                      ) : timetable.length === 0 ? (
                        <Text style={[typography.caption, { color: theme.secondaryText }]}>이번주 시간표가 없어요.</Text>
                      ) : (
                        <FlatList data={timetable} contentContainerStyle={{ gap: 3 }} renderItem={({ item, index }) => <TimetableRow item={item} index={index} todayIndex={todayIndex} openBottomSheet={openBottomSheet} />} scrollEnabled={false} />
                      )}
                    </Card>
                  </TouchableOpacity>
                );
              }

              const cardProps = card.id === 'schedule' ? { onPress: () => navigation.navigate('Schedules'), arrow: true } : card.id === 'meal' ? { onPress: () => navigation.navigate('Meal'), arrow: true } : {};

              const renderContent = () => {
                switch (card.id) {
                  case 'schedule':
                    return loadingSchedule ? (
                      <LoadingView height={100} />
                    ) : schedules.length === 0 ? (
                      <Text style={[typography.body, { color: theme.secondaryText }]}>학사일정이 없어요.</Text>
                    ) : (
                      <FlatList contentContainerStyle={{ gap: 8 }} data={schedules.slice(0, 4)} renderItem={({ item }) => <ScheduleItem item={item} />} scrollEnabled={false} />
                    );
                  case 'meal':
                    return loadingMeal ? (
                      <LoadingView height={100} />
                    ) : meal.length === 0 ? (
                      <Text style={[typography.body, { color: theme.secondaryText }]}>급식 정보가 없어요.</Text>
                    ) : (
                      <View style={{ gap: 4 }}>
                        <FlatList data={meal} renderItem={({ item }) => <View style={{ gap: 2 }}>{item.meal.map(renderMealItem)}</View>} scrollEnabled={false} />
                        {mealDayOffset > 0 && (
                          <Text style={[typography.caption, { color: theme.secondaryText, marginTop: 4 }]}>
                            {mealDayOffset}일 뒤, {dayjs().add(mealDayOffset, 'day').format('dddd')} 급식이에요.
                          </Text>
                        )}
                      </View>
                    );
                  default:
                    return null;
                }
              };

              const titleIcon = <FontAwesome6 name={card.iconName as any} size={16} color={theme.primaryText} iconStyle="solid" />;

              return (
                <TouchableOpacity key={card.id} activeOpacity={1}>
                  <HomeCard onLongPress={handleCardLongPress} title={card.title} titleIcon={titleIcon} {...cardProps}>
                    {renderContent()}
                  </HomeCard>
                </TouchableOpacity>
              );
            })}
          </View>
        </Container>
      )}

      {isBottomSheetOpen && (
        <BottomSheet
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustPan"
          backdropComponent={renderBackdrop}
          ref={bottomSheetRef}
          enablePanDownToClose
          onChange={handleSheetChanges}
          onClose={() => setIsBottomSheetOpen(false)}
          backgroundStyle={{ backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
          handleIndicatorStyle={{ backgroundColor: theme.secondaryText }}>
          <BottomSheetView style={{ paddingHorizontal: 18, paddingBottom: 12, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <View style={{ gap: 4, width: '100%' }}>
              <Text style={[typography.subtitle, { color: theme.primaryText, fontWeight: '600', alignSelf: 'flex-start' }]}>과목명 변경</Text>
              <Text style={[typography.body, { color: theme.primaryText, fontWeight: '300', alignSelf: 'flex-start' }]}>시간표가 알맞지 않다면 직접 변경해주세요.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
              <BottomSheetTextInput
                style={{
                  flex: 1,
                  backgroundColor: theme.background,
                  color: theme.primaryText,
                  fontSize: 16,
                  fontWeight: '500',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
                maxLength={5}
                placeholder="과목명"
                placeholderTextColor={theme.secondaryText}
                onChangeText={text => {
                  if (selectedSubjectIndices) {
                    const formattedText = text === '없음' ? '-' : text;
                    setTimetable(prev => prev.map((row, rowIdx) => row.map((subject, colIdx) => (rowIdx === selectedSubjectIndices.row && colIdx === selectedSubjectIndices.col ? { ...subject, subject: formattedText, userChanged: true } : subject))));
                    setSelectedSubject(prev => (prev ? { ...prev, subject: formattedText, userChanged: true } : prev));
                  }
                }}
                value={selectedSubject ? selectedSubject.subject : ''}
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
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
                maxLength={5}
                placeholder="선생님"
                placeholderTextColor={theme.secondaryText}
                onChangeText={text => {
                  if (selectedSubjectIndices) {
                    setTimetable(prev => prev.map((row, rowIdx) => row.map((subject, colIdx) => (rowIdx === selectedSubjectIndices.row && colIdx === selectedSubjectIndices.col ? { ...subject, teacher: text, userChanged: true } : subject))));
                    setSelectedSubject(prev => (prev ? { ...prev, teacher: text, userChanged: true } : prev));
                  }
                }}
                value={selectedSubject ? selectedSubject.teacher : ''}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              delayPressIn={0}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ backgroundColor: theme.background, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.border, width: '100%' }}
              onPress={async () => {
                if (!selectedSubjectIndices) {
                  return;
                }
                try {
                  const apiTimetable = await getTimetable(schoolInfo.comciganCode, classInfo.grade, classInfo.class, isNextWeek);
                  const raw = apiTimetable[selectedSubjectIndices.col]?.[selectedSubjectIndices.row] || { subject: '-', teacher: '-', changed: false };
                  const original = {
                    ...raw,
                    subject: raw.subject === '없음' ? '-' : raw.subject,
                    teacher: raw.teacher === '없음' ? '-' : raw.teacher,
                  };
                  setTimetable(prev => prev.map((row, rowIdx) => row.map((subject, colIdx) => (rowIdx === selectedSubjectIndices.row && colIdx === selectedSubjectIndices.col ? { ...original, userChanged: false } : subject))));
                  setSelectedSubject({ ...original, userChanged: false });
                  showToast('원래 시간표로 되돌렸어요.');
                } catch (e) {
                  showToast('원래 시간표를 불러오지 못했어요.');
                }
              }}>
              <Text style={[typography.baseTextStyle, { color: theme.primaryText, textAlign: 'center', fontWeight: '600' }]}>원래 시간표로 되돌리기</Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      )}
    </Fragment>
  );
};

const HomeCard = ({ title, titleIcon, arrow, onPress, onLongPress, notificationDot, children, ...rest }: { title?: string; titleIcon?: ReactNode; arrow?: boolean; onPress?: () => void; notificationDot?: boolean; children?: ReactNode } & { [key: string]: any }) => {
  const { theme, typography } = useTheme();
  return (
    <TouchableScale onLongPress={onLongPress} onPress={onPress} activeScale={0.98} tension={100} friction={10} {...rest}>
      <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20, gap: 16 }}>
        {title && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {titleIcon}
              <Text style={[typography.baseTextStyle, { color: theme.primaryText, fontWeight: '600', fontSize: 18 }]}>{title}</Text>
            </View>
            {arrow && <FontAwesome6 name="chevron-right" iconStyle="solid" size={14} color={theme.secondaryText} />}
          </View>
        )}
        {children}
      </View>
    </TouchableScale>
  );
};

const LoadingView = ({ height }: { height: number }) => (
  <View style={[s.loadingView, { height }]}>
    <Loading />
  </View>
);

const ScheduleItem = ({ item }: { item: Schedule }) => {
  const startDate = dayjs(item.date.start);
  const endDate = dayjs(item.date.end || item.date.start);
  const isSameDay = startDate.isSame(endDate, 'day');

  const { theme, typography } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.secondaryText, marginTop: 7 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[typography.body, { color: theme.primaryText, fontWeight: '300', flex: 1 }]}>{item.schedule}</Text>
        <Text style={{ fontSize: 14, fontWeight: '400', color: theme.secondaryText }}>
          {startDate.format('M월 D일')}
          {!isSameDay && ` ~ ${endDate.format('M월 D일')}`}
          {endDate.diff(startDate, 'day') > 0 && ` (${endDate.diff(startDate, 'day') + 1}일간)`}
        </Text>
      </View>
    </View>
  );
};

const TimetableRow = ({ item, index, todayIndex, openBottomSheet }: { item: Timetable[]; index: number; todayIndex: number; openBottomSheet: (params: { row: number; col: number }) => void }) => {
  const { theme, typography } = useTheme();

  return (
    <View style={s.timetableRow}>
      {item.map((subject, subIndex) => (
        <View key={`${subject.subject}-${index}-${subIndex}`} style={[s.timetableCell, { backgroundColor: subIndex === todayIndex ? theme.background : theme.card }]}>
          <TouchableOpacity onLongPress={() => openBottomSheet({ row: index, col: subIndex })} delayPressIn={0} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
            <Text
              style={[
                typography.baseTextStyle,
                {
                  flexShrink: 1,
                  textAlign: 'center',
                  color: subject.userChanged ? theme.highlightSecondary : subject.changed ? theme.highlightLight : theme.primaryText,
                  fontWeight: '500',
                  fontSize: 16,
                },
              ]}>
              {subject.subject}
            </Text>
            <Text style={[typography.caption, { textAlign: 'center', color: subject.userChanged ? theme.highlightSecondary : subject.changed ? theme.highlightLight : theme.secondaryText }]}>{subject.teacher}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default Home;
