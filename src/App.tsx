import React from 'react';
import {Dimensions, StatusBar, Text, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
import Toast, {ToastConfig} from 'react-native-toast-message';

import Stack from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';

const toastConfig: ToastConfig = {
  customToast: ({text1}: {text1?: string}) => (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        width: Dimensions.get('window').width - 30,
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        borderWidth: 1,
        paddingVertical: 14,
        borderRadius: 18,
      }}>
      <Text
        style={{
          color: theme.colors.primaryText,
          fontFamily: theme.fontWeights.medium,
          fontSize: theme.typography.body.fontSize,
        }}>
        {text1}
      </Text>
    </View>
  ),
};
const App = () => {
  return (
    <GestureHandlerRootView>
      <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
        <StatusBar animated barStyle="light-content" backgroundColor={theme.colors.background} />
        <Stack />
        <Toast config={toastConfig} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;
