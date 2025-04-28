import React, {createContext, useContext, useEffect, useState} from 'react';

import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '1076316211812-m48klmqgvsn503of2oi35igcqgojhv6l.apps.googleusercontent.com',
  offlineAccess: true,
});

type Props = {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  login: () => Promise<FirebaseAuthTypes.User | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Props>({
  user: null,
  loading: true,
  login: async () => {
    return null;
  },
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async firebaseUser => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await firebaseUser.getIdToken(true); // 강제 토큰 갱신
      }
      if (loading) {
        setLoading(false);
      }
    });
    return subscriber;
  }, [loading]);

  const login = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      if (result.type === 'cancelled') {
        return null;
      }

      const {idToken} = await GoogleSignin.getTokens();

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      return userCredential.user;
    } catch (error) {
      console.error(`[AuthProvider] Error signing in with Google: ${error}`);
      throw error;
    }
  };

  const logout = async () => {
    await GoogleSignin.signOut();
    await auth().signOut();
  };

  return <AuthContext.Provider value={{user, loading, login, logout}}>{children}</AuthContext.Provider>;
};
