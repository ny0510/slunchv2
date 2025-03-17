import dayjs from 'dayjs';
import React, {useCallback, useRef, useState} from 'react';
import {Alert, Text, View} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {Switch} from 'react-native-switch';

import Content from '../../components/Content';
import Card from '@/components/Card';
import Container from '@/components/Container';
import {showToast} from '@/lib/toast';
import {theme} from '@/styles/theme';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

const Notification = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [time, setTime] = useState<Date>(new Date());
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSubscription = async (subscribe: boolean) => {
    const fcmToken = await messaging().getToken();
    try {
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
        // 서버에 fcmToken을 보내서 구독
        showToast('매일 아침 급식 알림이 설정되었어요.');
      } else {
        // 서버에 fcmToken을 보내서 구독 해지
        showToast('매일 아침 급식 알림이 해제되었어요.');
      }
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
    }
    setIsProcessing(false);
  };

  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} pressBehavior="close" disappearsOnIndex={-1} />, []);

  return (
    <>
      <Container scrollView bounce style={{gap: 8}}>
        <Card title="매일 아침 급식 알림" titleStyle={{fontSize: theme.typography.body.fontSize}}>
          <View style={{gap: 8, marginTop: 8}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={theme.typography.body}>알림 받기</Text>
              <Switch
                value={isEnabled}
                onValueChange={toggleSwitch}
                disabled={isProcessing}
                circleSize={22}
                barHeight={22}
                circleBorderWidth={2}
                circleBorderActiveColor={theme.colors.highlight}
                circleBorderInactiveColor={theme.colors.border}
                backgroundActive={theme.colors.highlight}
                backgroundInactive={theme.colors.border}
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
      <BottomSheet backdropComponent={renderBackdrop} ref={bottomSheetRef} index={-1} enablePanDownToClose backgroundStyle={{backgroundColor: theme.colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}} handleIndicatorStyle={{backgroundColor: theme.colors.secondaryText}}>
        <BottomSheetView style={{padding: 18, backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={[theme.typography.subtitle, {fontFamily: theme.fontWeights.semiBold, alignSelf: 'flex-start'}]}>알림 시간 변경</Text>
          <DatePicker mode="time" date={time} theme="dark" dividerColor={theme.colors.secondaryText} onDateChange={setTime} />
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

export default Notification;
