import {useEffect} from 'react';
import {NativeModules, Platform} from 'react-native';

import type {WidgetBridge} from '@/types/WidgetBridge';
import type {UserSchoolInfo} from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {WidgetBridge} = NativeModules as {WidgetBridge: WidgetBridge};

export const useWidget = () => {
  useEffect(() => {
    // 위젯 브릿지가 없으면 실행하지 않음
    if (!WidgetBridge) {
      return;
    }

    // 앱 시작 시 학교 정보를 네이티브로 동기화
    syncSchoolInfoToNative();

    return () => {};
  }, []);

  const syncSchoolInfoToNative = async () => {
    try {
      // WidgetBridge가 없으면 실행하지 않음
      if (!WidgetBridge) {
        return;
      }

      const schoolData = await AsyncStorage.getItem('school');
      const classData = await AsyncStorage.getItem('class');

      if (schoolData) {
        const schoolInfo: UserSchoolInfo = JSON.parse(schoolData);

        // neisCode와 neisRegionCode가 있는지 확인
        if (schoolInfo.neisCode && schoolInfo.neisRegionCode) {
          await WidgetBridge.saveSchoolInfo(schoolInfo.neisCode.toString(), schoolInfo.neisRegionCode);
          console.log('School info synced to native:', {
            schoolCode: schoolInfo.neisCode,
            regionCode: schoolInfo.neisRegionCode,
          });
        }

        // 컴시간 학교 코드와 학급 정보도 저장
        if (schoolInfo.comciganCode && classData) {
          const classInfo = JSON.parse(classData);
          const grade = parseInt(classInfo.grade, 10);
          const classNum = parseInt(classInfo.class, 10);

          if (!isNaN(grade) && !isNaN(classNum) && grade > 0 && classNum > 0) {
            await WidgetBridge.saveTimetableInfo(schoolInfo.comciganCode.toString(), grade, classNum);
            console.log('Timetable info synced to native:', {
              comciganSchoolCode: schoolInfo.comciganCode,
              grade,
              class: classNum,
            });
          }
        }
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
