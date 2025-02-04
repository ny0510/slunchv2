import React, {useEffect, useState} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {enableScreens} from 'react-native-screens';

import HomeScreen from '@/screens/Home';
import {ClassSelectScreen, IntroScreen, SchoolSearchScreen} from '@/screens/Onboarding';
import {theme} from '@/styles/theme';
import {School} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createStaticNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

export type RootStackParamList = {
  Home: undefined;
  Intro: undefined;
  SchoolSearch: undefined;
  ClassSelect: {school: School};
};

const App = () => {
  enableScreens();
  const [isFirstOpen, setIsFirstOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkIfFirstOpen = async () => {
      const _isFirstOpen = await AsyncStorage.getItem('isFirstOpen');
      setIsFirstOpen(!_isFirstOpen);
    };

    checkIfFirstOpen();
  }, []);

  const RootStack = createStackNavigator({
    initialRouteName: isFirstOpen ? 'Intro' : 'Home',
    screenOptions: {
      headerShown: false,
      cardStyle: {backgroundColor: theme.colors.background},
      animation: 'slide_from_right',
    },
    screens: {
      Home: HomeScreen,
      Intro: IntroScreen,
      SchoolSearch: SchoolSearchScreen,
      ClassSelect: ClassSelectScreen,
    },
  });
  const Stack = createStaticNavigation(RootStack);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <StatusBar animated barStyle="light-content" backgroundColor={theme.colors.background} />
      <Stack />
    </SafeAreaView>
  );
};

export default App;
