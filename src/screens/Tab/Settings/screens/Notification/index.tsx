import dayjs from 'dayjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Keyboard, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import DatePicker from 'react-native-date-picker';

import Content from '../../components/Content';
import {addKeywordNotification, addMealNotification, addTimetableNotification, checkMealNotification, editKeywordNotification, editMealNotification, editTimetableTime, removeKeywordNotification, removeMealNotification, removeTimetableNotification} from '@/api';
import Card from '@/components/Card';
import Container from '@/components/Container';
import ToggleSwitch from '@/components/ToggleSwitch';
import {useTheme} from '@/contexts/ThemeContext';
import {useUser} from '@/contexts/UserContext';
import {showToast} from '@/lib/toast';
import BottomSheet, {BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView} from '@gorhom/bottom-sheet';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {useFocusEffect} from '@react-navigation/native';

const Notification = () => {
  // 급식 알림 상태
  const [isMealEnabled, setIsMealEnabled] = useState(false);
  const [isMealProcessing, setIsMealProcessing] = useState(false);
  const [mealTime, setMealTime] = useState<Date>(dayjs().set('hour', 7).set('minute', 30).toDate());

  // 키워드 알림 상태
  const [isKeywordEnabled, setIsKeywordEnabled] = useState(false);
  const [isKeywordProcessing, setIsKeywordProcessing] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [isKeywordBottomSheetOpen, setIsKeywordBottomSheetOpen] = useState(false);
  const keywordBottomSheetRef = useRef<BottomSheet>(null);

  // 시간표 알림 상태
  const [isTimetableEnabled, setIsTimetableEnabled] = useState(false);
  const [isTimetableProcessing, setIsTimetableProcessing] = useState(false);
  const [timetableTime, setTimetableTime] = useState<Date>(dayjs().set('hour', 7).set('minute', 0).toDate());

  // 급식 알림 Bottom Sheet 상태
  const [isMealBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const mealBottomSheetRef = useRef<BottomSheet>(null);

  // 시간표 Bottom Sheet 상태
  const [isTimetableBottomSheetOpen, setIsTimetableBottomSheetOpen] = useState(false);
  const timetableBottomSheetRef = useRef<BottomSheet>(null);

  const {theme, typography} = useTheme();
  const {schoolInfo, classInfo} = useUser();

  const initializeNotificationSettings = useCallback(async () => {
    const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');

    // 급식 알림 설정
    let isEnabledState = settings.mealNotification?.enabled || false;
    let notificationTime = settings.mealNotification?.time ? new Date(settings.mealNotification.time) : dayjs().set('hour', 7).set('minute', 30).toDate();

    // 키워드 알림 설정
    let isKeywordEnabledState = settings.keywordNotification?.enabled || false;
    let keywordsList = settings.keywordNotification?.keywords || [];

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

    return {isEnabledState, notificationTime, isKeywordEnabledState, keywordsList, isTimetableEnabledState, timetableNotificationTime};
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
          const {isEnabledState, notificationTime, isKeywordEnabledState, keywordsList, isTimetableEnabledState, timetableNotificationTime} = await initializeNotificationSettings();
          setIsMealEnabled(isEnabledState);
          setMealTime(notificationTime);
          setIsKeywordEnabled(isKeywordEnabledState);
          setKeywords(keywordsList);
          setIsTimetableEnabled(isTimetableEnabledState);
          setTimetableTime(timetableNotificationTime);
        } catch (error) {
          console.error('Failed to fetch notification settings:', error);
        }
      })();
    }, [initializeNotificationSettings]),
  );

  const updateMealTime = useCallback(async () => {
    setIsMealProcessing(true);
    try {
      const fcmToken = await getFcmToken();
      await editMealNotification(fcmToken, dayjs(mealTime).format('HH:mm'), schoolInfo.neisCode, schoolInfo.neisRegionCode);

      // settings 객체에 저장
      const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
      settings.mealNotification = {
        ...settings.mealNotification,
        enabled: isMealEnabled,
        time: mealTime,
      };
      await AsyncStorage.setItem('settings', JSON.stringify(settings));

      showToast(`매일 ${dayjs(mealTime).format('A hh:mm')}에 알림을 받아요.`);
    } catch (e) {
      const error = e as Error;
      showToast(`알림 시간 변경에 실패했어요:\n${error.message}`);
    }
    setIsMealProcessing(false);
  }, [mealTime, isMealEnabled, schoolInfo.neisCode, schoolInfo.neisRegionCode]);

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

        await addMealNotification(fcmToken, dayjs(mealTime).format('HH:mm'), schoolInfo.neisCode, schoolInfo.neisRegionCode);
        showToast(`매일 ${dayjs(mealTime).format('A hh:mm')}에 급식 알림을 받아요.`);
      } else {
        await removeMealNotification(fcmToken);
        showToast('급식 알림이 해제되었어요.');
      }

      // settings 객체에 저장
      const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
      settings.mealNotification = {
        enabled: subscribe,
        time: mealTime,
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
    const newState = !isMealEnabled;
    setIsMealEnabled(newState);
    setIsMealProcessing(true);
    const success = await handleMealSubscription(newState);
    if (!success) {
      setIsMealEnabled(!newState);
    }
    setIsMealProcessing(false);
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
  };

  const openTimetableBottomSheet = () => {
    setIsTimetableBottomSheetOpen(true);
  };

  const openKeywordBottomSheet = () => {
    setIsKeywordBottomSheetOpen(true);
  };

  // 키워드 추가 함수
  const addKeyword = async () => {
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
      const updatedKeywords = [...keywords, trimmedKeyword];
      setKeywords(updatedKeywords);
      setKeywordInput('');
      await saveKeywordSettings(updatedKeywords, isKeywordEnabled);

      // 서버 업데이트
      if (isKeywordEnabled) {
        try {
          const fcmToken = await getFcmToken();
          await editKeywordNotification(fcmToken, updatedKeywords, schoolInfo.neisCode, schoolInfo.neisRegionCode);
        } catch (error) {
          console.error('Error updating keywords on server:', error);
        }
      }
    }
  };

  // 키워드 삭제 함수
  const removeKeyword = async (keyword: string) => {
    const updatedKeywords = keywords.filter(k => k !== keyword);
    setKeywords(updatedKeywords);
    await saveKeywordSettings(updatedKeywords, isKeywordEnabled);

    // 서버 업데이트
    if (isKeywordEnabled) {
      try {
        const fcmToken = await getFcmToken();
        if (updatedKeywords.length === 0) {
          // 키워드가 모두 삭제되면 알림 비활성화
          await removeKeywordNotification(fcmToken);
          setIsKeywordEnabled(false);
          await saveKeywordSettings(updatedKeywords, false);
          showToast('마지막 키워드가 삭제되어 알림이 비활성화되었어요.');
        } else {
          await editKeywordNotification(fcmToken, updatedKeywords, schoolInfo.neisCode, schoolInfo.neisRegionCode);
        }
      } catch (error) {
        console.error('Error updating keywords on server:', error);
      }
    }
  };

  // 키워드 설정 저장
  const saveKeywordSettings = async (keywordsList: string[], enabled: boolean) => {
    try {
      const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
      settings.keywordNotification = {
        enabled,
        keywords: keywordsList,
      };
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save keyword settings:', error);
    }
  };

  // 키워드 알림 토글 핸들러
  const toggleKeywordSwitch = async () => {
    const newState = !isKeywordEnabled;

    // 키워드가 없으면 경고
    if (newState && keywords.length === 0) {
      showToast('키워드를 먼저 추가해주세요.');
      return;
    }

    setIsKeywordEnabled(newState);
    setIsKeywordProcessing(true);

    const success = await handleKeywordSubscription(newState);
    if (!success) {
      setIsKeywordEnabled(!newState);
    }

    setIsKeywordProcessing(false);
  };

  // 키워드 알림 구독 처리
  const handleKeywordSubscription = async (subscribe: boolean) => {
    try {
      const fcmToken = await getFcmToken();

      if (subscribe) {
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) return false;

        await addKeywordNotification(fcmToken, keywords, schoolInfo.neisCode, schoolInfo.neisRegionCode);
        showToast(`키워드 알림이 활성화되었어요.`);
      } else {
        await removeKeywordNotification(fcmToken);
        showToast('키워드 알림이 해제되었어요.');
      }

      await saveKeywordSettings(keywords, subscribe);
      return true;
    } catch (error) {
      console.error('Error handling keyword subscription:', error);
      showToast('키워드 알림 설정에 실패했어요.');
      return false;
    }
  };


  // Open bottom sheets after they mount
  useEffect(() => {
    if (isMealBottomSheetOpen && mealBottomSheetRef.current) {
      const timer = setTimeout(() => {
        mealBottomSheetRef.current?.snapToIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isMealBottomSheetOpen]);

  useEffect(() => {
    if (isTimetableBottomSheetOpen && timetableBottomSheetRef.current) {
      const timer = setTimeout(() => {
        timetableBottomSheetRef.current?.snapToIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isTimetableBottomSheetOpen]);

  useEffect(() => {
    if (isKeywordBottomSheetOpen && keywordBottomSheetRef.current) {
      const timer = setTimeout(() => {
        keywordBottomSheetRef.current?.snapToIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isKeywordBottomSheetOpen]);

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

  // 키보드가 닫힐 때 BottomSheet 위치 재설정
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (isKeywordBottomSheetOpen && keywordBottomSheetRef.current) {
        keywordBottomSheetRef.current.snapToIndex(0);
      }
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, [isKeywordBottomSheetOpen]);

  return (
    <>
      <Container scrollView bounce style={{gap: 8}}>
        <Card title="급식 알림" titleStyle={{fontSize: typography.body.fontSize}}>
          <View style={{gap: 8, marginTop: 8}}>
            {/* 알림 시간 설정 (공통) */}
            <Content
              title="알림 시간"
              arrow
              onPress={openBottomSheet}
              disabled={!isMealEnabled && !isKeywordEnabled}
              arrowText={dayjs(mealTime).format('A hh:mm')}
            />

            {/* 매일 알림 */}
            <View style={{marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border}}>
              <Text style={[typography.caption, {color: theme.secondaryText, marginBottom: 8}]}>매일 알림</Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <View style={{flex: 1}}>
                  <Text style={[typography.body, {color: theme.primaryText}]}>매일 급식 알림 받기</Text>
                  <Text style={[typography.caption, {color: theme.secondaryText, marginTop: 2}]}>매일 설정한 시간에 급식 정보를 받아요</Text>
                </View>
                <ToggleSwitch value={isMealEnabled} onValueChange={toggleMealSwitch} disabled={isMealProcessing || isKeywordEnabled} />
              </View>
            </View>

            {/* 키워드 알림 */}
            <View style={{marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border}}>
              <Text style={[typography.caption, {color: theme.secondaryText, marginBottom: 8}]}>키워드 알림</Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                <View style={{flex: 1}}>
                  <Text style={[typography.body, {color: theme.primaryText}]}>키워드 알림 받기</Text>
                  <Text style={[typography.caption, {color: theme.secondaryText, marginTop: 2}]}>원하는 메뉴가 나올 때만 알림을 받아요</Text>
                </View>
                <ToggleSwitch value={isKeywordEnabled} onValueChange={toggleKeywordSwitch} disabled={isKeywordProcessing || isMealEnabled} />
              </View>
              <Content title="키워드 관리" arrow onPress={openKeywordBottomSheet} disabled={false} arrowText={keywords.length > 0 ? `${keywords.length}개` : '추가'} />
              {isKeywordEnabled && keywords.length > 0 && (
                <View style={{marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
                  {keywords.map((keyword, index) => (
                    <View key={index} style={{backgroundColor: `${theme.highlight}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12}}>
                      <Text style={[typography.small, {color: theme.highlight}]}>{keyword}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
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

      {isMealBottomSheetOpen && (
        <BottomSheet
          backdropComponent={renderBackdrop}
          ref={mealBottomSheetRef}
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
              <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '600', alignSelf: 'flex-start'}]}>급식 알림 시간</Text>
              <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300', alignSelf: 'flex-start'}]}>급식 알림을 받을 시간을 설정해보세요.</Text>
            </View>
            <DatePicker mode="time" date={mealTime} theme="dark" dividerColor={theme.secondaryText} onDateChange={setMealTime} />
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
              <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300', alignSelf: 'flex-start'}]}>원하는 시간으로 설정해보세요.</Text>
            </View>
            <DatePicker mode="time" date={timetableTime} theme="dark" dividerColor={theme.secondaryText} onDateChange={setTimetableTime} />
          </BottomSheetView>
        </BottomSheet>
      )}

      {isKeywordBottomSheetOpen && (
        <BottomSheet
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustPan"
          backdropComponent={renderBackdrop}
          ref={keywordBottomSheetRef}
          enablePanDownToClose
          onClose={() => setIsKeywordBottomSheetOpen(false)}
          backgroundStyle={{backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16}}
          handleIndicatorStyle={{backgroundColor: theme.secondaryText}}>
          <BottomSheetView style={{paddingHorizontal: 18, paddingBottom: 12, flex: 1}}>
            <View style={{gap: 4, marginBottom: 16}}>
              <Text style={[typography.subtitle, {color: theme.primaryText, fontWeight: '600'}]}>키워드 관리</Text>
              <Text style={[typography.body, {color: theme.primaryText, fontWeight: '300'}]}>특정 메뉴가 나오는 날만 알림을 받아보세요.</Text>
            </View>

            {/* 키워드 입력 */}
            <View style={{flexDirection: 'row', gap: 8, marginBottom: 16}}>
              <BottomSheetTextInput
                placeholder="키워드를 입력하세요 (예: 피자, 치킨)"
                value={keywordInput}
                onChangeText={setKeywordInput}
                onSubmitEditing={addKeyword}
                placeholderTextColor={theme.secondaryText}
                style={[
                  typography.body,
                  {
                    flex: 1,
                    backgroundColor: theme.background,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: theme.primaryText,
                    borderWidth: 1,
                    borderColor: theme.border,
                  },
                ]}
              />
              <TouchableOpacity
                onPress={addKeyword}
                style={{
                  backgroundColor: theme.highlight,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                activeOpacity={0.8}>
                <Text style={[typography.body, {color: theme.white, fontWeight: '600'}]}>추가</Text>
              </TouchableOpacity>
            </View>

            {/* 키워드 리스트 */}
            <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
              {keywords.length === 0 ? (
                <View style={{alignItems: 'center', paddingVertical: 32}}>
                  <FontAwesome6 name="bell-slash" size={32} color={theme.secondaryText} iconStyle="solid" />
                  <Text style={[typography.body, {color: theme.secondaryText, marginTop: 12}]}>아직 키워드가 없어요.</Text>
                  <Text style={[typography.caption, {color: theme.secondaryText, marginTop: 4}]}>알림 받고 싶은 메뉴를 추가해보세요.</Text>
                </View>
              ) : (
                <View style={{gap: 8}}>
                  {keywords.map((keyword, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: theme.background,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}>
                      <Text style={[typography.body, {color: theme.primaryText}]}>{keyword}</Text>
                      <TouchableOpacity onPress={() => removeKeyword(keyword)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} activeOpacity={0.7}>
                        <FontAwesome6 name="xmark" size={16} color={theme.secondaryText} iconStyle="solid" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {keywords.length > 0 && (
              <View style={{marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border}}>
                <Text style={[typography.caption, {color: theme.secondaryText, textAlign: 'center'}]}>{keywords.length}개의 키워드가 등록되어 있어요.</Text>
              </View>
            )}
          </BottomSheetView>
        </BottomSheet>
      )}
    </>
  );
};

export default Notification;
