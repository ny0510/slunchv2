/* eslint-disable react/no-unstable-nested-components */
import dayjs from 'dayjs';
import React, {useCallback, useEffect, useState} from 'react';
import {Easing, GestureResponderEvent, TouchableOpacity} from 'react-native';

import {getNotifications} from '@/api';
import TouchableScale from '@/components/TouchableScale';
import Home from '@/screens/Tab/Home';
import Notifications from '@/screens/Tab/Notifications';
import SchoolCard from '@/screens/Tab/SchoolCard';
import Settings from '@/screens/Tab/Settings';
import {theme} from '@/styles/theme';
import {Notification} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

const BottomTab = createBottomTabNavigator();

const BottomTabs = () => {
  const [isSunrin, setIsSunrin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    const notifications = await getNotifications();
    const storedReadNotifications = await AsyncStorage.getItem('readNotifications');
    const readNotifications = storedReadNotifications ? JSON.parse(storedReadNotifications) : [];
    const firstOpenDate = await fetchFirstOpenDate();
    const readNotificationsBeforeFirstOpen = notifications.filter(notification => firstOpenDate && dayjs(notification.date).isBefore(firstOpenDate)).map(notification => notification.id);
    const allReadNotifications = [...new Set([...readNotifications, ...readNotificationsBeforeFirstOpen])];
    const unreadNotifications = notifications.filter((notification: Notification) => !allReadNotifications.includes(notification.id));
    setUnreadCount(unreadNotifications.length);
    return unreadNotifications.length;
  }, []);

  const fetchFirstOpenDate = async () => {
    try {
      const storedFirstOpenDate = await AsyncStorage.getItem('firstOpenDate');
      return storedFirstOpenDate ? dayjs(storedFirstOpenDate) : null;
    } catch (e) {
      console.error('Error fetching first open date:', e);
      return null;
    }
  };

  useEffect(() => {
    const checkSunrin = async () => {
      const school = JSON.parse((await AsyncStorage.getItem('school')) || '{}');
      setIsSunrin(school.schoolName === '선린인터넷고');
      setLoading(false);
    };

    checkSunrin();
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  if (loading) {
    return null;
  }

  return (
    <BottomTab.Navigator
      initialRouteName="Home"
      backBehavior="firstRoute"
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
      <BottomTab.Screen
        name="Notifications"
        options={{
          title: '알림',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            fontSize: 12,
            fontFamily: theme.fontWeights.medium,
          },
        }}>
        {() => <Notifications onReadNotification={fetchUnreadCount} />}
      </BottomTab.Screen>
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
    case 'Notifications':
      return <FontAwesome6 name="bell" iconStyle="solid" size={size} color={color} />;
    case 'Settings':
      return <FontAwesome6 name="gear" iconStyle="solid" size={size} color={color} />;
    default:
      return null;
  }
};

export default BottomTabs;
