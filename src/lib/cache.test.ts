import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CACHE_DURATION,
  clearCache,
  getCachedData,
  setCachedData,
} from './cache';

describe('cache', () => {
  const baseTime = new Date('2026-01-15T12:00:00.000Z').getTime();
  let now: jest.SpyInstance<number, []>;

  beforeEach(async () => {
    await AsyncStorage.clear();
    now = jest.spyOn(Date, 'now').mockReturnValue(baseTime);
  });

  afterEach(async () => {
    try {
      await AsyncStorage.clear();
    } finally {
      now.mockRestore();
    }
  });

  it('returns null for a missing key', async () => {
    expect(await getCachedData('missing')).toBeNull();
  });

  it('stores and returns the original data with its timestamp', async () => {
    const data = { meal: ['rice'] };

    await setCachedData('meal', data);
    now.mockReturnValue(baseTime + 1);

    expect(await getCachedData('meal')).toEqual(data);
    expect(await AsyncStorage.getItem('@cache/meal')).toBe(
      JSON.stringify({ data, timestamp: baseTime }),
    );
  });

  it('keeps data valid at the expiry boundary', async () => {
    const data = { meal: ['rice'] };

    await setCachedData('meal', data);
    now.mockReturnValue(baseTime + CACHE_DURATION);

    expect(await getCachedData('meal')).toEqual(data);
    expect(await AsyncStorage.getItem('@cache/meal')).not.toBeNull();
  });

  it('expires data after the expiry boundary and removes its storage entry', async () => {
    await setCachedData('meal', { meal: ['rice'] });
    now.mockReturnValue(baseTime + CACHE_DURATION + 1);

    expect(await getCachedData('meal')).toBeNull();
    expect(await AsyncStorage.getItem('@cache/meal')).toBeNull();
  });

  it('clears only keys matching the requested meal prefix', async () => {
    await AsyncStorage.setItem('@cache/meal/one', 'one');
    await AsyncStorage.setItem('@cache/meal/two', 'two');
    await AsyncStorage.setItem('@cache/timetable/one', 'timetable');
    await AsyncStorage.setItem('theme', 'dark');

    await clearCache('@cache/meal/');

    expect(await AsyncStorage.getAllKeys()).toEqual(
      expect.arrayContaining(['@cache/timetable/one', 'theme']),
    );
    expect(await AsyncStorage.getAllKeys()).not.toEqual(
      expect.arrayContaining(['@cache/meal/one', '@cache/meal/two']),
    );
    expect(await AsyncStorage.getItem('@cache/timetable/one')).toBe('timetable');
    expect(await AsyncStorage.getItem('theme')).toBe('dark');
  });

  it('preserves all stored entries when no key matches the prefix', async () => {
    const entries: [string, string][] = [
      ['@cache/meal/one', 'one'],
      ['@cache/timetable/one', 'timetable'],
      ['theme', 'dark'],
    ];
    for (const [key, value] of entries) {
      await AsyncStorage.setItem(key, value);
    }
    await clearCache('@cache/unmatched/');
    expect(await AsyncStorage.getAllKeys()).toEqual(
      expect.arrayContaining(entries.map(([key]) => key)),
    );
    for (const [key, value] of entries) {
      expect(await AsyncStorage.getItem(key)).toBe(value);
    }
  });
});
