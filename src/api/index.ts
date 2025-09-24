import httpClient from './httpClient';
import {getCachedData, setCachedData} from '@/lib/cache';
import {ClassList, Meal, Notification, Schedule, School, Timetable} from '@/types/api';

export const comciganSchoolSearch = async (schoolName: string): Promise<School[]> => {
  const response = await httpClient.get('/comcigan/search', {
    params: {schoolName},
  });
  return response.data;
};

export const getClassList = async (schoolCode: number | string): Promise<ClassList[]> => {
  const response = await httpClient.get('/comcigan/classList', {
    params: {schoolCode},
  });
  return response.data;
};

export const getTimetable = async (schoolCode: number | string, grade: number | string, classNum: number | string): Promise<Timetable[][]> => {
  const cacheKey = `timetable_${schoolCode}_${grade}_${classNum}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const response = await httpClient.get('/comcigan/timetable', {
    params: {schoolCode, grade, class: classNum},
  });
  await setCachedData(cacheKey, response.data);
  return response.data;
};

export const neisSchoolSearch = async (schoolName: string): Promise<School[]> => {
  const response = await httpClient.get('/neis/search', {
    params: {schoolName},
  });
  return response.data;
};

export const getMeal = async (schoolCode: number | string, regionCode: string, year: string, month: string, day?: string, showAllergy: boolean = false, showOrigin: boolean = false, showNutrition: boolean = false): Promise<Meal[]> => {
  const cacheKey = `meal_${schoolCode}_${regionCode}_${year}_${month}_${day}_${showAllergy}_${showOrigin}_${showNutrition}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const response = await httpClient.get('/neis/meal', {
    params: {
      schoolCode,
      regionCode,
      year,
      month,
      day,
      showAllergy,
      showOrigin,
      showNutrition,
    },
  });

  if (response.status === 404) {
    return [];
  }
  await setCachedData(cacheKey, response.data);
  return response.data;
};

export const getSchedules = async (schoolCode: number | string, regionCode: string, year: string, month: string, day?: string): Promise<Schedule[]> => {
  const cacheKey = `schedules_${schoolCode}_${regionCode}_${year}_${month}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const response = await httpClient.get('/neis/schedule', {
    params: {schoolCode, regionCode, year, month, day},
  });

  if (response.status === 404) {
    return [];
  }
  await setCachedData(cacheKey, response.data);
  return response.data;
};

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await httpClient.get('/notifications');
  return response.data;
};

export const addMealNotification = async (fcmToken: string, time: string, schoolCode: number | string, regionCode: string): Promise<void> => {
  const response = await httpClient.post('/fcm/meal', {token: fcmToken, time, schoolCode, regionCode});
  return response.data;
};

export const removeMealNotification = async (fcmToken: string): Promise<void> => {
  const response = await httpClient.delete('/fcm/meal', {data: {token: fcmToken}});
  return response.data;
};

export const checkMealNotification = async (fcmToken: string): Promise<boolean> => {
  const response = await httpClient.get('/fcm/meal', {params: {token: fcmToken}});
  return response.status === 200;
};

export const editMealNotification = async (fcmToken: string, time: string, schoolCode: number | string, regionCode: string): Promise<void> => {
  const response = await httpClient.put('/fcm/meal', {token: fcmToken, time, schoolCode, regionCode});
  return response.data;
};

// 키워드 알림 관련 API
export const addKeywordNotification = async (fcmToken: string, keywords: string[], time: string, schoolCode: number | string, regionCode: string): Promise<void> => {
  const response = await httpClient.post('/fcm/keyword', {token: fcmToken, keywords, time, schoolCode, regionCode});
  return response.data;
};

export const removeKeywordNotification = async (fcmToken: string): Promise<void> => {
  const response = await httpClient.delete('/fcm/keyword', {data: {token: fcmToken}});
  return response.data;
};

export const editKeywordNotification = async (fcmToken: string, keywords: string[], time: string, schoolCode: number | string, regionCode: string): Promise<void> => {
  const response = await httpClient.put('/fcm/keyword', {token: fcmToken, keywords, time, schoolCode, regionCode});
  return response.data;
};

export const checkKeywordNotification = async (fcmToken: string): Promise<boolean> => {
  const response = await httpClient.get('/fcm/keyword', {params: {token: fcmToken}});
  return response.status === 200;
};

// 시간표 알림 API
export const addTimetableNotification = async (fcmToken: string, time: string, schoolCode: number, grade: number | string, classNum: number | string): Promise<void> => {
  const response = await httpClient.post('/fcm/timetable', {
    token: fcmToken,
    time,
    schoolCode,
    grade,
    class: classNum,
  });
  return response.data;
};

export const removeTimetableNotification = async (fcmToken: string): Promise<void> => {
  const response = await httpClient.delete('/fcm/timetable', {data: {token: fcmToken}});
  return response.data;
};

export const editTimetableTime = async (fcmToken: string, time: string, schoolCode: number, grade: number | string, classNum: number | string): Promise<void> => {
  const response = await httpClient.put('/fcm/timetable', {
    token: fcmToken,
    time,
    schoolCode,
    grade,
    class: classNum,
  });
  return response.data;
};

export const checkTimetableNotification = async (fcmToken: string): Promise<boolean> => {
  const response = await httpClient.get('/fcm/timetable', {params: {token: fcmToken}});
  return response.status === 200;
};
