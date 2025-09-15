import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 타입 안전한 AsyncStorage 헬퍼 클래스
 * JSON 파싱 오류 처리 및 타입 추론을 제공합니다.
 */
export class StorageHelper {
  /**
   * 키로 데이터를 가져옵니다.
   * @param key - 저장소 키
   * @param defaultValue - 기본값 (키가 없거나 파싱 실패시 반환)
   * @returns 파싱된 데이터 또는 기본값
   */
  static async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const item = await AsyncStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to get item from storage (key: ${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * 문자열 데이터를 가져옵니다.
   * @param key - 저장소 키
   * @param defaultValue - 기본값
   * @returns 문자열 또는 기본값
   */
  static async getString(key: string, defaultValue = ''): Promise<string> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ?? defaultValue;
    } catch (error) {
      console.warn(`Failed to get string from storage (key: ${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * 데이터를 저장합니다.
   * @param key - 저장소 키
   * @param value - 저장할 값
   */
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Failed to set item in storage (key: ${key}):`, error);
      throw error;
    }
  }

  /**
   * 문자열 데이터를 저장합니다.
   * @param key - 저장소 키
   * @param value - 저장할 문자열
   */
  static async setString(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set string in storage (key: ${key}):`, error);
      throw error;
    }
  }

  /**
   * 키를 삭제합니다.
   * @param key - 삭제할 키
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item from storage (key: ${key}):`, error);
      throw error;
    }
  }

  /**
   * 여러 키를 동시에 삭제합니다.
   * @param keys - 삭제할 키들
   */
  static async removeMultiple(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error(`Failed to remove multiple items from storage:`, error);
      throw error;
    }
  }

  /**
   * 저장소를 완전히 비웁니다.
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error(`Failed to clear storage:`, error);
      throw error;
    }
  }

  /**
   * 모든 키를 가져옵니다.
   * @returns 저장소의 모든 키 배열
   */
  static async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error(`Failed to get all keys from storage:`, error);
      return [];
    }
  }
}

// 저장소 키 상수들
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  CLASS_INFO: 'classInfo',
  SCHOOL_INFO: 'schoolInfo',
  USER_SETTINGS: 'userSettings',
  THEME_SETTINGS: 'themeSettings',
  NOTIFICATION_SETTINGS: 'notificationSettings',
  CACHED_TIMETABLE: 'cachedTimetable',
  CACHED_MEAL: 'cachedMeal',
  CACHED_SCHEDULES: 'cachedSchedules',
  LAST_UPDATE: 'lastUpdate',
  APP_VERSION: 'appVersion',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];