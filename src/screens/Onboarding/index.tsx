import dayjs from 'dayjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, FlatList, ImageBackground, Platform, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {trigger} from 'react-native-haptic-feedback';
import LinearGradient from 'react-native-linear-gradient';

import {createStyles} from './styles';
import {comciganSchoolSearch, getClassList, neisSchoolSearch, removeMealNotification, removeTimetableNotification} from '@/api';
import LogoIcon from '@/assets/images/logo.svg';
import Loading from '@/components/Loading';
import SlotMachine from '@/components/SlotMachine';
import {useTheme} from '@/contexts/ThemeContext';
import {useUser} from '@/contexts/UserContext';
import {useFirstOpen} from '@/hooks/useFirstOpen';
import {useWidget} from '@/hooks/useWidget';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import {School} from '@/types/api';
import {ClassData, SchoolData} from '@/types/onboarding';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import WheelPicker, {type PickerItem} from '@quidone/react-native-wheel-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {StackScreenProps} from '@react-navigation/stack';

// Constants
const DEMO_SCHOOL_DATA: SchoolData = {
  schoolName: '선린인터넷고',
  comciganCode: '41896',
  comciganRegion: '서울',
  neisCode: '7010536',
  neisRegion: '서울특별시교육청',
  neisRegionCode: 'B10',
} as const;

const SEARCH_DEBOUNCE_DELAY = 300;
const LONG_PRESS_DELAY = 2000;
const SLOT_MACHINE_DELAY = 1500;
const SLOT_MACHINE_DURATION = 300;

const INTRO_MESSAGES = [
  '🍽️ 급식 뭐 나오지?',
  '📚 오늘 1교시가..',
  '📅 중요한 학사일정은?',
  '🎈 곧 있을 학교 행사는?',
  '⏰ 내일 시간표는?',
  '🍕 오늘 점심 맛있을까?',
  '📝 시험 언제였지?',
  '🎒 내일 준비물은?',
  '🏃 체육 있는 날인가?',
  '📖 과제 뭐 있었지?',
  '🚌 몇 시에 끝나지?',
  '☔ 우산 챙겨야 하나?',
  '📌 오늘 공지사항은?',
  '🎯 놓친 일정 없나?',
  '💭 방과후 뭐하지?',
  '🤷 오늘 뭐 먹지?',
  '📚 다음 수업 뭐더라?',
  '🎪 이번 주 행사는?',
]; // const INTRO_MESSAGES = ['🚀 학교생활이 편해진다', '✨ 모든 정보를 한눈에', '📱 스마트한 학교생활', '🎯 놓치는 일정이 없도록'];

// Utility functions
const logScreenView = (screenName: string, screenClass: string) => {
  analytics().logScreenView({screen_name: screenName, screen_class: screenClass});
};

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  showToast(message);
};

const setStorageItems = async (items: Record<string, string>) => {
  await Promise.all(Object.entries(items).map(([key, value]) => AsyncStorage.setItem(key, value)));
};

// Extracted components for better performance and reusability
const SearchEmptyState = React.memo<{
  isLoading: boolean;
  hasInput: boolean;
  hasResults: boolean;
  styles: any;
}>(({isLoading, hasInput, hasResults, styles}) => {
  if (isLoading) {
    return (
      <View style={styles.centerView}>
        <Loading />
      </View>
    );
  }

  if (!hasResults && hasInput) {
    return (
      <View style={styles.centerView}>
        <Text style={styles.subtitle}>검색 결과가 없습니다</Text>
      </View>
    );
  }

  if (!hasResults) {
    return (
      <View style={styles.centerView}>
        <Text style={styles.subtitle}>학교명을 입력해주세요</Text>
      </View>
    );
  }

  return null;
});

const SchoolListItem = React.memo<{
  item: School;
  onPress: (school: School) => void;
  schoolNameStyle: any;
  addressStyle: any;
  itemStyle: any;
}>(({item, onPress, schoolNameStyle, addressStyle, itemStyle}) => (
  <TouchableOpacity style={itemStyle} onPress={() => onPress(item)}>
    <Text style={schoolNameStyle}>{item.schoolName}</Text>
    <Text style={addressStyle}>{item.region}</Text>
  </TouchableOpacity>
));

