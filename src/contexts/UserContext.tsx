import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';

import {UserClassInfo, UserSchoolInfo} from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  schoolInfo: UserSchoolInfo;
  classInfo: UserClassInfo;
  refreshUserData: () => void;
  classChangedTrigger: boolean;
  setClassChangedTrigger: (value: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [schoolInfo, setSchoolInfo] = useState<UserSchoolInfo>({
    schoolName: '',
    comciganCode: 0,
    comciganRegion: '',
    neisCode: 0,
    neisRegion: '',
    neisRegionCode: '',
  });
  const [classInfo, setClassInfo] = useState<UserClassInfo>({
    grade: '',
    class: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [classChangedTrigger, setClassChangedTrigger] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const classData = await AsyncStorage.getItem('class');
      const schoolData = await AsyncStorage.getItem('school');

      const parsedClassInfo = classData ? JSON.parse(classData) : {};
      const parsedSchoolInfo = schoolData ? JSON.parse(schoolData) : {};

      setClassInfo(parsedClassInfo);
      setSchoolInfo(parsedSchoolInfo);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData, refreshKey]);

  const refreshUserData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const value: UserContextType = {
    schoolInfo,
    classInfo,
    refreshUserData,
    classChangedTrigger,
    setClassChangedTrigger,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
