import {useEffect, useState} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const useFirstOpen = () => {
  const [isFirstOpen, setIsFirstOpen] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const storedValue = await AsyncStorage.getItem('isFirstOpen');
      setIsFirstOpen(storedValue ? JSON.parse(storedValue) : true);
    })();
  }, []);

  return isFirstOpen;
};
