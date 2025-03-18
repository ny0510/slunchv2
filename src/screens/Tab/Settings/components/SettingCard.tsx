import React from 'react';
import {View} from 'react-native';

import Content from './Content';
import Card from '@/components/Card';
import {RootStackParamList} from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const SettingCard = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <Card title="앱 설정" titleStyle={{fontSize: theme.typography.body.fontSize}}>
      <View style={{gap: 8, marginTop: 8}}>
        <Content title="학급 정보 변경" arrow onPress={() => navigation.navigate('SchoolSearch', {isFirstOpen: false})} />
        <Content title="알림 설정" arrow onPress={() => navigation.navigate('Notification')} />
        <Content title="위젯 추가" arrow onPress={() => navigation.navigate('Widget')} />
      </View>
    </Card>
  );
};

export default SettingCard;
