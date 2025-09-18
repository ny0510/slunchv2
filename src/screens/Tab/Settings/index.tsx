import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, Text, TouchableOpacity, View} from 'react-native';
import ScrollPicker from 'react-native-wheel-scrollview-picker';

import AppInfoCard from './components/AppInfoCard';
import DeveloperSettingCard from './components/DeveloperSettingCard';
import MyInfoCard from './components/MyInfoCard';
import ProfileSection from './components/ProfileSection';
import SettingCard from './components/SettingCard';
import {getClassList, removeMealNotification, removeTimetableNotification} from '@/api';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
import {useTheme} from '@/contexts/ThemeContext';
import {useUser} from '@/contexts/UserContext';
import {useScrollToTop} from '@/hooks/useScrollToTop';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import {ClassData} from '@/types/onboarding';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const Settings = ({setScrollRef}: {setScrollRef?: (ref: any) => void}) => {
  const [developerOptions, setDeveloperOptions] = useState(false);
  const [gradeList, setGradeList] = useState<number[]>([]);
  const [classList, setClassList] = useState<number[][]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const classScrollPickerRef = useRef<any>(null);
  const gradeScrollPickerRef = useRef<any>(null);
  const scrollViewRef = useRef<any>(null);

  const {theme, typography} = useTheme();
  const {schoolInfo, classInfo, refreshUserData, setClassChangedTrigger} = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Use the scroll-to-top hook
  useScrollToTop(scrollViewRef, setScrollRef);

  useEffect(() => {
    analytics().logScreenView({screen_name: '설정 페이지', screen_class: 'Settings'});
    AsyncStorage.getItem('developerOptions').then(val => setDeveloperOptions(!!JSON.parse(val ?? 'false')));
  }, []);

  // 탭 이동 시 BottomSheet 자동 닫힘 및 뒤로가기 버튼 처리
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (bottomSheetRef.current) {
        bottomSheetRef.current.close();
      }
      setIsBottomSheetOpen(false);
    });

    // 뒤로가기 버튼 처리
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isBottomSheetOpen) {
        bottomSheetRef.current?.close();
        setIsBottomSheetOpen(false);
        return true; // 이벤트 처리 완료
      }
      return false; // 기본 동작 수행
    });

    return () => {
      unsubscribe();
      backHandler.remove();
    };
  }, [navigation, isBottomSheetOpen]);

  const handleClassChangePress = useCallback(() => {
    if (isLoading || isButtonDisabled) return;

    // Set current user's grade and class as selected values
    const currentGrade = classInfo.grade ? parseInt(classInfo.grade) : 1;
    const currentClass = classInfo.class ? parseInt(classInfo.class) : 1;

    setSelectedGrade(currentGrade);
    setSelectedClass(currentClass);

    setIsBottomSheetOpen(true);
  }, [classInfo.grade, classInfo.class, gradeList, classList, isLoading, isButtonDisabled]);

  // Open bottom sheet and initialize ScrollPickers after it mounts
  useEffect(() => {
    if (isBottomSheetOpen && bottomSheetRef.current) {
      const timer = setTimeout(() => {
        bottomSheetRef.current?.expand();

        // Initialize ScrollPickers after expand animation
        setTimeout(() => {
          const currentGrade = classInfo.grade ? parseInt(classInfo.grade) : 1;
          const currentClass = classInfo.class ? parseInt(classInfo.class) : 1;

          if (gradeList.length > 0) {
            const gradeIndex = gradeList.indexOf(currentGrade);
            if (gradeIndex !== -1 && gradeScrollPickerRef.current) {
              gradeScrollPickerRef.current?.scrollToTargetIndex(gradeIndex);
            }
          }

          if (classList.length > 0) {
            const gradeIndex = gradeList.indexOf(currentGrade);
            if (gradeIndex !== -1 && classList[gradeIndex]) {
              const classIndex = classList[gradeIndex].indexOf(currentClass);
              if (classIndex !== -1 && classScrollPickerRef.current) {
                classScrollPickerRef.current?.scrollToTargetIndex(classIndex);
              }
            }
          }
        }, 500);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isBottomSheetOpen, classInfo.grade, classInfo.class, gradeList, classList]);

  const loadClassData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getClassList(schoolInfo.comciganCode);

      // Check if response is valid and is an array
      if (!response || !Array.isArray(response)) {
        console.error('Invalid response from getClassList:', response);
        showToast('학급 정보를 불러오는 중 오류가 발생했어요.');
        return;
      }

      const _gradeList = response.map(item => item.grade);
      const _classList = response.map(item => item.classes);

      setGradeList(_gradeList);
      setClassList(_classList);

      // Set current user's grade and class as default
      const currentGrade = parseInt(classInfo.grade);
      const currentClass = parseInt(classInfo.class);

      setSelectedGrade(currentGrade);
      setSelectedClass(currentClass);
    } catch (error) {
      console.error('Error loading class data:', error);
      showToast('학급 정보를 불러오는 중 오류가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [schoolInfo.comciganCode, classInfo.grade, classInfo.class]);

  useEffect(() => {
    if (schoolInfo.comciganCode) {
      loadClassData();
    }
  }, [schoolInfo.comciganCode, loadClassData]);

  const handleGradeChange = (index?: number) => {
    if (index === undefined || index < 1 || index > gradeList.length) {
      return;
    }

    const newGradeIndex = index - 1;
    setSelectedGrade(gradeList[newGradeIndex]);
    setSelectedClass(classList[newGradeIndex][0]);
    classScrollPickerRef.current?.scrollToTargetIndex(0);
  };

  const handleClassChange = (index?: number) => {
    if (index === undefined || index < 1) {
      return;
    }

    const gradeIndex = gradeList.indexOf(selectedGrade);
    if (gradeIndex === -1 || index > classList[gradeIndex].length) {
      return;
    }

    setSelectedClass(classList[gradeIndex][index - 1]);
  };

  const handleSaveClassChange = async () => {
    if (isButtonDisabled || isLoading) {
      return;
    }

    setIsButtonDisabled(true);
    setIsLoading(true);

    try {
      const classData: ClassData = {grade: selectedGrade, class: selectedClass};

      // Update class information
      await AsyncStorage.setItem('class', JSON.stringify(classData));

      // Handle FCM token removal if needed
      try {
        const [storedToken, settings] = await Promise.all([AsyncStorage.getItem('fcmToken'), AsyncStorage.getItem('settings')]);

        const settingsParsed = settings ? JSON.parse(settings) : {};
        const isMealEnabled = settingsParsed.mealNotification?.enabled || false;
        const isTimetableEnabled = settingsParsed.timetableNotification?.enabled || false;

        const promises = [];
        let notificationsRemoved = false;

        // 급식 알림 해제
        if (isMealEnabled && storedToken) {
          promises.push(removeMealNotification(storedToken));
          settingsParsed.mealNotification = {
            ...settingsParsed.mealNotification,
            enabled: false,
          };
          notificationsRemoved = true;
        }

        // 시간표 알림 해제
        if (isTimetableEnabled && storedToken) {
          promises.push(removeTimetableNotification(storedToken));
          settingsParsed.timetableNotification = {
            ...settingsParsed.timetableNotification,
            enabled: false,
          };
          notificationsRemoved = true;
        }

        if (promises.length > 0) {
          // settings 업데이트
          promises.push(AsyncStorage.setItem('settings', JSON.stringify(settingsParsed)));
          await Promise.all(promises);

          if (notificationsRemoved) {
            showToast('학급 정보가 변경되어 알림이 해제되었어요.');
          }
        }
      } catch (e) {
        console.error('Error removing FCM token:', e);
      }

      showToast('학급 정보가 변경되었어요.');

      // Refresh user data to reflect changes immediately
      refreshUserData();
      setClassChangedTrigger(true);

      bottomSheetRef.current?.close();
      setIsBottomSheetOpen(false);
    } catch (error) {
      console.error('Error saving class change:', error);
      showToast('학급 정보 변경에 실패했어요.');
    } finally {
      // 버튼 비활성화 해제를 약간 지연시켜 더블 클릭 방지
      setTimeout(() => {
        setIsButtonDisabled(false);
        setIsLoading(false);
      }, 500);
    }
  };

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} pressBehavior="close" disappearsOnIndex={-1} />, []);

  return (
    <>
      <Container scrollView bounce scrollViewRef={scrollViewRef}>
        <View style={{gap: 18, width: '100%', marginVertical: 16}}>
          {/* 계정 섹션 */}
          <View style={{gap: 8}}>
            <ProfileSection />
          </View>

          {/* 설정 섹션 */}
          <View style={{gap: 8}}>
            <Text style={[typography.caption, {color: theme.secondaryText, paddingHorizontal: 16, marginBottom: 4}]}>설정</Text>
            <SettingCard onClassChangePress={handleClassChangePress} />
            {developerOptions && <DeveloperSettingCard />}
          </View>

          {/* 정보 섹션 */}
          <View style={{gap: 8}}>
            <Text style={[typography.caption, {color: theme.secondaryText, paddingHorizontal: 16, marginBottom: 4}]}>정보</Text>
            <MyInfoCard schoolInfo={schoolInfo} classInfo={classInfo} />
            <AppInfoCard onDeveloperOptionsEnabled={enabled => setDeveloperOptions(enabled)} />
          </View>
        </View>
      </Container>

      {isBottomSheetOpen && (
        <BottomSheet
          ref={bottomSheetRef}
          enableContentPanningGesture={false}
          index={-1}
          backdropComponent={renderBackdrop}
          enablePanDownToClose={true}
          onClose={() => setIsBottomSheetOpen(false)}
          backgroundStyle={{backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}}
          handleIndicatorStyle={{backgroundColor: theme.secondaryText}}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore">
          <BottomSheetView style={{paddingHorizontal: 18, paddingBottom: 12}}>
            <View style={{gap: 20, flex: 1}}>
              <View style={{gap: 4, width: '100%'}}>
                <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '600', alignSelf: 'flex-start'}]}>학급 변경</Text>
                <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300', alignSelf: 'flex-start'}]}>변경할 학년과 반을 선택해주세요.</Text>
              </View>

              {isLoading ? (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                  <Loading />
                </View>
              ) : (
                <View style={{flex: 1, flexDirection: 'row'}}>
                  <ScrollPicker
                    ref={gradeScrollPickerRef}
                    dataSource={gradeList}
                    wrapperBackground={'transparent'}
                    itemHeight={45}
                    highlightColor={theme.secondaryText}
                    highlightBorderWidth={1}
                    onValueChange={handleGradeChange}
                    selectedIndex={gradeList.indexOf(selectedGrade)}
                    renderItem={(data, _, isSelected) => (
                      <Text
                        style={{
                          fontSize: 20,
                          color: isSelected ? theme.primaryText : theme.secondaryText,
                          fontWeight: '500',
                        }}>
                        {data}학년
                      </Text>
                    )}
                  />
                  <ScrollPicker
                    ref={classScrollPickerRef}
                    dataSource={classList[gradeList.indexOf(selectedGrade)] || []}
                    wrapperBackground={'transparent'}
                    itemHeight={45}
                    highlightColor={theme.secondaryText}
                    highlightBorderWidth={1}
                    onValueChange={handleClassChange}
                    selectedIndex={classList[gradeList.indexOf(selectedGrade)]?.indexOf(selectedClass) || 0}
                    renderItem={(data, _, isSelected) => (
                      <Text
                        style={{
                          fontSize: 20,
                          color: isSelected ? theme.primaryText : theme.secondaryText,
                          fontWeight: '500',
                        }}>
                        {data}반
                      </Text>
                    )}
                  />
                </View>
              )}

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: theme.background,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isButtonDisabled || isLoading ? 0.5 : 1,
                }}
                onPress={handleSaveClassChange}
                disabled={isButtonDisabled || isLoading}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '700'}]}>변경하기</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheet>
      )}
    </>
  );
};

export default Settings;
