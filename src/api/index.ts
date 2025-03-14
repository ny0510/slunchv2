import dayjs from 'dayjs';

import httpClient from './httpClient';
import {ClassList, Meal, Notification, Schedule, School, Timetable} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours
const CACHE_PREFIX = '@cache/';

const isCacheExpired = (timestamp: number) => {
  const cacheDate = dayjs(timestamp);
  const now = dayjs();
  return now.isAfter(cacheDate, 'day');
};

const getCachedData = async (key: string) => {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const cachedData = await AsyncStorage.getItem(cacheKey);
  if (cachedData) {
    const {data, timestamp} = JSON.parse(cachedData);
    if (isCacheExpired(timestamp)) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    if (dayjs().diff(dayjs(timestamp)) < CACHE_DURATION) {
      return data;
    }
  }
  return null;
};

const setCachedData = async (key: string, data: any) => {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const cacheEntry = {
    data,
    timestamp: dayjs().valueOf(),
  };
  await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
};

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

export const getMeal = async (schoolCode: number, regionCode: string, year: string, month: string, day?: string, showAllergy: boolean = false, showOrigin: boolean = false, showNutrition: boolean = false): Promise<Meal[]> => {
  const cacheKey = `meal_${schoolCode}_${regionCode}_${year}_${month}_${day}`;
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

export const getSchedules = async (schoolCode: number, regionCode: string, year: string, month: string, day?: string): Promise<Schedule[]> => {
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
