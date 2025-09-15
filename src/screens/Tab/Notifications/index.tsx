import {ANDROID_MEAL_NATIVE_AD_UNIT_ID, IOS_NOTI_NATIVE_AD_UNIT_ID} from '@env';
import dayjs from 'dayjs';
import React, {useCallback, useEffect, useState} from 'react';
import {Platform, RefreshControl, Text, TouchableOpacity, View} from 'react-native';
import TouchableScale from 'react-native-touchable-scale';

import Ad from './components/Ad';
import {getNotifications} from '@/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';
import {useTheme} from '@/contexts/ThemeContext';
import {showToast} from '@/lib/toast';
import {typography} from '@/theme';
import {Notification} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Notifications = ({onReadNotification}: {onReadNotification: () => void}) => {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);
  const [noti, setNoti] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const {theme} = useTheme();

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
        {/* <BannerAdCard adUnitId={Platform.OS === 'ios' ? IOS_NOTI_BANNER_AD_UNIT_ID : ANDROID_NOTI_BANNER_AD_UNIT_ID} /> */}

        {/* {noti?.length > 0 && readNotifications.length < noti.length && (
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: theme.highlight}} />
              <Text style={[typography.caption, {color: theme.secondaryText}]}>새 알림 {noti.length - readNotifications.length}개</Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                const allIds = noti.map(n => n.id);
                setReadNotifications(allIds);
                await AsyncStorage.setItem('readNotifications', JSON.stringify(allIds));
                onReadNotification();
              }}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                backgroundColor: theme.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              accessibilityLabel="모든 알림 읽음 처리">
              <Text style={[typography.caption, {color: theme.primaryText, fontWeight: '600'}]}>모두 읽음</Text>
            </TouchableOpacity>
          </View>
        )} */}

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
                  <Card title={item.title} titleIcon={isNew && icon} subtitle={date} arrow={!expandedIndices.includes(index)} style={{backgroundColor: theme.card}}>
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
          <EmptyState icon="bell" title="알림이 없습니다" subtitle="새로운 소식이 있으면 알려드릴게요" style={{marginTop: 48}} />
        )}
      </View>
    </Container>
  );
};

export default Notifications;
