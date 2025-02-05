import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';

import Stack from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';

const App = () => {
  return (
    <GestureHandlerRootView>
      <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
        <StatusBar animated barStyle="light-content" backgroundColor={theme.colors.background} />
        <Stack />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;
