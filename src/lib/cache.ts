import dayjs from 'dayjs';

import {StorageHelper} from '@/lib/storage';

export const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
export const CACHE_PREFIX = '@cache/';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * 캐시가 만료되었는지 확인합니다 (하루 기준)
 * @param timestamp - 캐시 생성 시간
 * @returns 만료 여부
 */
export const isCacheExpired = (timestamp: number): boolean => {
  const cacheDate = dayjs(timestamp);
  const now = dayjs();
  return now.isAfter(cacheDate, 'day');
};

/**
 * 데이터를 캐시에 저장합니다
 * @param key - 캐시 키
 * @param data - 저장할 데이터
 */
export const setCachedData = async <T>(key: string, data: T): Promise<void> => {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const cacheEntry: CacheEntry<T> = {
    data,
    timestamp: dayjs().valueOf(),
  };
  await StorageHelper.setItem(cacheKey, cacheEntry);
};

/**
 * 캐시에서 데이터를 가져옵니다
 * @param key - 캐시 키
 * @returns 캐시된 데이터 또는 null
 */
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const defaultValue: CacheEntry<T> | null = null;
  const cachedEntry = await StorageHelper.getItem(cacheKey, defaultValue);
  
  if (cachedEntry) {
    const {data, timestamp} = cachedEntry;
    
    // 하루가 지났으면 캐시 삭제
    if (isCacheExpired(timestamp)) {
      await StorageHelper.removeItem(cacheKey);
      return null;
    }
    
    // 3시간이 지나지 않았으면 데이터 반환
    if (dayjs().diff(dayjs(timestamp)) < CACHE_DURATION) {
      return data;
    }
  }
  
  return null;
};

/**
 * 지정된 접두사로 시작하는 캐시를 모두 삭제합니다
 * @param prefix - 삭제할 캐시 키 접두사
 */
export const clearCache = async (prefix: string): Promise<void> => {
  try {
    const keys = await StorageHelper.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(prefix));

    if (cacheKeys.length > 0) {
      await StorageHelper.removeMultiple([...cacheKeys]);
    }

    console.log('Cache cleared:', cacheKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
};
