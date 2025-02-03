import React, {useEffect, useState} from 'react';
import {FlatList, Image, Text, TextInput, TouchableOpacity, View} from 'react-native';
import ScrollPicker from 'react-native-wheel-scrollview-picker';

import {style as s} from './styles';
import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

const Stack = createStackNavigator();

type OnboardingStackParamList = {
  Intro: undefined;
  School: undefined;
  GradeClass: undefined;
};

const Onboarding = () => (
  <Stack.Navigator
    initialRouteName="Intro"
    screenOptions={{
      headerShown: false,
      cardStyle: {backgroundColor: theme.colors.background},
      animation: 'slide_from_right',
    }}>
    <Stack.Screen name="Intro" component={Intro} />
    <Stack.Screen name="School" component={School} />
    <Stack.Screen name="GradeClass" component={GradeClass} />
  </Stack.Navigator>
);

const Intro = () => {
  const navigation = useNavigation<NavigationProp<OnboardingStackParamList>>();

  return (
    <View style={s.introContainer}>
      <View style={s.onboardingImageContainer}>
        <Image source={require('@/assets/images/onboarding.png')} style={s.onboardingImage} />
      </View>
      <View style={s.introContent}>
        <View>
          <Text style={s.introTitle}>안녕하세요 👋</Text>
          <Text style={s.introTitle}>🦔🍤🥔🍠</Text>
        </View>
        <TouchableOpacity style={s.nextButton} onPress={() => navigation.navigate('School')}>
          <Text style={s.nextButtonText}>계속하기</Text>
          <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.colors.primaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const School = () => {
  const navigation = useNavigation<NavigationProp<OnboardingStackParamList>>();

  const [inputText, setInputText] = useState('');
  const [schoolList] = useState([
    {name: '선린인터넷고1', address: '서울특별시 용산구 청파동'},
    {name: '선린인터넷고2', address: '서울특별시 용산구 청파동'},
    {name: '선린인터넷고3', address: '서울특별시 용산구 청파동'},
    {name: '선린인터넷고4', address: '서울특별시 용산구 청파동'},
    {name: '선린인터넷고5', address: '서울특별시 용산구 청파동'},
    {name: '선린인터넷고6', address: '서울특별시 용산구 청파동'},
    {name: '선린인터넷고7', address: '서울특별시 용산구 청파동'},
    {name: '선린인터넷고8', address: '서울특별시 용산구 청파동'},
    {name: '선린인터넷고9', address: '서울특별시 용산구 청파동'},
    {name: '선린인터넷고10', address: '서울특별시 용산구 청파동'},
    {name: '선린중1', address: '서울특별시 용산구 청파동'},
    {name: '선린중2', address: '서울특별시 용산구 청파동'},
    {name: '선린중3', address: '서울특별시 용산구 청파동'},
    {name: '선린중4', address: '서울특별시 용산구 청파동'},
    {name: '선린중5', address: '서울특별시 용산구 청파동'},
    {name: '선린중6', address: '서울특별시 용산구 청파동'},
    {name: '선린중7', address: '서울특별시 용산구 청파동'},
    {name: '선린중8', address: '서울특별시 용산구 청파동'},
    {name: '선린중9', address: '서울특별시 용산구 청파동'},
    {name: '선린중10', address: '서울특별시 용산구 청파동'},
  ]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      console.log(inputText);
    }, 200);

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
            <TextInput placeholder="학교명" value={inputText} onChangeText={setInputText} maxLength={25} autoCorrect={false} autoCapitalize="none" placeholderTextColor={theme.colors.secondaryText} style={s.textInput} />
            <TouchableOpacity onPress={() => navigation.navigate('School')}>
              <FontAwesome6 name="magnifying-glass" iconStyle="solid" size={18} color={theme.colors.primaryText} />
            </TouchableOpacity>
          </View>
          <FlatList
            style={s.schoolFlatList}
            data={schoolList}
            keyExtractor={item => item.name}
            renderItem={({item}) => (
              <TouchableOpacity style={s.schoolFlatListItem} onPress={() => console.log(item.name)}>
                <Text style={s.schoolFlatListNameText}>{item.name}</Text>
                <Text style={s.schoolFlatListAddrText}>{item.address}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
      <TouchableOpacity style={s.nextButton} onPress={() => navigation.navigate('GradeClass')}>
        <Text style={s.nextButtonText}>계속하기</Text>
        <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.colors.primaryText} />
      </TouchableOpacity>
    </View>
  );
};

const GradeClass = () => {
  const navigation = useNavigation<NavigationProp<OnboardingStackParamList>>();

  return (
    <View style={s.inputContainer}>
      <View style={s.inputContentTop}>
        <View>
          <Text style={s.title}>학년과 반을 선택해주세요</Text>
          <Text style={s.subtitle}>시간표 정보를 받아오기 위해 필요해요</Text>
        </View>
        <View style={s.inputContent}>
          <View style={s.scrollPickerContainer}>
            <ScrollPicker
              dataSource={['1학년', '2학년', '3학년']}
              selectedIndex={0}
              wrapperHeight={150}
              wrapperBackground={'transparent'}
              itemHeight={50}
              highlightColor={theme.colors.secondaryText}
              highlightBorderWidth={2}
              itemTextStyle={{fontSize: 20}}
              onValueChange={(data, selectedIndex) => console.log(data, selectedIndex)}
              renderItem={(data, index, isSelected) => <Text style={{fontSize: 20, color: isSelected ? theme.colors.primaryText : theme.colors.secondaryText}}>{data}</Text>}
            />
            <ScrollPicker
              dataSource={['1반', '2반', '3반', '4반', '5반', '6반', '7반', '8반', '9반', '10반']}
              selectedIndex={0}
              wrapperHeight={150}
              wrapperBackground={'transparent'}
              itemHeight={50}
              highlightColor={theme.colors.secondaryText}
              highlightBorderWidth={2}
              itemTextStyle={{fontSize: 20}}
              onValueChange={(data, selectedIndex) => console.log(data, selectedIndex)}
              renderItem={(data, index, isSelected) => <Text style={{fontSize: 20, color: isSelected ? theme.colors.primaryText : theme.colors.secondaryText}}>{data}</Text>}
            />
          </View>
        </View>
      </View>
      <TouchableOpacity style={s.nextButton} onPress={() => navigation.navigate('GradeClass')}>
        <Text style={s.nextButtonText}>계속하기</Text>
        <FontAwesome6 name="angle-right" iconStyle="solid" size={18} color={theme.colors.primaryText} />
      </TouchableOpacity>
    </View>
  );
};

export default Onboarding;
