import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View} from 'react-native';
import ScrollPicker from 'react-native-wheel-scrollview-picker';

import {style as s} from './styles';
import {getClassList, searchSchool} from '@/api/api';
import {theme} from '@/styles/theme';
import {School} from '@/types/api';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {NavigationProp, RouteProp, useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

type OnboardingStackParamList = {
  Intro: undefined;
  SchoolSearch: undefined;
  ClassSelect: {school: School};
};

const Stack = createStackNavigator();

const Onboarding = () => (
  <Stack.Navigator
    initialRouteName="Intro"
    screenOptions={{
      headerShown: false,
      cardStyle: {backgroundColor: theme.colors.background},
      animation: 'slide_from_right',
    }}>
    <Stack.Screen name="Intro" component={IntroScreen} />
    <Stack.Screen name="SchoolSearch" component={SchoolSearchScreen} />
    <Stack.Screen name="ClassSelect" component={ClassSelectScreen} />
  </Stack.Navigator>
);

const IntroScreen = () => {
  const navigation = useNavigation<NavigationProp<OnboardingStackParamList>>();

  return (
    <View style={s.introContainer}>
      <View style={s.onboardingImageContainer}>
        <Image source={require('@/assets/images/onboarding.png')} style={s.onboardingImage} />
      </View>
      <View style={s.introContent}>
        <View>
          <Text style={s.introTitle}>오늘 급식 뭐임?</Text>
          <Text style={s.introTitle}>🍔🍕🍣🍜🍩</Text>
        </View>
        <TouchableOpacity style={s.nextButton} onPress={() => navigation.navigate('SchoolSearch')}>
          <Text style={s.nextButtonText}>계속하기</Text>
          <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.colors.primaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SchoolSearchScreen = () => {
  const navigation = useNavigation<NavigationProp<OnboardingStackParamList>>();

  const [inputText, setInputText] = useState('');
  const [schoolList, setSchoolList] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const fetchSchools = async () => {
        const query = inputText.trim();

        if (query.length > 0) {
          try {
            const response = await searchSchool(query);
            setSchoolList(response);
          } catch (error) {
            console.error('Error fetching schools:', error);
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

  return (
    <View style={s.inputContainer}>
      <View style={s.inputContentTop}>
        <View>
          <Text style={s.title}>학교를 선택해주세요</Text>
          <Text style={s.subtitle}>급식 정보를 받아오기 위해 필요해요</Text>
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
              <ActivityIndicator size="large" color={theme.colors.primaryText} />
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
              keyExtractor={item => item.code.toString()}
              renderItem={({item}) => (
                <TouchableOpacity style={s.schoolFlatListItem} onPress={() => navigation.navigate('ClassSelect', {school: item})}>
                  <Text style={s.schoolFlatListNameText}>{item.name}</Text>
                  <Text style={s.schoolFlatListAddrText}>{item.period}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const ClassSelectScreen = ({route}: {route: RouteProp<OnboardingStackParamList, 'ClassSelect'>}) => {
  const navigation = useNavigation<NavigationProp<OnboardingStackParamList>>();
  const {school} = route.params;

  const [classList, setClassList] = useState<{[key: string]: string[]}>({});
  const [gradeList, setGradeList] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedClassList, setSelectedClassList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const classScrollPickerRef = useRef<any>(null);

  useEffect(() => {
    const fetchClassList = async () => {
      try {
        const response = await getClassList(school.name, school.code);
        const groupedClasses = response.reduce((acc: {[key: string]: string[]}, className: string) => {
          const [grade, classNum] = className.split('-');
          if (!acc[grade]) {
            acc[grade] = [];
          }
          acc[grade].push(`${classNum}반`);
          return acc;
        }, {});
        setClassList(groupedClasses);
        const grades = Object.keys(groupedClasses).map(grade => `${grade}학년`);
        setGradeList(grades);
        if (grades.length > 0) {
          setSelectedGrade(grades[0]);
          const initialClassList = groupedClasses[grades[0].replace('학년', '')];
          setSelectedClassList(initialClassList);
          if (initialClassList.length > 0) {
            setSelectedClass(initialClassList[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching class list:', error);
        setClassList({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassList();
  }, [school]);

  const handleGradeChange = (grade: string | undefined) => {
    if (!grade) {
      return;
    }

    setSelectedGrade(grade);
    const gradeNumber = grade.replace('학년', '');
    const newClassList = classList[gradeNumber] || [];
    setSelectedClassList(newClassList);
    if (newClassList.length > 0) {
      setSelectedClass(newClassList[0]);
      classScrollPickerRef.current?.scrollToTargetIndex(0);
    }
  };

  const handleClassChange = (className: string | undefined) => {
    if (!className) {
      return;
    }

    setSelectedClass(className);
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
              <ActivityIndicator size="large" color={theme.colors.primaryText} />
            </View>
          ) : (
            <View style={s.scrollPickerContainer}>
              <ScrollPicker
                dataSource={gradeList}
                selectedIndex={0}
                wrapperHeight={150}
                wrapperBackground={'transparent'}
                itemHeight={50}
                highlightColor={theme.colors.secondaryText}
                highlightBorderWidth={2}
                itemTextStyle={{fontSize: 20}}
                onValueChange={handleGradeChange}
                renderItem={(data, index, isSelected) => <Text style={{fontSize: 20, color: isSelected ? theme.colors.primaryText : theme.colors.secondaryText, fontFamily: theme.typography.subtitle.fontFamily}}>{data}</Text>}
              />
              <ScrollPicker
                dataSource={selectedClassList}
                selectedIndex={0}
                wrapperHeight={150}
                wrapperBackground={'transparent'}
                itemHeight={50}
                highlightColor={theme.colors.secondaryText}
                highlightBorderWidth={2}
                itemTextStyle={{fontSize: 20}}
                onValueChange={handleClassChange}
                ref={classScrollPickerRef}
                renderItem={(data, index, isSelected) => <Text style={{fontSize: 20, color: isSelected ? theme.colors.primaryText : theme.colors.secondaryText, fontFamily: theme.typography.subtitle.fontFamily}}>{data}</Text>}
              />
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={s.nextButton}
        onPress={() => {
          console.log(`Selected grade: ${selectedGrade}, Selected class: ${selectedClass}`);
        }}>
        <Text style={s.nextButtonText}>계속하기</Text>
        <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.colors.primaryText} />
      </TouchableOpacity>
    </View>
  );
};

export default Onboarding;
