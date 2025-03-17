import React, {useCallback, useEffect} from 'react';
import {Alert, BackHandler, Linking, Platform, StatusBar, ToastAndroid} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
import {hideSplash} from 'react-native-splash-view';
import Toast from 'react-native-toast-message';
import VersionCheck from 'react-native-version-check';

import {toastConfig} from './lib/toast';
import {sendNotification} from '@/lib/notification';
import Stack from '@/navigation/RootStacks';
import {AuthProvider} from '@/providers/AuthProvider';
import {theme} from '@/styles/theme';
import messaging from '@react-native-firebase/messaging';

let backPressedOnce = false;

const App = () => {
  useEffect(() => {
    setTimeout(() => {
      hideSplash();
    }, 250);
  }, []);

  const updateCheck = useCallback(async () => {
    const res = await VersionCheck.needUpdate({depth: 2});
    console.log(`Update needed: ${res.isNeeded}`);
    if (res.isNeeded) {
      Alert.alert(
        '새로운 버전이 출시되었습니다',
        '앱을 업데이트 해주세요',
        [
          {
            text: '업데이트',
            onPress: () => {
              Linking.openURL(res.storeUrl);
              setTimeout(updateCheck, 1000);
            },
          },
        ],
        {
          cancelable: false,
        },
      );
    }
  }, []);

  useEffect(() => {
    updateCheck();
  }, [updateCheck]);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log(`[FCM] Message received: ${JSON.stringify(remoteMessage)}`);
      const {title, body} = remoteMessage.notification ?? {};
      await sendNotification(title, body);
    });

    return unsubscribe;
  }, []);

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
