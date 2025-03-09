import React from 'react';
import {View} from 'react-native';

import Content from './Content';
import Card from '@/components/Card';
import {appBuildNumber, appVersion, buildDate} from '@/lib/buildInfo';
import {RootStackParamList} from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const AppInfoCard = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <Card title="앱 정보" titleStyle={{fontSize: theme.typography.body.fontSize}}>
      <View style={{gap: 8, marginTop: 8}}>
        <Content title="버전" content={appVersion} />
        <Content title="빌드 번호" content={appBuildNumber} />
        <Content title="빌드 날짜" content={buildDate.format('YYYY년 M월 D일')} />
        <Content title="갈려나간 사람들" arrow onPress={() => navigation.navigate('DeveloperInfo')} />
      </View>
    </Card>
  );
};

export default AppInfoCard;
