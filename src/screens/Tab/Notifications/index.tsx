import {ANDROID_MEAL_NATIVE_AD_UNIT_ID, ANDROID_NOTI_BANNER_AD_UNIT_ID, IOS_NOTI_BANNER_AD_UNIT_ID, IOS_NOTI_NATIVE_AD_UNIT_ID} from '@env';
import dayjs from 'dayjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useScrollToTop} from '@/hooks/useScrollToTop';
import {Platform, RefreshControl, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import TouchableScale from 'react-native-touchable-scale';

import Ad from './components/Ad';
import {getNotifications} from '@/api';
import BannerAdCard from '@/components/BannerAdCard';
import Card from '@/components/Card';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
import {useTheme} from '@/contexts/ThemeContext';
import {showToast} from '@/lib/toast';
import {typography} from '@/theme';
import {Notification} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Notifications = ({onReadNotification, setScrollRef}: {onReadNotification: () => void; setScrollRef?: (ref: any) => void}) => {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);
  const [noti, setNoti] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const {theme} = useTheme();
  const scrollViewRef = useRef<any>(null);

  // Use the scroll-to-top hook
  useScrollToTop(scrollViewRef, setScrollRef);

  // Close expanded notifications when returning to this tab
  useFocusEffect(
    useCallback(() => {
      return () => {
        // This cleanup function runs when the screen loses focus
        setExpandedIndices([]);
      };
    }, [])
  );

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
    setLoading(true);
    try {
      const notifications = await getNotifications();
      setNoti(notifications);
      await fetchReadNotifications();
      onReadNotification();
    } catch (e) {
      const err = e as Error;

      showToast('알림을 불러오는 중 오류가 발생했어요.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
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

  return loading ? (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Loading fullScreen />
    </View>
  ) : (
    <Container
      scrollView
      bounce
      scrollViewRef={scrollViewRef}
      style={{paddingHorizontal: 0}}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchData().then(() => setRefreshing(false));
          }}
          tintColor={theme.secondaryText}
        />
      }>
      {/* <Ad adUnitId={Platform.OS === 'ios' ? IOS_NOTI_NATIVE_AD_UNIT_ID : ANDROID_MEAL_NATIVE_AD_UNIT_ID} /> */}

      <View style={{gap: 4, width: '100%', paddingHorizontal: 16}}>
        <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_NOTI_BANNER_AD_UNIT_ID : ANDROID_NOTI_BANNER_AD_UNIT_ID} />
        <View style={{height: 12}} />

        {noti?.length > 0 ? (
          noti.map((item, index) => {
            const date = dayjs(item.date).format('MM월 DD일');
            const isNew = !readNotifications.includes(item.id);
            const icon = <FontAwesome6 name="bullhorn" size={16} color={theme.primaryText} iconStyle="solid" />;

            return (
              <TouchableScale key={index} onPress={() => handlePress(index, item.id)} activeScale={0.98} tension={10} friction={3}>
                <View
                  style={{
                    marginBottom: index === noti.length - 1 ? 0 : 12,
                  }}>
                  <Card title={item.title} notificationDot={isNew} subtitle={date} arrow={!expandedIndices.includes(index)} style={{backgroundColor: theme.card}}>
                    {expandedIndices.includes(index) && (
                      <View style={{marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border}}>
                        <Text
                          style={[
                            typography.body,
                            {
                              color: theme.primaryText,
                              fontWeight: '400',
                              lineHeight: 22,
                            },
                          ]}>
                          {item.content}
                        </Text>
                        {isNew && (
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8}}>
                            <FontAwesome6 name="check" size={12} color={theme.secondaryText} iconStyle="solid" />
                            <Text style={[typography.caption, {color: theme.secondaryText}]}>읽음 처리됨</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </Card>
                </View>
              </TouchableScale>
            );
          })
        ) : (
          <View style={{justifyContent: 'center', alignItems: 'center', flex: 1, marginTop: 80}}>
            <FontAwesome6 name="bell-slash" size={48} color={theme.secondaryText} iconStyle="regular" />
            <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '600', marginTop: 16}]}>표시할 알림이 없어요</Text>
            <Text style={[typography.body, {color: theme.secondaryText, marginTop: 4}]}>새 알림이 오면 여기에 표시됩니다</Text>
          </View>
        )}
      </View>
    </Container>
  );
};

export default Notifications;
