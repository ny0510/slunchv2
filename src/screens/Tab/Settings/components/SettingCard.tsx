import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import Content from './Content';
import Card from '@/components/Card';
import ToggleSwitch from '@/components/ToggleSwitch';
import {useTheme} from '@/contexts/ThemeContext';
import {RootStackParamList} from '@/navigation/RootStacks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const SettingCard = ({onClassChangePress}: {onClassChangePress: () => void}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {theme, typography} = useTheme();
  const [showAllergy, setShowAllergy] = useState(false);

  // Load allergy setting from AsyncStorage
  useEffect(() => {
    const loadAllergySetting = async () => {
      try {
        const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
        setShowAllergy(settings.showAllergy || false);
      } catch (error) {
        console.error('Error loading allergy setting:', error);
      }
    };
    loadAllergySetting();
  }, []);

  // Handle allergy toggle change
  const handleAllergyToggle = async (value: boolean) => {
    try {
      const settings = JSON.parse((await AsyncStorage.getItem('settings')) || '{}');
      settings.showAllergy = value;
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
      setShowAllergy(value);
    } catch (error) {
      console.error('Error saving allergy setting:', error);
    }
  };

  return (
    <Card title="앱 설정" titleStyle={{fontSize: typography.body.fontSize}}>
      <View style={{gap: 8, marginTop: 8}} pointerEvents="box-none">
        <Content title="학교 변경" arrow onPress={() => navigation.navigate('SchoolSearch', {isFirstOpen: false})} />
        <Content title="학급 변경" arrow onPress={onClassChangePress} />
        <Content title="알림 설정" arrow onPress={() => navigation.navigate('Notification')} />
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2}}>
          <Text style={[typography.body, {color: theme.primaryText}]}>알레르기 정보 표시</Text>
          <ToggleSwitch value={showAllergy} onValueChange={handleAllergyToggle} />
        </View>
      </View>
    </Card>
  );
};

export default SettingCard;
