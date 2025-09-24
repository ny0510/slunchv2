import dayjs from 'dayjs';
import React, {useEffect} from 'react';
import {AppRegistry, Platform} from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {enableScreens} from 'react-native-screens';
import {showSplash} from 'react-native-splash-view';
import {getTrackingStatus, requestTrackingPermission} from 'react-native-tracking-transparency';

import {name as appName} from './app.json';
import App from '@/App';
import {ThemeProvider} from '@/contexts/ThemeContext';
import notifee from '@notifee/react-native';
import analytics from '@react-native-firebase/analytics';
import 'dayjs/locale/ko';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import relativeTime from 'dayjs/plugin/relativeTime';

global.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

const Root = ({isHeadless}) => {
  showSplash();
  enableScreens();

  dayjs.locale('ko');
  dayjs.extend(isSameOrAfter);
  dayjs.extend(relativeTime);

  if (Platform.OS === 'android') {
    changeNavigationBarColor('transparent', true);
  }

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'ios') {
        const state = await getTrackingStatus();

        if (state === 'not-determined') {
          const permission = await requestTrackingPermission();
          if (permission === 'authorized') {
            console.log('Tracking permission granted');
          } else {
            console.log('Tracking permission denied');
          }
        }
        if (state === 'denied') {
          console.log('Tracking permission denied');
        } else if (state === 'authorized') {
          console.log('Tracking permission granted');
        }
        if (state === 'restricted') {
          console.log('Tracking permission restricted');
        }
      }
    })();
  }, []);

  useEffect(() => {
    async () => {
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
