import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View} from 'react-native';
import ScrollPicker from 'react-native-wheel-scrollview-picker';

import {style as s} from './styles';
import {getClassList, searchSchool} from '@/api/api';
import {RootStackParamList} from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';
import {School} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {StackScreenProps} from '@react-navigation/stack';

export const IntroScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
          <Text style={s.nextButtonText}>시작하기</Text>
          <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.colors.primaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SchoolSearchScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
              keyExtractor={item => item.schoolCode.toString()}
              renderItem={({item}) => (
                <TouchableOpacity style={s.schoolFlatListItem} onPress={() => navigation.navigate('ClassSelect', {school: item})}>
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
  const {school} = route.params;

  const [gradeList, setGradeList] = useState<number[]>([]);
  const [classList, setClassList] = useState<number[][]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const classScrollPickerRef = useRef<any>(null);

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
        console.error('Error fetching class list:', error);
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
      <TouchableOpacity
        style={s.nextButton}
        onPress={() => {
          AsyncStorage.setItem('isFirstOpen', 'false');
          AsyncStorage.setItem('school', JSON.stringify(school));
          AsyncStorage.setItem('class', JSON.stringify({grade: selectedGrade, class: selectedClass}));

          console.log(`grade: ${selectedGrade}, class: ${selectedClass}`);

          navigation.reset({
            index: 0,
            routes: [{name: 'Tab'}],
          });
        }}>
        <Text style={s.nextButtonText}>계속하기</Text>
        <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.colors.primaryText} />
      </TouchableOpacity>
    </View>
  );
};
