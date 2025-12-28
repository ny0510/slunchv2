import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { CardData, UserClassInfo, UserSchoolInfo } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  schoolInfo: UserSchoolInfo;
  classInfo: UserClassInfo;
  refreshUserData: () => void;
  classChangedTrigger: boolean;
  setClassChangedTrigger: (value: boolean) => void;
  cardOrder: CardData[];
  setCardOrder: (order: CardData[] | ((prev: CardData[]) => CardData[])) => void;
}

const DEFAULT_CARD_ORDER: CardData[] = [
  { id: 'schedule', title: '학사일정', iconName: 'calendar', visible: true },
  { id: 'meal', title: '급식', iconName: 'utensils', visible: true },
  { id: 'timetable', title: '시간표', iconName: 'table', visible: true },
  { id: 'grade-timetable', title: '학년 시간표', iconName: 'table-cells', visible: false },
];

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  const [cardOrder, setCardOrder] = useState<CardData[]>(DEFAULT_CARD_ORDER);
  const [refreshKey, setRefreshKey] = useState(0);
  const [classChangedTrigger, setClassChangedTrigger] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const [classData, schoolData, savedOrder] = await Promise.all([
        AsyncStorage.getItem('class'),
        AsyncStorage.getItem('school'),
        AsyncStorage.getItem('homeCardOrder'),
      ]);

      const parsedClassInfo = classData ? JSON.parse(classData) : {};
      const parsedSchoolInfo = schoolData ? JSON.parse(schoolData) : {};

      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          // Ensure all cards have visible property, default to true if missing
          const updatedOrder = parsedOrder.map((card: any) => ({
            ...card,
            visible: card.visible !== undefined ? card.visible : true,
          }));
          setCardOrder(updatedOrder);
        } catch (error) {
          console.error('Failed to parse saved card order:', error);
        }
      }

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

  const handleSetCardOrder = useCallback((orderOrFn: CardData[] | ((prev: CardData[]) => CardData[])) => {
    setCardOrder(prev => {
      const newOrder = typeof orderOrFn === 'function' ? orderOrFn(prev) : orderOrFn;
      AsyncStorage.setItem('homeCardOrder', JSON.stringify(newOrder));
      return newOrder;
    });
  }, []);

  const value: UserContextType = {
    schoolInfo,
    classInfo,
    refreshUserData,
    classChangedTrigger,
    setClassChangedTrigger,
    cardOrder,
    setCardOrder: handleSetCardOrder,
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
