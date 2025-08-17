import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import ScrollPicker from 'react-native-wheel-scrollview-picker';

import AppInfoCard from './components/AppInfoCard';
import DeveloperSettingCard from './components/DeveloperSettingCard';
import MyInfoCard from './components/MyInfoCard';
import ProfileSection from './components/ProfileSection';
import SettingCard from './components/SettingCard';
import {getClassList, neisSchoolSearch, removeFcmToken} from '@/api';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
import {useTheme} from '@/contexts/ThemeContext';
import {useUser} from '@/contexts/UserContext';
import {showToast} from '@/lib/toast';
import {ClassData, SchoolData} from '@/types/onboarding';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Settings = () => {
  const [developerOptions, setDeveloperOptions] = useState(false);
  const [gradeList, setGradeList] = useState<number[]>([]);
  const [classList, setClassList] = useState<number[][]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const classScrollPickerRef = useRef<any>(null);
  const gradeScrollPickerRef = useRef<any>(null);

  const {theme, typography} = useTheme();
  const {schoolInfo, classInfo, refreshUserData, setClassChangedTrigger} = useUser();

  useEffect(() => {
    analytics().logScreenView({screen_name: '설정 페이지', screen_class: 'Settings'});
    AsyncStorage.getItem('developerOptions').then(val => setDeveloperOptions(!!JSON.parse(val ?? 'false')));
  }, []);

  const handleClassChangePress = useCallback(() => {
    // Set current user's grade and class as selected values
    const currentGrade = parseInt(classInfo.grade);
    const currentClass = parseInt(classInfo.class);

    setSelectedGrade(currentGrade);
    setSelectedClass(currentClass);

    bottomSheetRef.current?.expand();

    // ScrollPicker를 현재 학급으로 이동
    setTimeout(() => {
      if (gradeList.length > 0) {
        const gradeIndex = gradeList.indexOf(currentGrade);
        if (gradeIndex !== -1) {
          gradeScrollPickerRef.current?.scrollToTargetIndex(gradeIndex);
        }
      }

      if (classList.length > 0) {
        const gradeIndex = gradeList.indexOf(currentGrade);
        if (gradeIndex !== -1 && classList[gradeIndex]) {
          const classIndex = classList[gradeIndex].indexOf(currentClass);
          if (classIndex !== -1) {
            classScrollPickerRef.current?.scrollToTargetIndex(classIndex);
          }
        }
      }
    }, 300); // Bottom sheet 애니메이션 완료 후 실행
  }, [classInfo.grade, classInfo.class, gradeList, classList]);

  const loadClassData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getClassList(Number(schoolInfo.comciganCode));

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
    if (isButtonDisabled) {
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
        const [storedToken, isNotiEnabled] = await Promise.all([AsyncStorage.getItem('fcmToken'), AsyncStorage.getItem('isNotiEnabled')]);

        const isNotiEnabledParsed = isNotiEnabled ? JSON.parse(isNotiEnabled) : false;

        if (isNotiEnabledParsed && storedToken) {
          await Promise.all([removeFcmToken(storedToken), AsyncStorage.setItem('isNotiEnabled', JSON.stringify(false))]);
          showToast('학급 정보가 변경되어 알림이 해제되었어요.');
        }
      } catch (e) {
        console.error('Error removing FCM token:', e);
      }

      showToast('학급 정보가 변경되었어요.');

      // Refresh user data to reflect changes immediately
      refreshUserData();
      setClassChangedTrigger(true);

      bottomSheetRef.current?.close();
    } catch (error) {
      console.error('Error saving class change:', error);
      showToast('학급 정보 변경에 실패했어요.');
    } finally {
      setIsButtonDisabled(false);
      setIsLoading(false);
    }
  };

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} pressBehavior="close" disappearsOnIndex={-1} />, []);

  return (
    <>
      <Container scrollView bounce>
        <View style={{gap: 18, width: '100%', marginVertical: 16}}>
          <ProfileSection />
          <View style={{gap: 8}}>
            <SettingCard onClassChangePress={handleClassChangePress} />
            <MyInfoCard schoolInfo={schoolInfo} classInfo={classInfo} />
            <AppInfoCard onDeveloperOptionsEnabled={enabled => setDeveloperOptions(enabled)} />
            {developerOptions && <DeveloperSettingCard />}
          </View>
        </View>
      </Container>

      <BottomSheet ref={bottomSheetRef} enableContentPanningGesture={false} index={-1} backdropComponent={renderBackdrop} enablePanDownToClose={true} backgroundStyle={{backgroundColor: theme.card}} handleIndicatorStyle={{backgroundColor: theme.secondaryText}}>
        <BottomSheetView style={{flex: 1, padding: 20}}>
          <View style={{gap: 20, flex: 1}}>
            <View>
              <Text style={[typography.title, {color: theme.primaryText}]}>학급 변경</Text>
              <Text style={[typography.subtitle, {color: theme.secondaryText}]}>변경할 학년과 반을 선택해주세요</Text>
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
                  itemHeight={50}
                  highlightColor={theme.secondaryText}
                  highlightBorderWidth={1}
                  onValueChange={handleGradeChange}
                  selectedIndex={gradeList.indexOf(selectedGrade)}
                  renderItem={(data, index, isSelected) => (
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
                  itemHeight={50}
                  highlightColor={theme.secondaryText}
                  highlightBorderWidth={1}
                  onValueChange={handleClassChange}
                  selectedIndex={classList[gradeList.indexOf(selectedGrade)]?.indexOf(selectedClass) || 0}
                  renderItem={(data, index, isSelected) => (
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
                backgroundColor: theme.border,
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isButtonDisabled ? 0.5 : 1,
              }}
              onPress={handleSaveClassChange}
              disabled={isButtonDisabled}>
              <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '700'}]}>변경하기</Text>
              <FontAwesome6 name="check" iconStyle="solid" size={16} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

export default Settings;
