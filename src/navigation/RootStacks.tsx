import React from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import {useFirstOpen} from '@/hooks/useFirstOpen';
import BottomTabs from '@/navigation/BotomTabs';
import {ClassSelectScreen, IntroScreen, SchoolSearchScreen} from '@/screens/Onboarding';
import {theme} from '@/styles/theme';
import {School} from '@/types/api';
import {createStaticNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

export type RootStackParamList = {
  Tab: undefined;
  Intro: undefined;
  SchoolSearch: undefined;
  ClassSelect: {school: School};
};

const RootStacks = () => {
  const {isFirstOpen, isLoading} = useFirstOpen();

  if (isLoading) {
    return null;
  }

  const RootStack = createStackNavigator({
    screenOptions: {
      headerShown: false,
      cardStyle: {backgroundColor: theme.colors.background},
      animation: 'slide_from_right',
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
        screens: {
          Tab: BottomTabs,
        },
      },
    },
  });
  const Stack = createStaticNavigation(RootStack);

  return <Stack />;
};

export default RootStacks;
