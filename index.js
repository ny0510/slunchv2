import dayjs from 'dayjs';
import React, {useEffect} from 'react';
import {AppRegistry, BackHandler, Platform, Text, TextInput, ToastAndroid} from 'react-native';
import {setCustomImage, setCustomText, setCustomTouchableOpacity} from 'react-native-global-props';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {enableScreens} from 'react-native-screens';
import {showSplash} from 'react-native-splash-view';

import {name as appName} from './app.json';
import App from '@/App';
import {theme} from '@/styles/theme';
import 'dayjs/locale/ko';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.autoCorrect = false;
TextInput.defaultProps.allowFontScaling = false;

let backPressedOnce = false;

const Root = () => {
  showSplash();
  enableScreens();
  changeNavigationBarColor('transparent', true);
  dayjs.locale('ko');

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        if (backPressedOnce) {
          BackHandler.exitApp();
          return true;
        }

        backPressedOnce = true;
        ToastAndroid.show('뒤로가기를 한 번 더 누르면 종료돼요.', ToastAndroid.SHORT);

        setTimeout(() => {
          backPressedOnce = false;
        }, 2000);

        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove();
    }
  }, []);

  setCustomText({
    style: {
      fontFamily: theme.fontWeights.regular,
      color: theme.colors.primaryText,
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
