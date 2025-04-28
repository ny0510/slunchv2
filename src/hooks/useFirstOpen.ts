import {useEffect, useRef, useState} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export function useFirstOpen() {
  const [isFirstOpen, setIsFirstOpen] = useState<null | boolean>(null);
  const hasCompleted = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem('isFirstOpen').then(value => {
      if (value === 'false') {
        setIsFirstOpen(false);
        hasCompleted.current = true;
      } else if (value === 'true') {
        setIsFirstOpen(true);
      } else {
        setIsFirstOpen(true);
      }
    });
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('isFirstOpen', 'false');
    setIsFirstOpen(false);
    hasCompleted.current = true;
  };

  // 강제로 온보딩 상태를 변경
  const setFirstOpen = async (value: boolean) => {
    await AsyncStorage.setItem('isFirstOpen', value ? 'true' : 'false');
    setIsFirstOpen(value);
    if (!value) {
      hasCompleted.current = true;
    }
  };

  if (hasCompleted.current && isFirstOpen !== false) {
    setIsFirstOpen(false);
  }

  return {isFirstOpen, completeOnboarding, setFirstOpen};
}
