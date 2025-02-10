/* eslint-disable react/no-unstable-nested-components */
import React, {useState} from 'react';
import {Easing, GestureResponderEvent, TouchableOpacity} from 'react-native';

import TouchableScale from '@/components/TouchableScale';
import Community from '@/screens/Tab/Community';
import Home from '@/screens/Tab/Home';
import SchoolCard from '@/screens/Tab/SchoolCard';
import Settings from '@/screens/Tab/Settings';
import {theme} from '@/styles/theme';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

const BottomTab = createBottomTabNavigator();

const BottomTabs = () => {
  const [isSunrin, setIsSunrin] = useState(false);

  return (
    <BottomTab.Navigator
      initialRouteName="Home"
      backBehavior="initialRoute"
      screenOptions={({route}) => ({
        headerShown: false,
        animation: 'shift',
        freezeOnBlur: true,
        sceneStyle: {backgroundColor: theme.colors.background},
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingBottom: 0,
          height: 60,
          // borderTopLeftRadius: 24,
          // borderTopRightRadius: 24,
          borderColor: theme.colors.border,
          borderTopWidth: 1,
          // borderLeftWidth: 1,
          // borderRightWidth: 1,
        },
        tabBarActiveTintColor: theme.colors.primaryText,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: theme.fontWeights.medium,
          lineHeight: 15,
        },
        tabBarButton: props => (props.onPress ? <TabBarButton children={props.children} onPress={event => props.onPress && props.onPress(event!)} /> : null),
        tabBarIcon: props => <TabBarIcon route={route} size={20} color={props.color} />,
      })}>
      <BottomTab.Screen name="Home" component={Home} options={{title: '홈'}} />
      {isSunrin && <BottomTab.Screen name="SchoolCard" component={SchoolCard} options={{title: '학생증'}} />}
      <BottomTab.Screen name="Community" component={Community} options={{title: '커뮤니티'}} />
      <BottomTab.Screen name="Settings" component={Settings} options={{title: '설정'}} />
    </BottomTab.Navigator>
  );
};

const TabBarButton = ({children, onPress}: {children: React.ReactNode; onPress: (event?: GestureResponderEvent) => void}) => {
  return (
    <TouchableScale pressInEasing={Easing.elastic(1.5)} pressOutEasing={Easing.elastic(1.5)} pressInDuration={150} pressOutDuration={150} scaleTo={0.9} onPress={onPress} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <TouchableOpacity style={{justifyContent: 'center', alignItems: 'center'}}>{children}</TouchableOpacity>
    </TouchableScale>
  );
};

const TabBarIcon = ({route, size, color}: {route: {name: string}; size: number; color: string}) => {
  switch (route.name) {
    case 'Home':
      return <FontAwesome6 name="house" iconStyle="solid" size={size} color={color} />;
    case 'SchoolCard':
      return <FontAwesome6 name="id-card" iconStyle="solid" size={size} color={color} />;
    case 'Community':
      return <FontAwesome6 name="users" iconStyle="solid" size={size} color={color} />;
    case 'Settings':
      return <FontAwesome6 name="gear" iconStyle="solid" size={size} color={color} />;
    default:
      return null;
  }
};

export default BottomTabs;
