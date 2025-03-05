import React, {createContext, useContext, useEffect, useState} from 'react';
import {ReactNode} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {GoogleSignin, User} from '@react-native-google-signin/google-signin';

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  login: () => Promise<User>;
  logout: () => Promise<void>;
}>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error('login function not implemented');
  },
  logout: async () => {
    throw new Error('logout function not implemented');
  },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({children}: {children: ReactNode}) => {
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
      if (!data) {
        throw new Error('사용자 정보를 불러오는 데 실패했습니다.');
      }
      await AsyncStorage.setItem('googleAuthInfo', JSON.stringify(data));
      setUser(data);
      console.log('로그인 성공:', data);
      return data;
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

  return <AuthContext.Provider value={{user, loading, login, logout}}>{children}</AuthContext.Provider>;
};
