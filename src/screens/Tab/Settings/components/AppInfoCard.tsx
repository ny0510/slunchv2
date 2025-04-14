import React from 'react';
import {Alert, Linking, View} from 'react-native';
import DeviceInfo from 'react-native-device-info';

import Content from './Content';
import Card from '@/components/Card';
import {appBuildNumber, appVersion, buildDate} from '@/lib/buildInfo';
import {RootStackParamList} from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const AppInfoCard = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
    <Card title="앱 정보" titleStyle={{fontSize: theme.typography.body.fontSize}}>
      <View style={{gap: 8, marginTop: 8}}>
        <Content title="버전" content={appVersion} />
        <Content title="빌드 번호" content={appBuildNumber} />
        <Content title="빌드 날짜" content={buildDate.format('YYYY년 M월 D일')} />
        <Content title="버그 및 건의사항" arrow onPress={reportBug} />
        <Content title="갈려나간 사람들" arrow onPress={() => navigation.navigate('DeveloperInfo')} />
      </View>
    </Card>
  );
};

export default AppInfoCard;
