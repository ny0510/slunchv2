import {useEffect} from 'react';
import {NativeModules} from 'react-native';

import type {WidgetBridge} from '@/types/WidgetBridge';
import type {UserSchoolInfo} from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {WidgetBridge} = NativeModules as {WidgetBridge: WidgetBridge};

export const useWidget = () => {
  useEffect(() => {
    // 위젯 브릿지가 사용 가능한지 확인
    if (!WidgetBridge) {
      console.warn('WidgetBridge not available');
      return;
    }

    // 앱 시작 시 학교 정보를 네이티브로 동기화
    syncSchoolInfoToNative();

    return () => {};
  }, []);

  const syncSchoolInfoToNative = async () => {
    try {
      const schoolData = await AsyncStorage.getItem('school');
      if (schoolData) {
        const schoolInfo: UserSchoolInfo = JSON.parse(schoolData);
        await WidgetBridge.saveSchoolInfo(schoolInfo.neisCode.toString(), schoolInfo.neisRegionCode);
        console.log('School info synced to native:', {
          schoolCode: schoolInfo.neisCode,
          regionCode: schoolInfo.neisRegionCode,
        });
      }
    } catch (error) {
      console.error('Failed to sync school info to native:', error);
    }
  };

  const updateWidget = async (mealData: string) => {
    try {
      if (WidgetBridge) {
        await WidgetBridge.updateWidget(mealData);
      }
    } catch (error) {
      console.error('Failed to update widget:', error);
    }
  };

  const forceUpdateWidget = async () => {
    try {
      if (WidgetBridge) {
        await WidgetBridge.forceUpdateWidget();
      }
    } catch (error) {
      console.error('Failed to force update widget:', error);
    }
  };

  return {
    updateWidget,
    forceUpdateWidget,
    syncSchoolInfoToNative,
  };
};
