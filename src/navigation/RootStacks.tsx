import React from 'react';

import {useFirstOpen} from '@/hooks/useFirstOpen';
import BottomTabs from '@/navigation/BottomTabs';
import Announcement from '@/screens/Announcement';
import Meal from '@/screens/Meal';
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
  Announcement: undefined;
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
          Announcement: Announcement,
          Schedules: Schedules,
          Meal: Meal,
          Timetable: Timetable,
        },
      },
    },
  });
  const Stack = createStaticNavigation(RootStack);

  return <Stack />;
};

export default RootStacks;
