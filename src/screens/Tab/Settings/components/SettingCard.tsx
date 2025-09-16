import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {Switch} from 'react-native-switch';

import Content from './Content';
import Card from '@/components/Card';
import {useTheme} from '@/contexts/ThemeContext';
import {STORAGE_KEYS, StorageHelper} from '@/lib/storage';
import {showToast} from '@/lib/toast';
import {RootStackParamList} from '@/navigation/RootStacks';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const SettingCard = ({onClassChangePress}: {onClassChangePress: () => void}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {theme, typography} = useTheme();
  const [showAllergy, setShowAllergy] = useState(true);

  useEffect(() => {
    // 설정 불러오기
    const loadSettings = async () => {
      const settings = await StorageHelper.getItem<{showAllergy?: boolean}>(STORAGE_KEYS.SETTINGS, {});
      setShowAllergy(settings.showAllergy ?? true);
    };
    loadSettings();
  }, []);

  const handleAllergyToggle = async (value: boolean) => {
    setShowAllergy(value);
    const settings = await StorageHelper.getItem<{showAllergy?: boolean}>(STORAGE_KEYS.SETTINGS, {});
    await StorageHelper.setItem(STORAGE_KEYS.SETTINGS, {...settings, showAllergy: value});
    showToast(value ? '알레르기 정보가 표시됩니다' : '알레르기 정보가 숨겨집니다');
  };

  return (
    <Card title="앱 설정" titleStyle={{fontSize: typography.body.fontSize}}>
      <View style={{gap: 8, marginTop: 8}}>
        <Content title="학교 변경" arrow onPress={() => navigation.navigate('SchoolSearch', {isFirstOpen: false})} />
        <Content title="학급 변경" arrow onPress={onClassChangePress} />
        <Content title="알림 설정" arrow onPress={() => navigation.navigate('Notification')} />

        {/* 알레르기 표시 토글 */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2}}>
          <Text style={[typography.body, {color: theme.primaryText}]}>알레르기 정보 표시</Text>
          <Switch
            value={showAllergy}
            onValueChange={handleAllergyToggle}
            circleSize={22}
            barHeight={22}
            circleBorderWidth={2}
            circleBorderActiveColor={theme.highlight}
            circleBorderInactiveColor={theme.border}
            backgroundActive={theme.highlight}
            backgroundInactive={theme.border}
            changeValueImmediately={true}
            renderActiveText={false}
            renderInActiveText={false}
            switchBorderRadius={20}
          />
        </View>
      </View>
    </Card>
  );
};

export default SettingCard;
