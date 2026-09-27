import React, { createContext, useContext, useEffect, useState } from 'react';

import { getAuth, onAuthStateChanged, signInWithCredential, signOut, GoogleAuthProvider, type User } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '1076316211812-m48klmqgvsn503of2oi35igcqgojhv6l.apps.googleusercontent.com',
  offlineAccess: true,
});

const auth = getAuth();

type Props = {
  user: User | null;
  loading: boolean;
  login: () => Promise<User | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Props>({
  user: null,
  loading: true,
  login: async () => {
    return null;
  },
  logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async firebaseUser => {
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

      const { idToken } = await GoogleSignin.getTokens();

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);

      return userCredential.user;
    } catch (error) {
      console.error(`[AuthProvider] Error signing in with Google: ${error}`);
      throw error;
    }
  };

  const logout = async () => {
    await GoogleSignin.signOut();
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};
