import {ANDROID_HOME_BANNER_AD_UNIT_ID, IOS_HOME_BANNER_AD_UNIT_ID} from '@env';
import dayjs from 'dayjs';
import React, {Fragment, ReactNode, useCallback, useEffect, useRef, useState} from 'react';
import {AppState, BackHandler, FlatList, Keyboard, Platform, RefreshControl, Text, ToastAndroid, TouchableOpacity, View} from 'react-native';
import {trigger} from 'react-native-haptic-feedback';
import Midnight from 'react-native-midnight';
import TouchableScale from 'react-native-touchable-scale';

import {styles as s} from './styles';
import {getMeal, getSchedules, getTimetable} from '@/api';
import Logo from '@/assets/images/logo.svg';
import BannerAdCard from '@/components/BannerAdCard';
import Card from '@/components/Card';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
// import TouchableScale from '@/components/TouchableScale';
import {useTheme} from '@/contexts/ThemeContext';
import {useUser} from '@/contexts/UserContext';
import {clearCache} from '@/lib/cache';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import {Meal, Schedule, Timetable} from '@/types/api';
import {MealItem} from '@/types/meal';
import BottomSheet, {BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView} from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {NavigationProp, useFocusEffect, useNavigation} from '@react-navigation/native';

const Home = () => {
  const [timetable, setTimetable] = useState<Timetable[][]>([]);
  const [meal, setMeal] = useState<Meal[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showAllergy, setShowAllergy] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [todayIndex, setTodayIndex] = useState<number>(dayjs().day() - 1);
  const [mealDayOffset, setMealDayOffset] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<Timetable | null>(null);
  const [selectedSubjectIndices, setSelectedSubjectIndices] = useState<{row: number; col: number} | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const backPressedOnceRef = useRef(false);

  const {theme, typography} = useTheme();
  const {schoolInfo, classInfo, classChangedTrigger, setClassChangedTrigger} = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const getSettings = useCallback(async () => {
    const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
    setShowAllergy(settings.showAllergy);
  }, []);

  const transpose = useCallback((array: Timetable[][]) => {
    const maxColLength = Math.max(...array.map(row => row.length));
    return Array.from({length: maxColLength}, (_, colIndex) =>
      array.map(row => {
        const entry = row[colIndex];
        if (!entry) {
          return {subject: '-', teacher: '-', changed: false};
        }
        return {
          ...entry,
          subject: entry.subject === '없음' ? '-' : entry.subject,
          teacher: entry.teacher === '없음' ? '-' : entry.teacher,
        };
      }),
    );
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await getSettings();

    // Check if school and class info are available
    if (!schoolInfo.comciganCode || !schoolInfo.neisCode || !classInfo.grade || !classInfo.class) {
      setLoading(false);
      return;
    }

    try {
      const today = dayjs();

      // Promise.allSettled를 사용하여 병렬 처리하고 실패한 API가 있어도 다른 API는 계속 실행
      const [timetableResult, mealResult, scheduleResult] = await Promise.allSettled([
        getTimetable(schoolInfo.comciganCode, classInfo.grade, classInfo.class),
        getMeal(schoolInfo.neisCode, schoolInfo.neisRegionCode, today.format('YYYY'), today.format('MM'), today.format('DD'), showAllergy, true, true),
        getSchedules(schoolInfo.neisCode, schoolInfo.neisRegionCode, today.format('YYYY'), today.format('MM')),
      ]);

      // 시간표 처리
      if (timetableResult.status === 'fulfilled') {
        const newTimetable = transpose(timetableResult.value);

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
      } else {
        console.error('Error fetching timetable:', timetableResult.reason);
        showToast('시간표를 불러오는 중 오류가 발생했어요.');
      }

      // 급식 처리
      if (mealResult.status === 'fulfilled') {
        let mealResponse = mealResult.value;
        const isPastNoon = today.hour() > 14;
        setMealDayOffset(0);

        if (mealResponse.length === 0 || isPastNoon) {
          // 병렬로 다음 3일 확인
          const nextDayPromises = [1, 2, 3].map(i => {
            const nextDay = today.add(i, 'day');
            return getMeal(schoolInfo.neisCode, schoolInfo.neisRegionCode, nextDay.format('YYYY'), nextDay.format('MM'), nextDay.format('DD'), showAllergy, true, true)
              .then(data => ({data, offset: i}))
              .catch(() => ({data: [], offset: i}));
          });

          const nextDayResults = await Promise.all(nextDayPromises);
          const validResult = nextDayResults.find(result => result.data.length > 0);

          if (validResult) {
            mealResponse = validResult.data;
            setMealDayOffset(validResult.offset);
          }
        }
        setMeal(mealResponse);
      } else {
        console.error('Error fetching meal:', mealResult.reason);
        showToast('급식을 불러오는 중 오류가 발생했어요.');
      }

      // 학사일정 처리
      if (scheduleResult.status === 'fulfilled') {
        const scheduleResponse = scheduleResult.value?.length > 0 ? scheduleResult.value.filter(schedule => dayjs(schedule.date.start).isAfter(today)) : [];
        setSchedules(scheduleResponse);
      } else {
        console.error('Error fetching schedules:', scheduleResult.reason);
        showToast('학사일정을 불러오는 중 오류가 발생했어요.');
      }
    } catch (e) {
      console.error('Unexpected error:', e);
      showToast('데이터를 불러오는 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }, [showAllergy, getSettings, transpose, schoolInfo, classInfo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await clearCache('@cache/');
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    analytics().logScreenView({screen_name: '홈', screen_class: 'Home'});
  }, []);

  // Android 뒤로가기 버튼 처리
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const onBackPress = () => {
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
    }, []),
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
      if (classChangedTrigger) {
        setRefreshing(true);
        await clearCache('@cache/');
        await fetchData();
        setRefreshing(false);
        setClassChangedTrigger(false);
      }
    });
    return unsubscribe;
  }, [navigation, classChangedTrigger, setClassChangedTrigger, fetchData]);

  // 매일 자정마다 데이터를 갱신
  useEffect(() => {
    const listener = Midnight.addListener(() => {
      setTodayIndex(dayjs().day() - 1);
      fetchData();
    });
    return () => listener.remove();
  }, [fetchData]);

  // 앱이 백그라운드에서 포그라운드로 돌아올 때 데이터를 갱신
  useEffect(() => {
    const checkOnForeground = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        fetchData();
      }
    });

    return () => checkOnForeground.remove();
  }, [fetchData]);

  useEffect(() => {
    setTodayIndex(dayjs().day() - 1);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (timetable.length > 0) {
      AsyncStorage.setItem('customTimetable', JSON.stringify(timetable));
    }
  }, [timetable]);

  const renderMealItem = (mealItem: string | MealItem, index: number) => {
    if (typeof mealItem === 'string') {
      return (
        <Text key={index} style={[typography.body, {color: theme.primaryText, fontWeight: 300}]}>
          - {mealItem}
        </Text>
      );
    }

    const allergyInfo = showAllergy && mealItem.allergy && mealItem.allergy.length > 0 ? ` (${mealItem.allergy.map(allergy => allergy.code).join(', ')})` : '';

    return (
      <Text key={index} style={[typography.body, {color: theme.primaryText, fontWeight: 300}]}>
        - {mealItem.food}
        <Text style={typography.small}>{allergyInfo}</Text>
      </Text>
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

  const openBottomSheet = ({row, col}: {row: number; col: number}) => {
    trigger('impactLight');
    setSelectedSubject(timetable[row]?.[col] || null);
    setSelectedSubjectIndices({row, col});
    setIsBottomSheetOpen(true);
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(0);
    }, 100);
  };

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
      <Container bounce scrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondaryText} />}>
        <View style={s.container}>
          <View style={s.header}>
            <Logo width={24} height={24} />
            <Text style={[typography.subtitle, {color: theme.primaryText}]}>{schoolInfo.schoolName || '학교 정보 없음'}</Text>
          </View>

          <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_HOME_BANNER_AD_UNIT_ID : ANDROID_HOME_BANNER_AD_UNIT_ID} />

          <HomeCard title="학사일정" titleIcon={<FontAwesome6 name="calendar" size={16} color={theme.primaryText} iconStyle="solid" />} arrow onPress={() => navigation.navigate('Schedules')}>
            {loading ? <LoadingView height={100} /> : schedules.length === 0 ? <Text style={[typography.caption, {color: theme.secondaryText}]}>학사일정이 없어요.</Text> : <FlatList data={schedules} renderItem={({item}) => <ScheduleItem item={item} />} scrollEnabled={false} />}
          </HomeCard>
          <HomeCard title="급식" titleIcon={<FontAwesome6 name="utensils" size={16} color={theme.primaryText} iconStyle="solid" />} arrow onPress={() => navigation.navigate('Meal')}>
            {loading ? (
              <LoadingView height={100} />
            ) : meal.length === 0 ? (
              <Text style={[typography.caption, {color: theme.secondaryText}]}>급식 정보가 없어요.</Text>
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
          <Card title="시간표" titleIcon={<FontAwesome6 name="table" size={16} color={theme.primaryText} iconStyle="solid" />}>
            {loading ? (
              <LoadingView height={250} />
            ) : timetable.length === 0 ? (
              <Text style={[typography.caption, {color: theme.secondaryText}]}>이번주 시간표가 없어요.</Text>
            ) : (
              <FlatList data={timetable} contentContainerStyle={{gap: 3}} renderItem={({item, index}) => <TimetableRow item={item} index={index} todayIndex={todayIndex} openBottomSheet={openBottomSheet} />} scrollEnabled={false} />
            )}
          </Card>
        </View>
      </Container>

      {isBottomSheetOpen && (
        <BottomSheet
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          backdropComponent={renderBackdrop}
          ref={bottomSheetRef}
          index={-1}
          enablePanDownToClose
          onChange={handleSheetChanges}
          onClose={() => setIsBottomSheetOpen(false)}
          backgroundStyle={{backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}}
          handleIndicatorStyle={{backgroundColor: theme.secondaryText}}>
          <BottomSheetView style={{paddingHorizontal: 18, paddingBottom: 12, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', gap: 8}}>
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
                  if (selectedSubjectIndices) {
                    const formattedText = text === '없음' ? '-' : text;
                    setTimetable(prev => prev.map((row, rowIdx) => row.map((subject, colIdx) => (rowIdx === selectedSubjectIndices.row && colIdx === selectedSubjectIndices.col ? {...subject, subject: formattedText, userChanged: true} : subject))));
                    setSelectedSubject(prev => (prev ? {...prev, subject: formattedText, userChanged: true} : prev));
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
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
                maxLength={5}
                placeholder="선생님"
                placeholderTextColor={theme.secondaryText}
                onChangeText={text => {
                  if (selectedSubjectIndices) {
                    setTimetable(prev => prev.map((row, rowIdx) => row.map((subject, colIdx) => (rowIdx === selectedSubjectIndices.row && colIdx === selectedSubjectIndices.col ? {...subject, teacher: text, userChanged: true} : subject))));
                    setSelectedSubject(prev => (prev ? {...prev, teacher: text, userChanged: true} : prev));
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
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              style={{backgroundColor: theme.background, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.border, width: '100%', minHeight: 44}}
              onPress={async () => {
                if (!selectedSubjectIndices) {
                  return;
                }
                try {
                  const apiTimetable = await getTimetable(schoolInfo.comciganCode, classInfo.grade, classInfo.class);
                  const raw = apiTimetable[selectedSubjectIndices.col]?.[selectedSubjectIndices.row] || {subject: '-', teacher: '-', changed: false};
                  const original = {
                    ...raw,
                    subject: raw.subject === '없음' ? '-' : raw.subject,
                    teacher: raw.teacher === '없음' ? '-' : raw.teacher,
                  };
                  setTimetable(prev => prev.map((row, rowIdx) => row.map((subject, colIdx) => (rowIdx === selectedSubjectIndices.row && colIdx === selectedSubjectIndices.col ? {...original, userChanged: false} : subject))));
                  setSelectedSubject({...original, userChanged: false});
                  showToast('원래 시간표로 되돌렸어요.');
                } catch (e) {
                  showToast('원래 시간표를 불러오지 못했어요.');
                }
              }}>
              <Text style={[typography.baseTextStyle, {color: theme.primaryText, textAlign: 'center', fontWeight: '600'}]}>원래 시간표로 되돌리기</Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      )}
    </Fragment>
  );
};

const HomeCard = ({title, titleIcon, arrow, onPress, notificationDot, children, ...rest}: {title?: string; titleIcon?: ReactNode; arrow?: boolean; onPress?: () => void; notificationDot?: boolean; children?: ReactNode} & {[key: string]: any}) => (
  <TouchableScale onPress={onPress} activeScale={0.98} tension={60} friction={3} {...rest}>
    {/* <TouchableOpacity activeOpacity={0.7} onPress={onPress}> */}
    <Card title={title} titleIcon={titleIcon} arrow={arrow} notificationDot={notificationDot}>
      {children}
    </Card>
    {/* </TouchableOpacity> */}
  </TouchableScale>
);

const LoadingView = ({height}: {height: number}) => (
  <View style={[s.loadingView, {height}]}>
    <Loading />
  </View>
);

const ScheduleItem = ({item}: {item: Schedule}) => {
  const startDate = dayjs(item.date.start);
  const endDate = dayjs(item.date.end || item.date.start);
  const isSameDay = startDate.isSame(endDate, 'day');

  const {theme, typography} = useTheme();

  return (
    <View style={s.scheduleItemContainer}>
      <Text style={[typography.baseTextStyle, {color: theme.primaryText, fontWeight: 500, fontSize: 16}]}>
        {startDate.format('M/D')}
        {!isSameDay && ` ~ ${endDate.format('M/D')}`}
      </Text>
      <Text style={[typography.baseTextStyle, {color: theme.primaryText, fontWeight: 300, fontSize: 16}]}>{item.schedule}</Text>
      <Text style={[typography.caption, {color: theme.secondaryText}]}>{endDate.diff(startDate, 'day') > 0 && `(${endDate.diff(startDate, 'day') + 1}일)`}</Text>
    </View>
  );
};

const TimetableRow = ({item, index, todayIndex, openBottomSheet}: {item: Timetable[]; index: number; todayIndex: number; openBottomSheet: (params: {row: number; col: number}) => void}) => {
  const {theme, typography} = useTheme();

  return (
    <View style={s.timetableRow}>
      {item.map((subject, subIndex) => (
        <View key={`${subject.subject}-${index}-${subIndex}`} style={[s.timetableCell, {backgroundColor: subIndex === todayIndex ? theme.background : theme.card}]}>
          <TouchableOpacity onLongPress={() => openBottomSheet({row: index, col: subIndex})} delayPressIn={0} hitSlop={{top: 4, bottom: 4, left: 4, right: 4}}>
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
            <Text style={[typography.caption, {textAlign: 'center', color: subject.userChanged ? theme.highlightSecondary : subject.changed ? theme.highlightLight : theme.secondaryText}]}>{subject.teacher}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default Home;
