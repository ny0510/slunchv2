import dayjs from 'dayjs';
import React, {useEffect, useRef, useState} from 'react';
import {FlatList, ImageBackground, Text, TextInput, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ScrollPicker from 'react-native-wheel-scrollview-picker';

import {style as s} from './styles';
import {comciganSchoolSearch, getClassList, neisSchoolSearch, removeFcmToken} from '@/api';
import Loading from '@/components/Loading';
import SlotMachine from '@/components/SlotMachine';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';
import {School} from '@/types/api';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {StackScreenProps} from '@react-navigation/stack';

export const IntroScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const handlePress = () => {
    // if (!isButtonDisabled) {
    setIsButtonDisabled(true);
    navigation.navigate('SchoolSearch', {isFirstOpen: true});
    // }
  };

  useEffect(() => {
    analytics().logScreenView({screen_name: '인트로 스크린', screen_class: 'Intro'});
  }, []);

  return (
    <View style={s.introContainer}>
      <LinearGradient colors={[theme.colors.background, 'transparent']} style={{position: 'absolute', top: 0, left: 0, right: 0, height: 150, zIndex: 10}} />
      <View style={s.onboardingImageContainer}>
        <ImageBackground blurRadius={5} source={require('@/assets/images/onboarding.png')} style={s.onboardingImage} />
      </View>
      <LinearGradient colors={['transparent', theme.colors.background]} style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 250}} />
      <View style={s.introContent}>
        <View style={{gap: 8}}>
          <SlotMachine list={['🍽️ 급식 뭐 나오지?', '📚 오늘 1교시가,,', '📅 중요한 학사일정은?', '🎈 곧 있을 학교 행사는?']} style={s.introTitle} delay={1500} duration={300} />
          <View>
            <Text style={[theme.typography.body, {fontFamily: theme.fontWeights.semiBold}]}>챙기기 번거로운 학사일정, 시간표 및 급식을 간편하게</Text>
            <Text style={[theme.typography.body, {fontFamily: theme.fontWeights.semiBold}]}>확인하세요!</Text>
          </View>
        </View>
        <TouchableOpacity style={s.nextButton} onPress={handlePress}>
          <Text style={s.nextButtonText}>시작하기</Text>
          <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.colors.primaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SchoolSearchScreen = ({route}: StackScreenProps<RootStackParamList, 'SchoolSearch'>) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {isFirstOpen = true} = route.params;

  const [inputText, setInputText] = useState('');
  const [schoolList, setSchoolList] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    analytics().logScreenView({screen_name: '학교 검색 스크린', screen_class: 'SchoolSearch'});
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const fetchSchools = async () => {
        const query = inputText.replace(/\s+/g, '').trim();

        if (query.length > 0) {
          try {
            const response = await comciganSchoolSearch(query);
            setSchoolList(response);
          } catch (e) {
            const err = e as Error;

            showToast('학교를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
            console.error('Error fetching schools:', err);
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
    }, 300);

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
            <TextInput placeholder="학교명" value={inputText} onKeyPress={() => setIsLoading(true)} onChangeText={setInputText} maxLength={25} autoCorrect={false} autoCapitalize="none" placeholderTextColor={theme.colors.secondaryText} style={s.textInput} />
            <TouchableOpacity
              onPress={() => {
                setInputText('');
                setSchoolList([]);
              }}>
              <FontAwesome6 name="delete-left" iconStyle="solid" size={18} color={theme.colors.primaryText} />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={s.centerView}>
              <Loading />
            </View>
          ) : schoolList.length === 0 && inputText.length > 0 ? (
            <View style={s.centerView}>
              <Text style={s.subtitle}>검색 결과가 없습니다</Text>
            </View>
          ) : schoolList.length === 0 ? (
            <View style={s.centerView}>
              <Text style={s.subtitle}>학교명을 입력해주세요</Text>
            </View>
          ) : (
            <FlatList
              style={s.schoolFlatList}
              data={schoolList}
              keyExtractor={item => item.schoolCode.toString()}
              renderItem={({item}) => (
                <TouchableOpacity style={s.schoolFlatListItem} onPress={() => navigation.navigate('ClassSelect', {school: item, isFirstOpen: isFirstOpen})}>
                  <Text style={s.schoolFlatListNameText}>{item.schoolName}</Text>
                  <Text style={s.schoolFlatListAddrText}>{item.region}</Text>
                </TouchableOpacity>
              )}
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

  const classScrollPickerRef = useRef<any>(null);

  useEffect(() => {
    analytics().logScreenView({screen_name: '학급 선택 스크린', screen_class: 'ClassSelect'});
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
      } catch (e) {
        const err = e as Error;

        showToast('학급을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
        console.error('Error fetching class list:', err);
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
    if (!isButtonDisabled) {
      setIsButtonDisabled(true);
      const response = await neisSchoolSearch(school.schoolName);
      const neisSchool = response.find(item => item.region.includes(school.region)) || response[0];

      if (!neisSchool) {
        showToast('학교 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
        setIsButtonDisabled(false);
        return;
      }

      if (isFirstOpen) {
        AsyncStorage.setItem('isFirstOpen', 'false');
        AsyncStorage.setItem('firstOpenDate', dayjs().format('YYYY-MM-DD'));
      }

      AsyncStorage.setItem(
        'school',
        JSON.stringify({
          schoolName: school.schoolName,
          comciganCode: school.schoolCode,
          comciganRegion: school.region,
          neisCode: neisSchool.schoolCode,
          neisRegion: neisSchool.region,
          neisRegionCode: neisSchool.regionCode,
        }),
      );
      AsyncStorage.setItem('class', JSON.stringify({grade: selectedGrade, class: selectedClass}));

      // 학급 정보 변경되면 알림 해제
      try {
        const storedToken = await AsyncStorage.getItem('fcmToken');
        const isNotiEnabled = await AsyncStorage.getItem('isNotiEnabled');
        const isNotiEnabledParsed = isNotiEnabled ? JSON.parse(isNotiEnabled) : false;

        if (isNotiEnabledParsed && storedToken) {
          await removeFcmToken(storedToken);
          await AsyncStorage.setItem('isNotiEnabled', JSON.stringify(false));

          showToast('학교 정보가 변경되어 알림이 해제되었어요.');
        }
      } catch (e) {
        console.error('Error removing FCM token:', e);
      }

      navigation.reset({
        index: 0,
        routes: [{name: 'Tab'}],
      });
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
                highlightColor={theme.colors.secondaryText}
                highlightBorderWidth={1}
                onValueChange={handleGradeChange}
                renderItem={(data, index, isSelected) => <Text style={{fontSize: 20, color: isSelected ? theme.colors.primaryText : theme.colors.secondaryText, fontFamily: theme.typography.subtitle.fontFamily}}>{data}학년</Text>}
              />
              <ScrollPicker
                dataSource={classList[gradeList.indexOf(selectedGrade)]}
                wrapperBackground={'transparent'}
                itemHeight={50}
                highlightColor={theme.colors.secondaryText}
                highlightBorderWidth={1}
                onValueChange={handleClassChange}
                ref={classScrollPickerRef}
                renderItem={(data, index, isSelected) => <Text style={{fontSize: 20, color: isSelected ? theme.colors.primaryText : theme.colors.secondaryText, fontFamily: theme.typography.subtitle.fontFamily}}>{data}반</Text>}
              />
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity style={s.nextButton} onPress={handlePress} disabled={isButtonDisabled}>
        <Text style={s.nextButtonText}>계속하기</Text>
        <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.colors.primaryText} />
      </TouchableOpacity>
    </View>
  );
};
