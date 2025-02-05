import {useEffect, useState} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const useFirstOpen = () => {
  const [isFirstOpen, setIsFirstOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkIfFirstOpen = async () => {
      const _isFirstOpen = await AsyncStorage.getItem('isFirstOpen');
      setIsFirstOpen(!_isFirstOpen);
      setIsLoading(false);
    };

    checkIfFirstOpen();
  }, []);

  return {isFirstOpen, isLoading};
};
