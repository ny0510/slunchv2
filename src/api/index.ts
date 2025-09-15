import httpClient from './httpClient';
import {getCachedData, setCachedData} from '@/lib/cache';
import {ClassList, Meal, Notification, Schedule, School, Timetable} from '@/types/api';

export const comciganSchoolSearch = async (schoolName: string): Promise<School[]> => {
  const response = await httpClient.get('/comcigan/search', {
    params: {schoolName},
  });
  return response.data;
};

export const getClassList = async (schoolCode: number): Promise<ClassList[]> => {
  const response = await httpClient.get('/comcigan/classList', {
    params: {schoolCode},
  });
  return response.data;
};

export const getTimetable = async (schoolCode: number, grade: number, classNum: number): Promise<Timetable[][]> => {
  const cacheKey = `timetable_${schoolCode}_${grade}_${classNum}`;
  const cachedData = await getCachedData<Timetable[][]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const response = await httpClient.get('/comcigan/timetable', {
    params: {schoolCode, grade, class: classNum},
  });
  await setCachedData(cacheKey, response.data);
  return response.data || [];
};

export const neisSchoolSearch = async (schoolName: string): Promise<School[]> => {
  const response = await httpClient.get('/neis/search', {
    params: {schoolName},
  });
  return response.data;
};

export const getMeal = async (schoolCode: number, regionCode: string, year: number, month: number, day?: number, showAllergy: boolean = false, showOrigin: boolean = false, showNutrition: boolean = false): Promise<Meal[]> => {
  const cacheKey = `meal_${schoolCode}_${regionCode}_${year}_${month}_${day}`;
  const cachedData = await getCachedData<Meal[]>(cacheKey);
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
  return response.data || [];
};

export const getSchedules = async (schoolCode: number, regionCode: string, year: number, month: number, day?: number): Promise<Schedule[]> => {
  const cacheKey = `schedules_${schoolCode}_${regionCode}_${year}_${month}`;
  const cachedData = await getCachedData<Schedule[]>(cacheKey);
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
  return response.data || [];
};

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await httpClient.get('/notifications');
  return response.data;
};

export const addFcmToken = async (fcmToken: string, time: string, schoolCode: string, regionCode: string): Promise<void> => {
  const response = await httpClient.post('/fcm', {token: fcmToken, time, schoolCode, regionCode});
  return response.data;
};

export const removeFcmToken = async (fcmToken: string): Promise<void> => {
  const response = await httpClient.delete('/fcm', {data: {token: fcmToken}});
  return response.data;
};

export const checkFcmToken = async (fcmToken: string): Promise<boolean> => {
  const response = await httpClient.get('/fcm', {params: {token: fcmToken}});
  return response.status === 200;
};

export const editFcmTime = async (fcmToken: string, time: string, schoolCode: string, regionCode: string): Promise<void> => {
  const response = await httpClient.put('/fcm', {token: fcmToken, time, schoolCode, regionCode});
  return response.data;
};
