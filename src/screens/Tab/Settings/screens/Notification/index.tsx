import dayjs from 'dayjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Text, View} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {Switch} from 'react-native-switch';

import Content from '../../components/Content';
import {addFcmToken, checkFcmToken, editFcmTime, removeFcmToken} from '@/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import {useTheme} from '@/contexts/ThemeContext';
import {useUser} from '@/contexts/UserContext';
import {showToast} from '@/lib/toast';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

const Notification = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [time, setTime] = useState<Date>(dayjs().set('hour', 7).set('minute', 30).toDate());
  const bottomSheetRef = useRef<BottomSheet>(null);

  const {theme, typography} = useTheme();
  const {schoolInfo} = useUser();

  const initializeNotificationSettings = useCallback(async () => {
    const storedState = await AsyncStorage.getItem('isNotiEnabled');
    const storedTime = await AsyncStorage.getItem('notiTime');
    let isEnabledState = false;
    let notificationTime = dayjs().set('hour', 7).set('minute', 30).toDate();

    if (storedState !== null) {
      isEnabledState = JSON.parse(storedState);
    } else {
      const fcmToken = await getFcmToken();
      const check = await checkFcmToken(fcmToken);
      isEnabledState = check;
      await AsyncStorage.setItem('isNotiEnabled', JSON.stringify(check));
    }

    if (storedTime !== null) {
      notificationTime = new Date(JSON.parse(storedTime));
    }

    return {isEnabledState, notificationTime};
  }, []);

  const getFcmToken = async () => {
    const storedToken = await AsyncStorage.getItem('fcmToken');
    if (storedToken) {
      return storedToken;
    }
    await messaging().registerDeviceForRemoteMessages();
    const newToken = await messaging().getToken();
    await AsyncStorage.setItem('fcmToken', newToken);
    return newToken;
  };

  useEffect(() => {
    (async () => {
      try {
        const {isEnabledState, notificationTime} = await initializeNotificationSettings();
        setIsEnabled(isEnabledState);
        setTime(notificationTime);
      } catch (error) {
        console.error('Failed to fetch notification settings:', error);
      }
    })();
  }, [initializeNotificationSettings]);

  const updateTime = useCallback(async () => {
    setIsProcessing(true);
    try {
      const fcmToken = await getFcmToken();
      await editFcmTime(fcmToken, dayjs(time).format('HH:mm'), schoolInfo.neisCode, schoolInfo.neisRegionCode);
      await AsyncStorage.setItem('notiTime', JSON.stringify(time));
      showToast(`매일 ${dayjs(time).format('A hh:mm')}에 알림을 받아요.`);
    } catch (e) {
      const error = e as Error;
      showToast(`알림 시간 변경에 실패했어요:\n${error.message}`);
    }
    setIsProcessing(false);
  }, [time, schoolInfo.neisCode, schoolInfo.neisRegionCode]);

  const handleSubscription = async (subscribe: boolean) => {
    try {
      const fcmToken = await getFcmToken();
      console.log(`[FCM] Token: ${fcmToken}`);

      if (subscribe) {
        const settings = await notifee.requestPermission();
        const batteryOptimization = await notifee.isBatteryOptimizationEnabled();

        if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
          showToast('알림 권한을 허용해주세요.');
          return false;
        }
        if (batteryOptimization) {
          Alert.alert(
            '배터리 최적화 기능이 활성화 되어있어요.',
            '백그라운드 상태에서 알림을 받기 위해 배터리 최적화 기능을 비활성화 해주세요.',
            [
              {
                text: '설정 열기',
                onPress: async () => await notifee.openBatteryOptimizationSettings(),
              },
              {
                text: '취소',
                onPress: () => {
                  showToast('알림 설정에 실패했어요.');
                },
                style: 'cancel',
              },
            ],
            {cancelable: false},
          );
          return false;
        }

        const check = await checkFcmToken(fcmToken);
        if (check) {
          showToast('이미 알림이 설정되어 있어요.');
          return false;
        }
        await addFcmToken(fcmToken, dayjs(time).format('HH:mm'), schoolInfo.neisCode, schoolInfo.neisRegionCode);
        showToast(`매일 ${dayjs(time).format('A hh:mm')}에 급식 알림을 받아요.`);
      } else {
        await removeFcmToken(fcmToken);
        showToast('매일 아침 급식 알림이 해제되었어요.');
      }
      await AsyncStorage.setItem('isNotiEnabled', JSON.stringify(subscribe));
      return true;
    } catch (e) {
      const error = e as Error;
      showToast(`알림 설정에 실패했어요:\n${error.message}`);
      return false;
    }
  };

  const toggleSwitch = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    setIsProcessing(true);
    const success = await handleSubscription(newState);
    if (!success) {
      setIsEnabled(!newState);
    } else {
      await AsyncStorage.setItem('isNotiEnabled', JSON.stringify(newState));
    }
    setIsProcessing(false);
  };

  const openBottomSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(0);
    }
  };

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} pressBehavior="close" disappearsOnIndex={-1} />, []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        updateTime();
      }
    },
    [updateTime],
  );

  return (
    <>
      <Container scrollView bounce style={{gap: 8}}>
        <Card title="급식 알림" titleStyle={{fontSize: typography.body.fontSize}}>
          <View style={{gap: 8, marginTop: 8}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={[typography.body, {color: theme.primaryText}]}>알림 받기</Text>
              <Switch
                value={isEnabled}
                onValueChange={toggleSwitch}
                disabled={isProcessing}
                circleSize={22}
                barHeight={22}
                circleBorderWidth={2}
                circleBorderActiveColor={theme.highlight}
                circleBorderInactiveColor={theme.border}
                backgroundActive={theme.highlight}
                backgroundInactive={theme.border}
                changeValueImmediately={true}
                renderActiveText={false}
                renderInActiveText={false}
                switchBorderRadius={20}
              />
            </View>
            <Content title="알림 시간 변경" arrow onPress={openBottomSheet} disabled={!isEnabled} arrowText={dayjs(time).format('A hh:mm')} />
          </View>
        </Card>
      </Container>

      <BottomSheet backdropComponent={renderBackdrop} ref={bottomSheetRef} index={-1} enablePanDownToClose onChange={handleSheetChanges} backgroundStyle={{backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}} handleIndicatorStyle={{backgroundColor: theme.secondaryText}}>
        <BottomSheetView style={{padding: 18, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '600', alignSelf: 'flex-start'}]}>알림 시간 변경</Text>
          <DatePicker mode="time" date={time} theme="dark" dividerColor={theme.secondaryText} onDateChange={setTime} />
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

export default Notification;
