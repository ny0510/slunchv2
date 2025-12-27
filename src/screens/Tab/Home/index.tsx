import { ANDROID_HOME_BANNER_AD_UNIT_ID, IOS_HOME_BANNER_AD_UNIT_ID } from '@env';
import dayjs from 'dayjs';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Button, Keyboard, Platform, RefreshControl, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { OpacityDecorator, RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { trigger } from 'react-native-haptic-feedback';
import Midnight from 'react-native-midnight';

import { styles as s } from './styles';
import { getTimetable } from '@/api';
import Logo from '@/assets/images/logo.svg';
import SunrinLogo from '@/assets/images/sunrin.svg';
import BannerAdCard from '@/components/BannerAdCard';
import Card from '@/components/Card';
import Container from '@/components/Container';
import { ScheduleCard, MealCard, TimetableCard, ScheduleCardRef, MealCardRef, TimetableCardRef } from '@/screens/Tab/Home/components';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { clearCache } from '@/lib/cache';
import { showToast } from '@/lib/toast';
import { RootStackParamList } from '@/navigation/RootStacks';
import { Timetable } from '@/types/api';
import BottomSheet, { BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import 'dayjs/locale/ko';
import GradeTimetableCard, { GradeTimetableCardRef } from './components/GradeTimetableCard';

interface CardData {
  id: 'schedule' | 'meal' | 'timetable' | 'grade-timetable';
  title: string;
  iconName: string;
  visible: boolean;
}

const Home = ({ setScrollRef }: { setScrollRef?: (ref: any) => void }) => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<Timetable | null>(null);
  const [selectedSubjectIndices, setSelectedSubjectIndices] = useState<{ row: number; col: number } | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cardOrder, setCardOrder] = useState<CardData[]>([
    { id: 'schedule', title: '학사일정', iconName: 'calendar', visible: true },
    { id: 'meal', title: '급식', iconName: 'utensils', visible: true },
    { id: 'timetable', title: '시간표', iconName: 'table', visible: true },
    { id: 'grade-timetable', title: '학년 시간표', iconName: 'table-cells', visible: false },
  ]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const backPressedOnceRef = useRef(false);
  const scrollViewRef = useRef<any>(null);
  const scheduleCardRef = useRef<ScheduleCardRef>(null);
  const mealCardRef = useRef<MealCardRef>(null);
  const timetableCardRef = useRef<TimetableCardRef>(null);
  const gradeTimetableCardRef = useRef<GradeTimetableCardRef>(null);

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
          // Ensure all cards have visible property, default to true if missing
          const updatedOrder = parsedOrder.map((card: any) => ({
            ...card,
            visible: card.visible !== undefined ? card.visible : true,
          }));
          setCardOrder(updatedOrder);
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

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      scheduleCardRef.current?.refresh(),
      mealCardRef.current?.refresh(),
      timetableCardRef.current?.refresh(),
    ]);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await clearCache('@cache/');
    await refreshAllData();
    setRefreshing(false);
  }, [refreshAllData]);

  useEffect(() => {
    analytics().logScreenView({ screen_name: '홈', screen_class: 'Home' });
  }, []);

  // Android 뒤로가기 버튼 처리
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const onBackPress = () => {
          if (isBottomSheetOpen) {
            bottomSheetRef.current?.close();
            setIsBottomSheetOpen(false);
            return true;
          }

          if (isEditMode) {
            setIsEditMode(false);
            return true;
          }

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
      if (classChangedTrigger) {
        setRefreshing(true);
        await clearCache('@cache/');
        await refreshAllData();
        setRefreshing(false);
        setClassChangedTrigger(false);
      }
    });
    return unsubscribe;
  }, [navigation, classChangedTrigger, setClassChangedTrigger, refreshAllData]);

  // 매일 자정마다 데이터를 갱신
  useEffect(() => {
    const listener = Midnight.addListener(() => {
      refreshAllData();
    });
    return () => listener.remove();
  }, [refreshAllData]);

  // 앱이 백그라운드에서 포그라운드로 돌아올 때 데이터를 갱신
  useEffect(() => {
    const checkOnForeground = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        refreshAllData();
      }
    });

    return () => checkOnForeground.remove();
  }, [refreshAllData]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setSelectedSubject(null);
      setSelectedSubjectIndices(null);
      showToast('시간표가 변경되었어요.');
    }
  }, []);

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

  const handleSubjectLongPress = useCallback(({ row, col, subject }: { row: number; col: number; subject: Timetable }) => {
    trigger('impactLight');
    setSelectedSubject(subject);
    setSelectedSubjectIndices({ row, col });
    setIsBottomSheetOpen(true);
  }, []);

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
      const toggleVisibility = () => {
        setCardOrder(prev => prev.map(card => card.id === item.id ? { ...card, visible: !card.visible } : card));
      };

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
                }
                rightComponent={
                  <TouchableOpacity onPress={toggleVisibility} style={{ padding: 4 }}>
                    <FontAwesome6
                      name={item.visible ? "eye" : "eye-slash"}
                      iconStyle="solid"
                      size={16}
                      color={item.visible ? theme.primaryText : theme.secondaryText}
                    />
                  </TouchableOpacity>
                }>
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

  const handleTimetableUpdate = useCallback((row: number, col: number, updates: Partial<Timetable>) => {
    const currentTimetable = timetableCardRef.current?.getTimetable() || [];
    const newTimetable = currentTimetable.map((r, rowIdx) =>
      r.map((subject, colIdx) =>
        rowIdx === row && colIdx === col ? { ...subject, ...updates, userChanged: true } : subject
      )
    );
    timetableCardRef.current?.setTimetable(newTimetable);
    setSelectedSubject(prev => (prev ? { ...prev, ...updates, userChanged: true } : prev));
  }, []);

  const handleResetSubject = useCallback(async () => {
    if (!selectedSubjectIndices) {
      return;
    }
    try {
      const isNextWeek = timetableCardRef.current?.getIsNextWeek() || false;
      const apiTimetable = await getTimetable(schoolInfo.comciganCode, classInfo.grade, classInfo.class, isNextWeek);
      const raw = apiTimetable[selectedSubjectIndices.col]?.[selectedSubjectIndices.row] || { subject: '-', teacher: '-', changed: false };
      const original = {
        ...raw,
        subject: raw.subject === '없음' ? '-' : raw.subject,
        teacher: raw.teacher === '없음' ? '-' : raw.teacher,
      };

      const currentTimetable = timetableCardRef.current?.getTimetable() || [];
      const newTimetable = currentTimetable.map((r, rowIdx) =>
        r.map((subject, colIdx) =>
          rowIdx === selectedSubjectIndices.row && colIdx === selectedSubjectIndices.col
            ? { ...original, userChanged: false }
            : subject
        )
      );
      timetableCardRef.current?.setTimetable(newTimetable);
      setSelectedSubject({ ...original, userChanged: false });
      showToast('원래 시간표로 되돌렸어요.');
    } catch (e) {
      showToast('원래 시간표를 불러오지 못했어요.');
    }
  }, [selectedSubjectIndices, schoolInfo.comciganCode, classInfo.grade, classInfo.class]);

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
            {cardOrder.filter(card => card.visible).map(card => {
              switch (card.id) {
              case 'timetable':
                return (
                <TimetableCard
                  key={card.id}
                  ref={timetableCardRef}
                  onLongPress={handleCardLongPress}
                  onSubjectLongPress={handleSubjectLongPress}
                />
                );
              case 'grade-timetable':
                return (
                <GradeTimetableCard
                  key="grade-timetable-card"
                  ref={gradeTimetableCardRef}
                  onLongPress={handleCardLongPress}
                />
                );
              case 'schedule':
                return (
                <ScheduleCard
                  key={card.id}
                  ref={scheduleCardRef}
                  onPress={() => navigation.navigate('Schedules')}
                  onLongPress={handleCardLongPress}
                />
                );
              case 'meal':
                return (
                <MealCard
                  key={card.id}
                  ref={mealCardRef}
                  onPress={() => navigation.navigate('Meal')}
                  onLongPress={handleCardLongPress}
                />
                );
              default:
                return null;
              }
            })}
            <Text style={[typography.caption, { color: theme.secondaryText, textAlign: 'center', marginTop: 12 }]}>카드를 길게 눌러 순서를 변경하거나 숨길 수 있어요.</Text>
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
                    handleTimetableUpdate(selectedSubjectIndices.row, selectedSubjectIndices.col, { subject: formattedText });
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
                    handleTimetableUpdate(selectedSubjectIndices.row, selectedSubjectIndices.col, { teacher: text });
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
              onPress={handleResetSubject}>
              <Text style={[typography.baseTextStyle, { color: theme.primaryText, textAlign: 'center', fontWeight: '600' }]}>원래 시간표로 되돌리기</Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      )}
    </Fragment>
  );
};

export default Home;
