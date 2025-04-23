import dayjs from 'dayjs';
import React, {useEffect} from 'react';
import {AppRegistry, Text, TextInput} from 'react-native';
import {setCustomImage, setCustomText, setCustomTouchableOpacity} from 'react-native-global-props';
import mobileAds from 'react-native-google-mobile-ads';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {PERMISSIONS, RESULTS, check, request} from 'react-native-permissions';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {enableScreens} from 'react-native-screens';
import {showSplash} from 'react-native-splash-view';

import {name as appName} from './app.json';
import App from '@/App';
import {theme} from '@/styles/theme';
import notifee from '@notifee/react-native';
import analytics from '@react-native-firebase/analytics';
import 'dayjs/locale/ko';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.autoCorrect = false;
TextInput.defaultProps.allowFontScaling = false;
global.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

const Root = ({isHeadless}) => {
  showSplash();
  enableScreens();
  changeNavigationBarColor('transparent', true);
  dayjs.locale('ko');

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

  useEffect(() => {
    async () => {
      const result = await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
      if (result === RESULTS.DENIED) {
        // The permission has not been requested, so request it.
        await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
      }

      await mobileAds().setRequestConfiguration({testDeviceIdentifiers: ['EMULATOR']});
      const adapterStatuses = await mobileAds().initialize();
      console.log(`[AdMob] Adapter Statuses: ${JSON.stringify(adapterStatuses)}`);
    };
  }, []);

  useEffect(() => {
    notifee.getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        analytics().logEvent('notification_open', {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
        });
      }
    });
  }, []);

  if (isHeadless) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
};

// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   console.log(`[FCM] Message received in background: ${JSON.stringify(remoteMessage)}`);
//   const {title, body} = remoteMessage.notification ?? {};
//   await sendNotification(title, body);
// });

AppRegistry.registerComponent(appName, () => Root);
