import dayjs from 'dayjs';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours
export const CACHE_PREFIX = '@cache/';

export const setCachedData = async (key: string, data: any) => {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const cacheEntry = {
    data,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
};

export const getCachedData = async (key: string) => {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const cachedData = await AsyncStorage.getItem(cacheKey);
  if (cachedData) {
    const {data, timestamp} = JSON.parse(cachedData);
    const now = Date.now();

    // Simple cache expiration check
    if (now - timestamp > CACHE_DURATION) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return data;
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
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
