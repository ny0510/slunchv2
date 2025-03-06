import dayjs from 'dayjs';

import httpClient from './httpClient';
import {ClassList, Meal, Schedule, School, Timetable} from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION = 3600000; // 1시간

const getCachedData = async (key: string) => {
  const cachedData = await AsyncStorage.getItem(key);
  if (cachedData) {
    const {data, timestamp} = JSON.parse(cachedData);
    if (dayjs().diff(dayjs(timestamp)) < CACHE_DURATION) {
      return data;
    }
  }
  return null;
};

const setCachedData = async (key: string, data: any) => {
  const cacheEntry = {
    data,
    timestamp: dayjs().valueOf(),
  };
  await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
};

export const comciganSchoolSearch = async (schoolName: string): Promise<School[]> => {
  const cacheKey = `comciganSchoolSearch_${schoolName}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const response = await httpClient.get('/comcigan/search', {
    params: {schoolName},
  });
  await setCachedData(cacheKey, response.data);
  return response.data;
};

export const getClassList = async (schoolCode: number): Promise<ClassList[]> => {
  const cacheKey = `getClassList_${schoolCode}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const response = await httpClient.get('/comcigan/classList', {
    params: {schoolCode},
  });
  await setCachedData(cacheKey, response.data);
  return response.data;
};

export const getTimetable = async (schoolCode: number, grade: number, classNum: number): Promise<Timetable[][]> => {
  const cacheKey = `getTimetable_${schoolCode}_${grade}_${classNum}`;
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
  const cacheKey = `neisSchoolSearch_${schoolName}`;
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const response = await httpClient.get('/neis/search', {
    params: {schoolName},
  });
  await setCachedData(cacheKey, response.data);
  return response.data;
};

export const getMeal = async (schoolCode: number, regionCode: string, year: string, month: string, day?: string, showAllergy: boolean = false, showOrigin: boolean = false, showNutrition: boolean = false): Promise<Meal[]> => {
  const cacheKey = `getMeal_${schoolCode}_${regionCode}_${year}_${month}_${day}`;
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
  const cacheKey = `getSchedules_${schoolCode}_${regionCode}_${year}_${month}`;
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
