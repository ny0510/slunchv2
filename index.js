import dayjs from 'dayjs';
import React, {useEffect} from 'react';
import {AppRegistry, Platform} from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {PERMISSIONS, RESULTS, check, request} from 'react-native-permissions';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {enableScreens} from 'react-native-screens';
import {showSplash} from 'react-native-splash-view';

import {name as appName} from './app.json';
import App from '@/App';
import {ThemeProvider} from '@/contexts/ThemeContext';
import notifee from '@notifee/react-native';
import analytics from '@react-native-firebase/analytics';
import 'dayjs/locale/ko';

global.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

const Root = ({isHeadless}) => {
  showSplash();
  enableScreens();
  dayjs.locale('ko');

  if (Platform.OS === 'android') {
    changeNavigationBarColor('transparent', true);
  }

  useEffect(() => {
    async () => {
      const result = await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
      if (result === RESULTS.DENIED) {
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
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

AppRegistry.registerComponent(appName, () => Root);
