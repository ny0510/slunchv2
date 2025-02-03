import React from 'react';
import {AppRegistry, Text, TextInput} from 'react-native';
import {setCustomImage, setCustomText, setCustomTouchableOpacity} from 'react-native-global-props';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {name as appName} from './app.json';
import App from '@/App';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.autoCorrect = false;
TextInput.defaultProps.allowFontScaling = false;

const Root = () => {
  setCustomText({
    style: {
      fontFamily: 'Pretendard-Regular',
      includeFontPadding: false,
      fontSize: 16,
    },
  });
  setCustomImage({resizeMode: 'cover'});
  setCustomTouchableOpacity({
    activeOpacity: 0.85,
    hitSlop: {top: 10, bottom: 10, left: 10, right: 10},
  });

  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
};

AppRegistry.registerComponent(appName, () => Root);