export const IntroScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {refreshUserData} = useUser();
  const {syncSchoolInfoToNative} = useWidget();

  const {theme, typography, isDark} = useTheme();
  const s = createStyles(theme, typography);

  const handlePress = useCallback(() => {
    navigation.navigate('SchoolSearch', {isFirstOpen: true});
  }, [navigation]);

  const handleLongPress = useCallback(() => {
    trigger('impactLight');
    Alert.alert('데모 모드', '데모 모드에서는 학교를 선택할 수 없어요.\n계속하시겠습니까?', [
      {text: '아니요', style: 'cancel'},
      {
        text: '네',
        onPress: async () => {
          try {
            await setStorageItems({
              demoMode: 'true',
              school: JSON.stringify(DEMO_SCHOOL_DATA),
              class: JSON.stringify({grade: 1, class: 1}),
            });
            await syncSchoolInfoToNative();
            refreshUserData();
            navigation.navigate('Tab');
          } catch (error) {
            handleError(error, 'Demo mode setup failed');
          }
        },
      },
    ]);
  }, [navigation]);

  useEffect(() => {
    logScreenView('온보딩 스크린', 'Onboarding');
  }, []);

  return (
    <View style={s.introContainer}>
      <LinearGradient colors={[theme.background, 'transparent']} start={{x: 0, y: -0.5}} end={{x: 0, y: 1}} style={s.introGradientTop} />
      <View style={s.introImageContainer}>
        <ImageBackground blurRadius={5} source={isDark ? require('@/assets/images/onboarding_dark.png') : require('@/assets/images/onboarding_white.png')} style={s.introBackgroundImage} />
      </View>

      <LinearGradient colors={['transparent', theme.background]} style={s.introGradientBottom} />

      <View style={s.introContentWrapper}>
        {/* <View /> */}
        <View style={s.introTopContent}>
          {/* <View style={s.introWelcomeSection}>
            <View style={s.introWelcomeIconContainer}>
              <LinearGradient colors={[theme.highlight, theme.highlightLight]} style={s.introWelcomeIcon} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                <FontAwesome6 name="graduation-cap" iconStyle="solid" size={32} color={theme.white} />
              </LinearGradient>
            </View>
            <Text style={s.introWelcomeTitle}>학교생활이 더 쉬워져요</Text>
            <Text style={s.introWelcomeSubtitle}>급식, 시간표, 학사일정을{'\n'}한 번에 확인하세요</Text>
          </View> */}

          {/* <SlotMachine list={INTRO_MESSAGES} style={s.introSlotMachine} delay={SLOT_MACHINE_DELAY} duration={SLOT_MACHINE_DURATION} /> */}

          {/* <View style={s.introFeatureGrid}>
            <LinearGradient colors={[`${theme.highlight}15`, `${theme.highlight}05`]} style={s.introFeatureCard} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
              <View style={[s.introFeatureIconWrapper, {backgroundColor: '#FF6B6B'}]}>
                <FontAwesome6 name="utensils" iconStyle="solid" size={22} color={theme.white} />
              </View>
              <View style={s.introFeatureContent}>
                <Text style={s.introFeatureTitle}>급식</Text>
              </View>
            </LinearGradient>

            <LinearGradient colors={[`${theme.highlight}15`, `${theme.highlight}05`]} style={s.introFeatureCard} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
              <View style={[s.introFeatureIconWrapper, {backgroundColor: '#4ECDC4'}]}>
                <FontAwesome6 name="clock" iconStyle="solid" size={22} color={theme.white} />
              </View>
              <View style={s.introFeatureContent}>
                <Text style={s.introFeatureTitle}>시간표</Text>
              </View>
            </LinearGradient>

            <LinearGradient colors={[`${theme.highlight}15`, `${theme.highlight}05`]} style={s.introFeatureCard} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
              <View style={[s.introFeatureIconWrapper, {backgroundColor: '#95e1aa'}]}>
                <FontAwesome6 name="calendar-check" iconStyle="solid" size={22} color={theme.white} />
              </View>
              <View style={s.introFeatureContent}>
                <Text style={s.introFeatureTitle}>학사일정</Text>
              </View>
            </LinearGradient>

            <LinearGradient colors={[`${theme.highlight}15`, `${theme.highlight}05`]} style={s.introFeatureCard} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
              <View style={[s.introFeatureIconWrapper, {backgroundColor: '#a8bde6'}]}>
                <FontAwesome6 name="id-card" iconStyle="solid" size={22} color={theme.white} />
              </View>
              <View style={s.introFeatureContent}>
                <Text style={s.introFeatureTitle}>모바일 학생증</Text>
                <Text style={s.introFeatureDesc}>*일부 고등학교 한정</Text>
              </View>
            </LinearGradient>
          </View> */}
        </View>

        <View style={s.introBottomContent}>
          <View style={s.introTextSection}>
            <Text style={s.introMainTitle}>NYL</Text>
            <Text style={s.introSubText}>급식, 시간표, 학사일정을 한눈에</Text>
          </View>

          <TouchableOpacity style={s.introStartButton} onPress={handlePress} onLongPress={handleLongPress} delayLongPress={LONG_PRESS_DELAY} activeOpacity={0.8}>
            <Text style={s.introStartButtonText}>시작하기</Text>
            <FontAwesome6 name="arrow-right" iconStyle="solid" size={16} color={theme.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const SchoolSearchScreen = ({route}: StackScreenProps<RootStackParamList, 'SchoolSearch'>) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {isFirstOpen = true} = route.params;

  const {theme, typography} = useTheme();
  const s = createStyles(theme, typography);

  const [inputText, setInputText] = useState('');
  const [schoolList, setSchoolList] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSchoolPress = useCallback(
    (school: School) => {
      navigation.navigate('ClassSelect', {school, isFirstOpen});
    },
    [navigation, isFirstOpen],
  );

  const handleClearInput = useCallback(() => {
    setInputText('');
    setSchoolList([]);
  }, []);

  useEffect(() => {
    logScreenView('학교 검색 스크린', 'SchoolSearch');
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const fetchSchools = async () => {
        const query = inputText.replace(/\s+/g, '').trim();

        if (query.length > 0) {
          setIsLoading(true);
          try {
            const response = await comciganSchoolSearch(query);
            setSchoolList(response);
          } catch (error) {
            handleError(error, '학교를 불러오는 중 오류가 발생했어요.');
            setSchoolList([]);
          } finally {
            setIsLoading(false);
          }
        } else {
          setSchoolList([]);
          setIsLoading(false);
        }
      };

      fetchSchools();
    }, SEARCH_DEBOUNCE_DELAY);

    return () => clearTimeout(delayDebounceFn);
  }, [inputText]);

  useEffect(() => {
    const checkPermission = async () => {
      if (isFirstOpen) {
        const settings = await notifee.requestPermission();
        if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
          showToast('알림 권한이 거부되었어요.\n급식 알림을 받으려면 설정에서 권한을 허용해주세요.', 3000);
        }
      }
    };

    checkPermission();
  }, [isFirstOpen]);

  return (
    <View style={s.searchContainer}>
      <View style={s.searchHeader}>
        <FontAwesome6 name="school" iconStyle="solid" size={32} color={theme.highlight} />
        <View style={s.searchHeaderText}>
          <Text style={s.searchTitle}>학교를 검색해주세요</Text>
          <Text style={s.searchSubtitle}>{'재학중인 학교를 선택하시면\n급식과 시간표 정보를 받아올 수 있어요'}</Text>
        </View>
      </View>

      <View style={s.searchInputWrapper}>
        <View style={s.searchInputContainer}>
          <FontAwesome6 name="magnifying-glass" iconStyle="solid" size={16} color={theme.secondaryText} />
          <TextInput placeholder="학교명을 입력하세요" value={inputText} onChangeText={setInputText} maxLength={25} autoCorrect={false} autoCapitalize="none" placeholderTextColor={theme.secondaryText} style={s.searchInput} />
          {inputText.length > 0 && (
            <TouchableOpacity onPress={handleClearInput} activeOpacity={0.7}>
              <FontAwesome6 name="circle-xmark" iconStyle="solid" size={18} color={theme.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.searchResultContainer}>
        <SearchEmptyState isLoading={isLoading} hasInput={inputText.length > 0} hasResults={schoolList.length > 0} styles={s} />
        {schoolList.length > 0 && (
          <FlatList
            style={s.searchResultList}
            data={schoolList}
            keyExtractor={item => item.schoolCode.toString()}
            renderItem={({item}) => (
              <TouchableOpacity style={s.searchResultItem} onPress={() => handleSchoolPress(item)} activeOpacity={0.7}>
                <View style={s.searchResultContent}>
                  <Text style={s.searchResultName}>{item.schoolName}</Text>
                  <Text style={s.searchResultAddress}>{item.region}</Text>
                </View>
                <FontAwesome6 name="angle-right" iconStyle="solid" size={16} color={theme.secondaryText} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
};

export const ClassSelectScreen = ({route}: StackScreenProps<RootStackParamList, 'ClassSelect'>) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {school, isFirstOpen = true} = route.params;
  const {refreshUserData} = useUser();
  const {syncSchoolInfoToNative} = useWidget();

  const [gradeList, setGradeList] = useState<number[]>([]);
  const [classList, setClassList] = useState<number[][]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const {completeOnboarding} = useFirstOpen();
  const {theme, typography, isDark} = useTheme();
  const s = createStyles(theme, typography);

  useEffect(() => {
    logScreenView('학급 선택 스크린', 'ClassSelect');
  }, []);

  useEffect(() => {
    const fetchClassList = async () => {
      try {
        const response = await getClassList(school.schoolCode);
        const _gradeList = response.map(item => item.grade);
        const _classList = response.map(item => item.classes);

        setGradeList(_gradeList);
        setClassList(_classList);
        setSelectedGrade(_gradeList[0]);
        setSelectedClass(_classList[0][0]);
      } catch (error) {
        handleError(error, '학급을 불러오는 중 오류가 발생했어요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassList();
  }, [school.schoolCode]);

  const handleGradeChange = (index?: number) => {
    if (index === undefined || index < 1 || index > gradeList.length) {
      return;
    }

    const newGradeIndex = index - 1;
    setSelectedGrade(gradeList[newGradeIndex]);
    setSelectedClass(classList[newGradeIndex][0]);
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

  const handlePress = async () => {
    if (isButtonDisabled) {
      return;
    }

    setIsButtonDisabled(true);
    setIsLoading(true);

    try {
      const response = await neisSchoolSearch(school.schoolName);
      const neisSchool = response.find(item => item.region.includes(school.region)) || response[0];

      if (!neisSchool) {
        showToast('학교 정보를 불러오는 중 오류가 발생했어요.');
        return;
      }

      const schoolData = {
        schoolName: school.schoolName,
        comciganCode: school.schoolCode,
        comciganRegion: school.region,
        neisCode: neisSchool.schoolCode,
        neisRegion: neisSchool.region,
        neisRegionCode: neisSchool.regionCode,
      };

      const classData: ClassData = {grade: selectedGrade, class: selectedClass};

      // Set storage items
      await Promise.all([
        AsyncStorage.setItem('school', JSON.stringify(schoolData)),
        AsyncStorage.setItem('class', JSON.stringify(classData)),
        AsyncStorage.setItem('demoMode', JSON.stringify(false)),
        AsyncStorage.removeItem('customTimetable'),
        ...(isFirstOpen ? [AsyncStorage.setItem('isFirstOpen', 'false'), AsyncStorage.setItem('firstOpenDate', dayjs().format('YYYY-MM-DD'))] : []),
      ]);

      // Sync school info to native for widget update
      await syncSchoolInfoToNative();

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
            showToast('학교 정보가 변경되어 알림이 해제되었어요.');
          }
        }
      } catch (e) {
        console.error('Error removing FCM token:', e);
      }

      // Refresh user data in context
      refreshUserData();

      if (isFirstOpen) {
        await completeOnboarding();
      }

      navigation.reset({
        index: 0,
        routes: [{name: 'Tab'}],
      });
    } catch (error) {
      handleError(error, '학교 정보를 불러오는 중 오류가 발생했어요.');
    } finally {
      setIsButtonDisabled(false);
      setIsLoading(false);
    }
  };

  return (
    <View style={s.classSelectContainer}>
      <View style={s.classSelectContent}>
        <View style={s.classSelectHeader}>
          <FontAwesome6 name="users" iconStyle="solid" size={32} color={theme.highlight} />
          <View style={s.classSelectHeaderText}>
            <Text style={s.classSelectTitle}>학급 정보를 선택해주세요</Text>
            <Text style={s.classSelectSubtitle}>{school.schoolName}</Text>
          </View>
        </View>

        <View style={s.classSelectPickerWrapper}>
          {isLoading ? (
            <View style={s.centerView}>
              <Loading />
            </View>
          ) : (
            <>
              <View style={s.classSelectPickerContainer}>
                <WheelPicker
                  data={gradeList.map(grade => ({value: grade, label: `${grade}학년`}))}
                  value={selectedGrade}
                  itemHeight={50}
                  visibleItemCount={5}
                  onValueChanged={({item}) => handleGradeChange(gradeList.indexOf(item.value) + 1)}
                  itemTextStyle={{
                    fontSize: 20,
                    color: theme.primaryText,
                    fontWeight: '500',
                  }}
                  overlayItemStyle={
                    isDark
                      ? {
                          backgroundColor: theme.white,
                        }
                      : undefined
                  }
                  style={{flex: 1}}
                />
                <WheelPicker
                  data={(classList[gradeList.indexOf(selectedGrade)] || []).map(cls => ({value: cls, label: `${cls}반`}))}
                  value={selectedClass}
                  itemHeight={50}
                  visibleItemCount={5}
                  onValueChanged={({item}) => handleClassChange((classList[gradeList.indexOf(selectedGrade)] || []).indexOf(item.value) + 1)}
                  itemTextStyle={{
                    fontSize: 20,
                    color: theme.primaryText,
                    fontWeight: '500',
                  }}
                  overlayItemStyle={
                    isDark
                      ? {
                          backgroundColor: theme.white,
                        }
                      : undefined
                  }
                  style={{flex: 1}}
                />
              </View>

              <View style={s.classSelectInfo}>
                <FontAwesome6 name="circle-info" iconStyle="solid" size={14} color={theme.secondaryText} />
                <Text style={s.classSelectInfoText}>시간표와 학급 알림을 위해 필요한 정보예요</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity style={[s.classSelectButton, isButtonDisabled && s.classSelectButtonDisabled]} onPress={handlePress} disabled={isButtonDisabled} activeOpacity={0.8}>
        <Text style={s.classSelectButtonText}>시작하기</Text>
      </TouchableOpacity>
    </View>
  );
};
