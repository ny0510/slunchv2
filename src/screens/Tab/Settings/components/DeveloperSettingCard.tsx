import React from 'react';
import {Alert, View} from 'react-native';

import Content from './Content';
import Card from '@/components/Card';
import {RootStackParamList} from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const clearCache = async (prefix: string) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(prefix));

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }

    console.log('Cache cleared:', cacheKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

const DeveloperSettingCard = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <Card title="개발자 설정" titleStyle={{fontSize: theme.typography.body.fontSize}}>
      <View style={{gap: 8, marginTop: 8}}>
        <Content
          title="캐시 삭제"
          arrow
          onPress={() => {
            Alert.alert('캐시 삭제', '캐시를 삭제하시겠습니까?', [
              {
                text: '아니요',
                style: 'cancel',
              },
              {
                text: '네',
                onPress: async () => {
                  await clearCache('@cache/');
                  Alert.alert('캐시 삭제', '캐시가 삭제되었어요.');
                },
              },
            ]);
          }}
        />
      </View>
    </Card>
  );
};

export default DeveloperSettingCard;
