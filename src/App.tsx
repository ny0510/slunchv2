import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Stack from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';

const App = () => {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <StatusBar animated barStyle="light-content" backgroundColor={theme.colors.background} />
      <Stack />
    </SafeAreaView>
  );
};

export default App;
