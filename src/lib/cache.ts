import dayjs from 'dayjs';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours
export const CACHE_PREFIX = '@cache/';

export const isCacheExpired = (timestamp: number) => {
  const cacheDate = dayjs(timestamp);
  const now = dayjs();
  return now.isAfter(cacheDate, 'day');
};

export const getCachedData = async (key: string) => {
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

export const clearCache = async (prefix: string) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(prefix));

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }

    console.log('Cache cleared:', cacheKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
