import React from 'react';
import {View} from 'react-native';

import Content from './Content';
import Card from '@/components/Card';
import {useTheme} from '@/contexts/ThemeContext';
import {RootStackParamList} from '@/navigation/RootStacks';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const SettingCard = ({onClassChangePress}: {onClassChangePress: () => void}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {typography} = useTheme();

  return (
    <Card title="앱 설정" titleStyle={{fontSize: typography.body.fontSize}}>
      <View style={{gap: 8, marginTop: 8}}>
        <Content title="학교 변경" arrow onPress={() => navigation.navigate('SchoolSearch', {isFirstOpen: false})} />
        <Content title="학급 변경" arrow onPress={onClassChangePress} />
        <Content title="알림 설정" arrow onPress={() => navigation.navigate('Notification')} />
      </View>
    </Card>
  );
};

export default SettingCard;
