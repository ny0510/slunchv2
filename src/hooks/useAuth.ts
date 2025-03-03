import {useEffect, useState} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {GoogleSignin, User} from '@react-native-google-signin/google-signin';

const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '1076316211812-m48klmqgvsn503of2oi35igcqgojhv6l.apps.googleusercontent.com',
    });

    const loadUser = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('googleAuthInfo');
        if (userInfo) {
          setUser(JSON.parse(userInfo));
        }
      } catch (error) {
        console.error('사용자 정보 불러오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async () => {
    try {
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const {data} = await GoogleSignin.signIn();
      await AsyncStorage.setItem('googleAuthInfo', JSON.stringify(data));
      setUser(data);
      console.log('로그인 성공:', data);
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem('googleAuthInfo');
      setUser(null);
      console.log('로그아웃 완료');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  };

  return {user, loading, login, logout};
};

export default useAuth;
