import React, {useEffect, useState} from 'react';
import {TouchableWithoutFeedback, View} from 'react-native';

import AppInfoCard from './components/AppInfoCard';
import DeveloperSettingCard from './components/DeveloperSettingCard';
import MyInfoCard from './components/MyInfoCard';
import ProfileSection from './components/ProfileSection';
import SettingCard from './components/SettingCard';
import Container from '@/components/Container';
import analytics from '@react-native-firebase/analytics';

const Settings = () => {
  useEffect(() => {
    analytics().logScreenView({screen_name: '설정 페이지', screen_class: 'Settings'});
  }, []);

  return (
    <Container scrollView bounce>
      <View style={{gap: 18, width: '100%', marginVertical: 16}}>
        <ProfileSection />
        <View style={{gap: 8}}>
          {/* <Button onPress={() => {}}>
              <Card title="알림 설정" arrow titleStyle={{fontSize: theme.typography.body.fontSize}} />
            </Button>
            <Button onPress={() => navigation.navigate('SchoolSearch')}>
              <Card title="학교 정보 변경하기" arrow titleStyle={{fontSize: theme.typography.body.fontSize}} />
            </Button> */}
          <SettingCard />
          <MyInfoCard />
          <AppInfoCard />
          <DeveloperSettingCard />
        </View>
      </View>
    </Container>
  );
};

// const Button = ({children, onPress}: {children: React.ReactNode; onPress: () => void}) => {
//   return <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;
// };

export default Settings;
