import dayjs from 'dayjs';
import React, {useCallback, useRef, useState} from 'react';
import {Alert, Text, View} from 'react-native';
import DatePicker from 'react-native-date-picker';

import Content from '../../components/Content';
import {addMealNotification, addTimetableNotification, checkMealNotification, editMealNotification, editTimetableTime, removeMealNotification, removeTimetableNotification} from '@/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import ToggleSwitch from '@/components/ToggleSwitch';
import {useTheme} from '@/contexts/ThemeContext';
import {useUser} from '@/contexts/UserContext';
import {showToast} from '@/lib/toast';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {useFocusEffect} from '@react-navigation/native';

const Notification = () => {
  // 급식 알림 상태
  const [isEnabled, setIsEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [time, setTime] = useState<Date>(dayjs().set('hour', 7).set('minute', 30).toDate());

  // 시간표 알림 상태
  const [isTimetableEnabled, setIsTimetableEnabled] = useState(false);
  const [isTimetableProcessing, setIsTimetableProcessing] = useState(false);
  const [timetableTime, setTimetableTime] = useState<Date>(dayjs().set('hour', 7).set('minute', 0).toDate());

  // Bottom Sheet 상태
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isTimetableBottomSheetOpen, setIsTimetableBottomSheetOpen] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const timetableBottomSheetRef = useRef<BottomSheet>(null);

  const {theme, typography} = useTheme();
  const {schoolInfo, classInfo} = useUser();

  const initializeNotificationSettings = useCallback(async () => {
    const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');

    // 급식 알림 설정
    let isEnabledState = settings.mealNotification?.enabled || false;
    let notificationTime = settings.mealNotification?.time ? new Date(settings.mealNotification.time) : dayjs().set('hour', 7).set('minute', 30).toDate();

    // 시간표 알림 설정
    let isTimetableEnabledState = settings.timetableNotification?.enabled || false;
    let timetableNotificationTime = settings.timetableNotification?.time ? new Date(settings.timetableNotification.time) : dayjs().set('hour', 7).set('minute', 0).toDate();

    // 초기화 시 실제 서버 상태 확인
    if (!settings.mealNotification) {
      const fcmToken = await getFcmToken();
      const check = await checkMealNotification(fcmToken);
      isEnabledState = check;

      const newSettings = {
        ...settings,
        mealNotification: {
          enabled: check,
          time: notificationTime,
        },
      };
      await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
    }

    return {isEnabledState, notificationTime, isTimetableEnabledState, timetableNotificationTime};
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

  // 화면이 포커스될 때마다 설정 다시 로드 (학교 변경 등의 경우를 위해)
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const {isEnabledState, notificationTime, isTimetableEnabledState, timetableNotificationTime} = await initializeNotificationSettings();
          setIsEnabled(isEnabledState);
          setTime(notificationTime);
          setIsTimetableEnabled(isTimetableEnabledState);
          setTimetableTime(timetableNotificationTime);
        } catch (error) {
          console.error('Failed to fetch notification settings:', error);
        }
      })();
    }, [initializeNotificationSettings]),
  );

  const updateMealTime = useCallback(async () => {
    setIsProcessing(true);
    try {
      const fcmToken = await getFcmToken();
      await editMealNotification(fcmToken, dayjs(time).format('HH:mm'), schoolInfo.neisCode, schoolInfo.neisRegionCode);

      // settings 객체에 저장
      const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
      settings.mealNotification = {
        ...settings.mealNotification,
        enabled: isEnabled,
        time: time,
      };
      await AsyncStorage.setItem('settings', JSON.stringify(settings));

      showToast(`매일 ${dayjs(time).format('A hh:mm')}에 알림을 받아요.`);
    } catch (e) {
      const error = e as Error;
      showToast(`알림 시간 변경에 실패했어요:\n${error.message}`);
    }
    setIsProcessing(false);
  }, [time, isEnabled, schoolInfo.neisCode, schoolInfo.neisRegionCode]);

  // 알림 권한 체크 공통 함수
  const checkNotificationPermissions = async () => {
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

    return true;
  };

  // 급식 알림 구독 처리
  const handleMealSubscription = async (subscribe: boolean) => {
    try {
      const fcmToken = await getFcmToken();
      console.log(`[FCM] Token: ${fcmToken}`);

      if (subscribe) {
        // 권한 체크 (공통 함수 사용)
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) return false;

        await addMealNotification(fcmToken, dayjs(time).format('HH:mm'), schoolInfo.neisCode, schoolInfo.neisRegionCode);
        showToast(`매일 ${dayjs(time).format('A hh:mm')}에 급식 알림을 받아요.`);
      } else {
        await removeMealNotification(fcmToken);
        showToast('급식 알림이 해제되었어요.');
      }

      // settings 객체에 저장
      const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
      settings.mealNotification = {
        enabled: subscribe,
        time: time,
      };
      await AsyncStorage.setItem('settings', JSON.stringify(settings));

      return true;
    } catch (e) {
      const error = e as Error;
      showToast(`알림 설정에 실패했어요:\n${error.message}`);
      return false;
    }
  };

  // 시간표 알림 구독 처리 (FCM 방식)
  const handleTimetableSubscription = async (subscribe: boolean) => {
    try {
      const fcmToken = await getFcmToken();
      console.log(`[FCM] Token: ${fcmToken}`);

      if (subscribe) {
        // 권한 체크 (공통 함수 사용)
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) return false;

        // FCM 토큰으로 시간표 알림 등록
        await addTimetableNotification(fcmToken, dayjs(timetableTime).format('HH:mm'), schoolInfo.comciganCode, classInfo.grade, classInfo.class);
        showToast(`매일 ${dayjs(timetableTime).format('A hh:mm')}에 시간표 알림을 받아요.`);
      } else {
        // 시간표 알림 해제
        await removeTimetableNotification(fcmToken);
        showToast('시간표 알림이 해제되었어요.');
      }

      // settings 객체에 저장
      const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
      settings.timetableNotification = {
        enabled: subscribe,
        time: timetableTime,
      };
      await AsyncStorage.setItem('settings', JSON.stringify(settings));

      return true;
    } catch (e) {
      const error = e as Error;
      showToast(`시간표 알림 설정에 실패했어요:\n${error.message}`);
      return false;
    }
  };

  const toggleMealSwitch = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    setIsProcessing(true);
    const success = await handleMealSubscription(newState);
    if (!success) {
      setIsEnabled(!newState);
    }
    setIsProcessing(false);
  };

  // 시간표 알림 토글 핸들러
  const toggleTimetableSwitch = async () => {
    const newState = !isTimetableEnabled;
    setIsTimetableEnabled(newState);
    setIsTimetableProcessing(true);

    const success = await handleTimetableSubscription(newState);
    if (!success) {
      setIsTimetableEnabled(!newState);
    }

    setIsTimetableProcessing(false);
  };

  // 시간표 알림 시간 업데이트 (FCM 방식)
  const updateTimetableTime = useCallback(async () => {
    setIsTimetableProcessing(true);
    try {
      // 알림이 활성화되어 있으면 새 시간으로 업데이트
      if (isTimetableEnabled) {
        const fcmToken = await getFcmToken();
        await editTimetableTime(fcmToken, dayjs(timetableTime).format('HH:mm'), schoolInfo.comciganCode, classInfo.grade, classInfo.class);
      }

      const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
      settings.timetableNotification = {
        enabled: isTimetableEnabled,
        time: timetableTime,
      };
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
      showToast(`매일 ${dayjs(timetableTime).format('A hh:mm')}에 시간표 알림을 받아요.`);
    } catch (error) {
      console.error('Error updating timetable time:', error);
      showToast('시간표 알림 시간 변경에 실패했어요.');
    }
    setIsTimetableProcessing(false);
  }, [timetableTime, isTimetableEnabled, schoolInfo, classInfo]);

  const openBottomSheet = () => {
    setIsBottomSheetOpen(true);
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(0);
    }, 100);
  };

  const openTimetableBottomSheet = () => {
    setIsTimetableBottomSheetOpen(true);
    setTimeout(() => {
      timetableBottomSheetRef.current?.snapToIndex(0);
    }, 100);
  };

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} pressBehavior="close" disappearsOnIndex={-1} />, []);

  const handleMealSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        updateMealTime();
      }
    },
    [updateMealTime],
  );

  const handleTimetableSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        updateTimetableTime();
      }
    },
    [updateTimetableTime],
  );

  return (
    <>
      <Container scrollView bounce style={{gap: 8}}>
        <Card title="급식 알림" titleStyle={{fontSize: typography.body.fontSize}}>
          <View style={{gap: 8, marginTop: 8}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={[typography.body, {color: theme.primaryText}]}>알림 받기</Text>
              <ToggleSwitch value={isEnabled} onValueChange={toggleMealSwitch} disabled={isProcessing} />
            </View>
            <Content title="알림 시간 변경" arrow onPress={openBottomSheet} disabled={!isEnabled} arrowText={dayjs(time).format('A hh:mm')} />
          </View>
        </Card>

        <Card title="시간표 알림" titleStyle={{fontSize: typography.body.fontSize}}>
          <View style={{gap: 8, marginTop: 8}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={[typography.body, {color: theme.primaryText}]}>알림 받기</Text>
              <ToggleSwitch value={isTimetableEnabled} onValueChange={toggleTimetableSwitch} disabled={isTimetableProcessing} />
            </View>
            <Content title="알림 시간 변경" arrow onPress={openTimetableBottomSheet} disabled={!isTimetableEnabled} arrowText={dayjs(timetableTime).format('A hh:mm')} />
          </View>
        </Card>
      </Container>

      {isBottomSheetOpen && (
        <BottomSheet
          backdropComponent={renderBackdrop}
          ref={bottomSheetRef}
          index={-1}
          enablePanDownToClose
          onChange={handleMealSheetChanges}
          onClose={() => setIsBottomSheetOpen(false)}
          backgroundStyle={{backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}}
          handleIndicatorStyle={{backgroundColor: theme.secondaryText}}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore">
          <BottomSheetView style={{paddingHorizontal: 18, paddingBottom: 12, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center'}}>
            <View style={{gap: 4, width: '100%'}}>
              <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '600', alignSelf: 'flex-start'}]}>알림 시간 변경</Text>
              <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300', alignSelf: 'flex-start'}]}>원하는 시간으로 설정해보세요.</Text>
            </View>
            <DatePicker mode="time" date={time} theme="dark" dividerColor={theme.secondaryText} onDateChange={setTime} />
          </BottomSheetView>
        </BottomSheet>
      )}

      {isTimetableBottomSheetOpen && (
        <BottomSheet
          backdropComponent={renderBackdrop}
          ref={timetableBottomSheetRef}
          index={-1}
          enablePanDownToClose
          onChange={handleTimetableSheetChanges}
          onClose={() => setIsTimetableBottomSheetOpen(false)}
          backgroundStyle={{backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}}
          handleIndicatorStyle={{backgroundColor: theme.secondaryText}}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore">
          <BottomSheetView style={{paddingHorizontal: 18, paddingBottom: 12, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center'}}>
            <View style={{gap: 4, width: '100%'}}>
              <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '600', alignSelf: 'flex-start'}]}>시간표 알림 시간</Text>
              <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300', alignSelf: 'flex-start'}]}>매일 아침 시간표를 받고 싶은 시간을 설정해보세요.</Text>
            </View>
            <DatePicker mode="time" date={timetableTime} theme="dark" dividerColor={theme.secondaryText} onDateChange={setTimetableTime} />
          </BottomSheetView>
        </BottomSheet>
      )}
    </>
  );
};

export default Notification;
