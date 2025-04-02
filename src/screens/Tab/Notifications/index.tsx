import dayjs from 'dayjs';
import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Easing, RefreshControl, Text, TouchableOpacity, View} from 'react-native';

import {getNotifications} from '@/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import TouchableScale from '@/components/TouchableScale';
import {showToast} from '@/lib/toast';
import {theme} from '@/styles/theme';
import {Notification} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
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

  const fetchData = useCallback(async () => {
    try {
      const notifications = await getNotifications();
      setNoti(notifications);
      await fetchReadNotifications();
      onReadNotification();
    } catch (e) {
      const err = e as Error;

      showToast('알림을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Error fetching data:', err);
    }
  }, [onReadNotification]);

  useEffect(() => {
    analytics().logScreenView({screen_name: '알림 페이지', screen_class: 'Notifications'});
  }, []);

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
      style={{height: '100%'}}
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
        {noti?.length > 0 ? (
          noti.map((item, index) => {
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
          })
        ) : (
          <View style={{alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%'}}>
            <Text style={{color: theme.colors.primaryText, fontFamily: theme.fontWeights.light, fontSize: 16}}>알림이 없습니다.</Text>
          </View>
        )}
      </View>
    </Container>
  );
};

export default Notifications;
