import React from 'react';
import {Platform} from 'react-native';

import {useFirstOpen} from '@/hooks/useFirstOpen';
import BottomTabs from '@/navigation/BottomTabs';
import Meal from '@/screens/Meal';
import {ClassSelectScreen, IntroScreen, SchoolSearchScreen} from '@/screens/Onboarding';
import Schedules from '@/screens/Schedules';
import DeveloperInfo from '@/screens/Tab/Settings/screens/DeveloperInfo';
import Notification from '@/screens/Tab/Settings/screens/Notification';
import Widget from '@/screens/Tab/Settings/screens/Widget';
import {theme} from '@/styles/theme';
import {School} from '@/types/api';
import {createStaticNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

export type RootStackParamList = {
  Tab: undefined;
  Intro: undefined;
  SchoolSearch: {isFirstOpen?: boolean};
  ClassSelect: {school: School; isFirstOpen?: boolean};
  Notifications: undefined;
  Schedules: undefined;
  Meal: undefined;
  DeveloperInfo: undefined;
  Notification: undefined;
  Widget: undefined;
};

const RootStacks = () => {
  const isFirstOpen = useFirstOpen();

  if (isFirstOpen === null) {
    return null;
  }

  const RootStack = createStackNavigator({
    initialRouteName: isFirstOpen ? 'Intro' : 'Tab',
    screenOptions: {
      headerShown: false,
      animation: Platform.OS === 'ios' ? 'slide_from_right' : 'scale_from_center', // ios: slide_from_right, android: scale_from_center
      freezeOnBlur: true,
      cardStyle: {backgroundColor: theme.colors.background},
      headerStatusBarHeight: 0,
      headerStyle: {
        backgroundColor: theme.colors.background,
        shadowColor: 'transparent',
        borderBottomColor: theme.colors.border,
        borderBottomWidth: 1,
      },
      headerTintColor: theme.colors.primaryText,
      headerTitleAlign: 'left',
      headerTitleStyle: {
        color: theme.colors.primaryText,
        fontFamily: theme.typography.subtitle.fontFamily,
        fontSize: theme.typography.subtitle.fontSize,
      },
      headerLeftContainerStyle: {
        paddingLeft: 4,
      },
      headerBackButtonDisplayMode: 'minimal',
      headerBackAccessibilityLabel: '뒤로가기',
    },
    screens: {
      Intro: IntroScreen,
      SchoolSearch: SchoolSearchScreen,
      ClassSelect: ClassSelectScreen,
      Tab: BottomTabs,
      Schedules: {
        screen: Schedules,
        options: {
          headerShown: true,
          title: '학사일정',
        },
      },
      Meal: {
        screen: Meal,
        options: {
          headerShown: true,
          title: '급식',
        },
      },
      DeveloperInfo: {
        screen: DeveloperInfo,
        options: {
          headerShown: true,
          title: '개발자 정보',
        },
      },
      Notification: {
        screen: Notification,
        options: {
          headerShown: true,
          title: '알림 설정',
        },
      },
      Widget: {
        screen: Widget,
        options: {
          headerShown: true,
          title: '위젯 추가',
        },
      },
    },
  });
  const Stack = createStaticNavigation(RootStack);

  return <Stack />;
};

export default RootStacks;
