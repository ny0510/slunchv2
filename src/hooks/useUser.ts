import {useEffect, useState} from 'react';

import {UserClassInfo, UserSchoolInfo} from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUser = () => {
  const [schoolInfo, setSchoolInfo] = useState<UserSchoolInfo>({} as UserSchoolInfo);
  const [classInfo, setClassInfo] = useState<UserClassInfo>({} as UserClassInfo);

  useEffect(() => {
    (async () => {
      const classData = await AsyncStorage.getItem('class');
      const schoolData = await AsyncStorage.getItem('school');

      setClassInfo(classData ? JSON.parse(classData) : {});
      setSchoolInfo(schoolData ? JSON.parse(schoolData) : {});
    })();
  }, []);

  return {schoolInfo, classInfo};
};
