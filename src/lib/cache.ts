import AsyncStorage from '@react-native-async-storage/async-storage';

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
