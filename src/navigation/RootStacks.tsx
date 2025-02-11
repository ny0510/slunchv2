import React from 'react';

import {useFirstOpen} from '@/hooks/useFirstOpen';
import BottomTabs from '@/navigation/BottomTabs';
import Meal from '@/screens/Meal';
import Notifications from '@/screens/Notifications';
import {ClassSelectScreen, IntroScreen, SchoolSearchScreen} from '@/screens/Onboarding';
import Schedules from '@/screens/Schedules';
import Timetable from '@/screens/Timetable';
import {theme} from '@/styles/theme';
import {School} from '@/types/api';
import {createStaticNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

export type RootStackParamList = {
  Tab: undefined;
  Intro: undefined;
  SchoolSearch: undefined;
  ClassSelect: {school: School};
  Notifications: undefined;
  Schedules: undefined;
  Meal: undefined;
  Timetable: undefined;
};

const RootStacks = () => {
  const isFirstOpen = useFirstOpen();

  if (isFirstOpen === null) {
    return null;
  }

  const RootStack = createStackNavigator({
    screenOptions: {
      headerShown: false,
      animation: 'slide_from_right',
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
    groups: {
      FirstLaunch: {
        if: () => isFirstOpen,
        navigationKey: 'FirstLaunch',
        screens: {
          Intro: IntroScreen,
          SchoolSearch: SchoolSearchScreen,
          ClassSelect: ClassSelectScreen,
        },
      },
      Tab: {
        navigationKey: 'Tab',
        screens: {
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
          Timetable: {
            screen: Timetable,
            options: {
              headerShown: true,
              title: '시간표',
            },
          },
          Notifications: {
            screen: Notifications,
            options: {
              headerShown: true,
              title: '알림',
            },
          },
        },
      },
    },
  });
  const Stack = createStaticNavigation(RootStack);

  return <Stack />;
};

export default RootStacks;
