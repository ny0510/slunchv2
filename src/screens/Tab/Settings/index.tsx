import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import AppInfoCard from './components/AppInfoCard';
import DeveloperSettingCard from './components/DeveloperSettingCard';
import MyInfoCard from './components/MyInfoCard';
import ProfileSection from './components/ProfileSection';
import SettingCard from './components/SettingCard';
import Container from '@/components/Container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';

const Settings = () => {
  const [developerOptions, setDeveloperOptions] = useState(false);
  useEffect(() => {
    analytics().logScreenView({screen_name: '설정 페이지', screen_class: 'Settings'});
    AsyncStorage.getItem('developerOptions').then(val => setDeveloperOptions(!!JSON.parse(val ?? 'false')));
  }, []);

  return (
    <Container scrollView bounce>
      <View style={{gap: 18, width: '100%', marginVertical: 16}}>
        <ProfileSection />
        <View style={{gap: 8}}>
          <SettingCard />
          <MyInfoCard />
          <AppInfoCard onDeveloperOptionsEnabled={enabled => setDeveloperOptions(enabled)} />
          {developerOptions && <DeveloperSettingCard />}
        </View>
      </View>
    </Container>
  );
};

export default Settings;
