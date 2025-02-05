import React from 'react';
import {GestureResponderEvent, TouchableOpacity} from 'react-native';

import Home from '@/screens/Home';
import SchoolCard from '@/screens/SchoolCard';
import Settings from '@/screens/Settings';
import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

const BottomTabs = createBottomTabNavigator({
  initialRouteName: 'Home',
  backBehavior: 'initialRoute',
  screenOptions: ({route}: {route: {name: string}}) => ({
    headerShown: false,
    animation: 'shift',
    freezeOnBlur: true,
    sceneStyle: {backgroundColor: theme.colors.background},
    tabBarStyle: {
      backgroundColor: theme.colors.background,
      borderTopColor: theme.colors.border,
      paddingBottom: 0,
      height: 60,

      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderColor: theme.colors.border,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
    },
    tabBarActiveTintColor: theme.colors.primaryText,
    tabBarInactiveTintColor: '#8E8E93',
    tabBarAccessibilityLabel: 'Tab',
    tabBarLabelStyle: {
      fontSize: 12,
      fontFamily: theme.fontWeights.medium,
      lineHeight: 15,
    },
    tabBarButton: props => <TabBarButton children={props.children} onPress={props.onPress} />,
    tabBarIcon: props => <TabBarIcon route={route} size={20} color={props.color} />,
  }),
  screens: {
    Home: {
      screen: Home,
      options: {
        title: '홈',
      },
    },
    SchoolCard: {
      screen: SchoolCard,
      options: {
        title: '학생증',
      },
    },
    Settings: {
      screen: Settings,
      options: {
        title: '설정',
      },
    },
  },
});

const TabBarButton = ({children, onPress}: {children: React.ReactNode; onPress: ((event: GestureResponderEvent) => void) | undefined}) => {
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      {children}
    </TouchableOpacity>
  );
};

const TabBarIcon = ({route, size, color}: {route: {name: string}; size: number; color: string}) => {
  switch (route.name) {
    case 'Home':
      return <FontAwesome6 name="house" iconStyle="solid" size={size} color={color} />;
    case 'SchoolCard':
      return <FontAwesome6 name="id-card" iconStyle="solid" size={size} color={color} />;
    case 'Settings':
      return <FontAwesome6 name="gear" iconStyle="solid" size={size} color={color} />;
    default:
      return null;
  }
};

export default BottomTabs;
