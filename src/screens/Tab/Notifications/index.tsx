import dayjs from 'dayjs';
import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Easing, RefreshControl, Text, TouchableOpacity, View} from 'react-native';

import {getNotifications} from '@/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import TouchableScale from '@/components/TouchableScale';
import {theme} from '@/styles/theme';
import {Notification} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Notifications = ({onReadNotification}: {onReadNotification: () => void}) => {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);
  const [noti, setNoti] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);

  const fetchReadNotifications = async () => {
    try {
      const storedReadNotifications = await AsyncStorage.getItem('readNotifications');
      if (storedReadNotifications) {
        setReadNotifications(JSON.parse(storedReadNotifications));
      }
    } catch (e) {
      console.error('Error fetching read notifications:', e);
    }
  };

  const fetchFirstOpenDate = async () => {
    try {
      const storedFirstOpenDate = await AsyncStorage.getItem('firstOpenDate');
      return storedFirstOpenDate ? dayjs(storedFirstOpenDate) : null;
    } catch (e) {
      console.error('Error fetching first open date:', e);
      return null;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const notifications = await getNotifications();
      const firstOpenDate = await fetchFirstOpenDate();
      const readNotificationsBeforeFirstOpen = notifications.filter(notification => firstOpenDate && dayjs(notification.date).isBefore(firstOpenDate)).map(notification => notification.id);

      setNoti(notifications);
      await fetchReadNotifications();
      setReadNotifications(prevReadNotifications => [...new Set([...prevReadNotifications, ...readNotificationsBeforeFirstOpen])]);
      await AsyncStorage.setItem('readNotifications', JSON.stringify([...new Set([...readNotifications, ...readNotificationsBeforeFirstOpen])]));
      onReadNotification();
    } catch (e) {
      const err = e as Error;
      Alert.alert('데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.', '오류 메시지: ' + err.message);
      console.error('Error fetching data:', err);
    }
  }, [onReadNotification, readNotifications]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePress = async (index: number, id: string) => {
    setExpandedIndices(prevIndices => (prevIndices.includes(index) ? prevIndices.filter(i => i !== index) : [...prevIndices, index]));
    if (!readNotifications.includes(id)) {
      const updatedReadNotifications = [...readNotifications, id];
      setReadNotifications(updatedReadNotifications);
      await AsyncStorage.setItem('readNotifications', JSON.stringify(updatedReadNotifications));
      onReadNotification();
    }
  };

  return (
    <Container
      scrollView
      bounce
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchData().then(() => setRefreshing(false));
          }}
        />
      }>
      <View style={{gap: 16, width: '100%'}}>
        {noti.map((item, index) => {
          const date = dayjs(item.date).format('MM월 DD일');
          const isNew = !readNotifications.includes(item.id);
          const icon = <FontAwesome6 name="bullhorn" size={16} color={theme.colors.primaryText} iconStyle="solid" />;

          return (
            <TouchableScale key={index} pressInEasing={Easing.elastic(0.5)} pressOutEasing={Easing.elastic(0.5)} pressInDuration={200} pressOutDuration={200} scaleTo={0.98} onPress={() => handlePress(index, item.id)}>
              <TouchableOpacity>
                <Card title={item.title} titleIcon={icon} subtitle={date} arrow notificationDot={isNew}>
                  {expandedIndices.includes(index) && (
                    <Text
                      style={{
                        color: theme.colors.primaryText,
                        fontFamily: theme.fontWeights.regular,
                        fontSize: 16,
                        lineHeight: 24,
                      }}>
                      {item.content}
                    </Text>
                  )}
                </Card>
              </TouchableOpacity>
            </TouchableScale>
          );
        })}
      </View>
    </Container>
  );
};

export default Notifications;
