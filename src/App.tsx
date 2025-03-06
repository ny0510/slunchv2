import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
import {hideSplash} from 'react-native-splash-view';
import Toast from 'react-native-toast-message';

import {toastConfig} from './lib/toast';
import Stack from '@/navigation/RootStacks';
import {AuthProvider} from '@/providers/AuthProvider';
import {theme} from '@/styles/theme';

const App = () => {
  useEffect(() => {
    setTimeout(() => {
      hideSplash();
    }, 250);
  }, []);

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
        <AuthProvider>
          <StatusBar animated barStyle="light-content" backgroundColor={theme.colors.background} />
          <Stack />
          <Toast config={toastConfig} />
        </AuthProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;
