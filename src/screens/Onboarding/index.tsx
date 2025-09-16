import dayjs from 'dayjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, FlatList, ImageBackground, Platform, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {trigger} from 'react-native-haptic-feedback';
import LinearGradient from 'react-native-linear-gradient';
import ScrollPicker from 'react-native-wheel-scrollview-picker';

import {createStyles} from './styles';
import {comciganSchoolSearch, getClassList, neisSchoolSearch, removeFcmToken} from '@/api';
import Loading from '@/components/Loading';
import SlotMachine from '@/components/SlotMachine';
import {useTheme} from '@/contexts/ThemeContext';
import {useFirstOpen} from '@/hooks/useFirstOpen';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import {School} from '@/types/api';
import {ClassData, SchoolData} from '@/types/onboarding';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
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

const INTRO_MESSAGES = ['🍽️ 급식 뭐 나오지?', '📚 오늘 1교시가,,', '📅 중요한 학사일정은?', '🎈 곧 있을 학교 행사는?'];

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
              class: JSON.stringify({grade: '1', class: '1'}),
            });
            navigation.navigate('Tab');
          } catch (error) {
            handleError(error, 'Demo mode setup failed');
          }
        },
      },
    ]);
  }, [navigation]);

  useEffect(() => {
    logScreenView('인트로 스크린', 'Intro');
  }, []);

  return (
    <View style={s.introContainer}>
      {isDark && <LinearGradient colors={[theme.background, 'transparent']} style={{position: 'absolute', top: 0, left: 0, right: 0, height: 150, zIndex: 10}} />}
      <View style={s.onboardingImageContainer}>
        <ImageBackground blurRadius={Platform.OS === 'ios' ? 8 : 5} source={isDark ? require('@/assets/images/onboarding_dark.png') : require('@/assets/images/onboarding_white.png')} style={s.onboardingImage} />
      </View>
      <LinearGradient colors={['transparent', theme.background]} style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 250}} />
      <View style={s.introContent}>
        <View style={{gap: 8}}>
          <SlotMachine list={INTRO_MESSAGES} style={s.introTitle} delay={SLOT_MACHINE_DELAY} duration={SLOT_MACHINE_DURATION} />
          <View>
            <Text style={[typography.body, {color: theme.primaryText, fontWeight: '600'}]}>챙기기 번거로운 학사일정, 시간표 및 급식을 간편하게</Text>
            <Text style={[typography.body, {color: theme.primaryText, fontWeight: '600'}]}>확인하세요!</Text>
          </View>
        </View>
        <TouchableOpacity style={s.nextButton} onPress={handlePress} onLongPress={handleLongPress} delayLongPress={LONG_PRESS_DELAY}>
          <Text style={s.nextButtonText}>시작하기</Text>
          <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.primaryText} />
        </TouchableOpacity>
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
    <View style={s.inputContainer}>
      <View style={s.inputContentTop}>
        <View>
          <Text style={s.title}>학교를 선택해주세요</Text>
          <Text style={s.subtitle}>급식 정보를 받아오기 위해 필요해요</Text>
          <Text style={s.subtitle}>컴시간알리미에 등록된 학교만 검색 가능해요</Text>
        </View>
        <View style={s.inputContent}>
          <View style={s.textInputContainer}>
            <TextInput placeholder="학교명" value={inputText} onKeyPress={() => setIsLoading(true)} onChangeText={setInputText} maxLength={25} autoCorrect={false} autoCapitalize="none" placeholderTextColor={theme.secondaryText} style={s.textInput} />
            <TouchableOpacity onPress={handleClearInput}>
              <FontAwesome6 name="delete-left" iconStyle="solid" size={18} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          <SearchEmptyState isLoading={isLoading} hasInput={inputText.length > 0} hasResults={schoolList.length > 0} styles={s} />
          {schoolList.length > 0 && (
            <FlatList
              style={s.schoolFlatList}
              data={schoolList}
              keyExtractor={item => item.schoolCode.toString()}
              renderItem={({item}) => <SchoolListItem item={item} onPress={handleSchoolPress} schoolNameStyle={s.schoolFlatListNameText} addressStyle={s.schoolFlatListAddrText} itemStyle={s.schoolFlatListItem} />}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export const ClassSelectScreen = ({route}: StackScreenProps<RootStackParamList, 'ClassSelect'>) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {school, isFirstOpen = true} = route.params;

  const [gradeList, setGradeList] = useState<number[]>([]);
  const [classList, setClassList] = useState<number[][]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const {completeOnboarding} = useFirstOpen();
  const {theme, typography} = useTheme();
  const s = createStyles(theme, typography);

  const classScrollPickerRef = useRef<any>(null);

  useEffect(() => {
    logScreenView('학급 선택 스크린', 'ClassSelect');
  }, []);

  useEffect(() => {
    const fetchClassList = async () => {
      try {
        const response = await getClassList(Number(school.schoolCode));
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

      const classData: ClassData = {grade: selectedGrade.toString(), class: selectedClass.toString()};

      // Set storage items
      await Promise.all([
        AsyncStorage.setItem('school', JSON.stringify(schoolData)),
        AsyncStorage.setItem('class', JSON.stringify(classData)),
        AsyncStorage.setItem('demoMode', JSON.stringify(false)),
        AsyncStorage.removeItem('customTimetable'),
        ...(isFirstOpen ? [AsyncStorage.setItem('isFirstOpen', 'false'), AsyncStorage.setItem('firstOpenDate', dayjs().format('YYYY-MM-DD'))] : []),
      ]);

      // Handle FCM token removal if needed
      try {
        const [storedToken, isNotiEnabled] = await Promise.all([AsyncStorage.getItem('fcmToken'), AsyncStorage.getItem('isNotiEnabled')]);

        const isNotiEnabledParsed = isNotiEnabled ? JSON.parse(isNotiEnabled) : false;

        if (isNotiEnabledParsed && storedToken) {
          await Promise.all([removeFcmToken(storedToken), AsyncStorage.setItem('isNotiEnabled', JSON.stringify(false))]);
          showToast('학교 정보가 변경되어 알림이 해제되었어요.');
        }
      } catch (e) {
        console.error('Error removing FCM token:', e);
      }

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
    <View style={s.inputContainer}>
      <View style={s.inputContentTop}>
        <View>
          <Text style={s.title}>학년과 반을 선택해주세요</Text>
          <Text style={s.subtitle}>시간표 정보를 받아오기 위해 필요해요</Text>
        </View>
        <View style={s.inputContent}>
          {isLoading ? (
            <View style={s.centerView}>
              <Loading />
            </View>
          ) : (
            <View style={s.scrollPickerContainer}>
              <ScrollPicker
                dataSource={gradeList}
                wrapperBackground={'transparent'}
                itemHeight={50}
                highlightColor={theme.secondaryText}
                highlightBorderWidth={1}
                onValueChange={handleGradeChange}
                renderItem={(data, index, isSelected) => <Text style={{fontSize: 20, color: isSelected ? theme.primaryText : theme.secondaryText, fontWeight: '500'}}>{data}학년</Text>}
              />
              <ScrollPicker
                dataSource={classList[gradeList.indexOf(selectedGrade)]}
                wrapperBackground={'transparent'}
                itemHeight={50}
                highlightColor={theme.secondaryText}
                highlightBorderWidth={1}
                onValueChange={handleClassChange}
                ref={classScrollPickerRef}
                renderItem={(data, index, isSelected) => <Text style={{fontSize: 20, color: isSelected ? theme.primaryText : theme.secondaryText, fontWeight: '500'}}>{data}반</Text>}
              />
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity style={s.nextButton} onPress={handlePress} disabled={isButtonDisabled}>
        <Text style={s.nextButtonText}>계속하기</Text>
        <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.primaryText} />
      </TouchableOpacity>
    </View>
  );
};
