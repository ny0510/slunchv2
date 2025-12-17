import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import Content from './Content';
import Card from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { appBuildNumber, appVersion, buildDate } from '@/lib/buildInfo';
import { showToast } from '@/lib/toast';
import { RootStackParamList } from '@/navigation/RootStacks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';

const AppInfoCard = ({ onDeveloperOptionsEnabled }: { onDeveloperOptionsEnabled?: (enabled: boolean) => void }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [_, setTapCount] = useState(0);
  const [developerOptions, setDeveloperOptions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { typography } = useTheme();

  useEffect(() => {
    AsyncStorage.getItem('developerOptions').then(val => setDeveloperOptions(!!JSON.parse(val ?? 'false')));
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleBuildNumberPress = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setTapCount(prev => {
      const newCount = prev + 1;
      if (newCount === 5) {
        const newValue = !developerOptions;
        AsyncStorage.setItem('developerOptions', newValue ? 'true' : 'false');
        setDeveloperOptions(newValue);
        if (onDeveloperOptionsEnabled) {
          onDeveloperOptionsEnabled(newValue);
        }
        showToast(newValue ? '개발자 옵션이 활성화되었습니다.' : '개발자 옵션이 비활성화되었습니다.');
        return 0;
      }
      return newCount;
    });

    timeoutRef.current = setTimeout(() => setTapCount(0), 1000);
  };

  const reportBug = async () => {
    const title = '[NYL 버그 및 건의사항] ';
    const body = `디바이스 정보:
OS: ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}
Device Name: ${await DeviceInfo.getDeviceName()}
Build Number: ${appBuildNumber}
App Version: ${appVersion}
Build Date: ${buildDate.format('YYYY년 M월 D일')}

=== 이 아래에 본문 내용을 작성해주세요. ===\n\n`;

    const emailData = {
      to: 'support@ny64.kr',
      subject: title,
      body: body,
    };

    Alert.alert('버그 및 건의사항 제보', '아래 중 하나를 선택해주세요.', [
      {
        text: '이메일로 보내기',
        onPress: () => Linking.openURL(`mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`),
      },
      {
        text: 'GitHub 이슈로 보내기',
        onPress: () => Linking.openURL(`https://github.com/NY0510/slunchv2/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(emailData.body)}&labels=bug`),
      },
      {
        text: '취소',
        style: 'cancel',
      },
    ]);
  };

  return (
    <Card title="앱 정보" titleStyle={{ fontSize: typography.body.fontSize }}>
      <View style={{ gap: 8, marginTop: 8 }}>
        <Content title="버전" content={appVersion} />
        <Content title="빌드 번호" content={appBuildNumber} onPress={handleBuildNumberPress} />
        <Content title="빌드 날짜" content={buildDate.format('YYYY년 M월 D일')} />
        {developerOptions && <Content title="React Native 버전" content={(({ major, minor, patch }) => `${major}.${minor}.${patch}`)(
          Platform.constants.reactNativeVersion
        )} />}
        <Content title="버그 및 건의사항" arrow onPress={reportBug} />
        <Content title="갈려나간 사람들" arrow onPress={() => navigation.navigate('DeveloperInfo')} />
      </View>
    </Card>
  );
};

export default AppInfoCard;
