import React from 'react';
import {Alert, View} from 'react-native';

import Content from './Content';
import Card from '@/components/Card';
import {useTheme} from '@/contexts/ThemeContext';
import {useFirstOpen} from '@/hooks/useFirstOpen';
import {RootStackParamList} from '@/navigation/RootStacks';
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

  const {typography} = useTheme();
  const {setFirstOpen} = useFirstOpen();

  return (
    <Card title="개발자 설정" titleStyle={{fontSize: typography.body.fontSize}}>
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
                  Alert.alert('캐시 삭제', '캐시가 삭제되었어요.', [{text: '확인'}]);
                },
              },
            ]);
          }}
        />
        <Content
          title="앱 데이터 삭제"
          arrow
          onPress={async () => {
            Alert.alert('앱 데이터 삭제', '앱 데이터를 삭제하시겠습니까?', [
              {text: '아니요', style: 'cancel'},
              {
                text: '네',
                onPress: async () => {
                  await AsyncStorage.clear();
                  await setFirstOpen(true);
                  navigation.reset({routes: [{name: 'Intro'}]});
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
