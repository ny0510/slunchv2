import React, {useEffect, useState} from 'react';
import {TouchableWithoutFeedback, View} from 'react-native';

import AppInfoCard from './components/AppInfoCard';
import DeveloperSettingCard from './components/DeveloperSettingCard';
import MyInfoCard from './components/MyInfoCard';
import ProfileSection from './components/ProfileSection';
import SettingCard from './components/SettingCard';
import Container from '@/components/Container';
import {useIsFocused} from '@react-navigation/native';

const Settings = () => {
  const [isPressed, setIsPressed] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      setIsPressed(false);
    }
  }, [isFocused]);

  return (
    <Container scrollView bounce>
      <TouchableWithoutFeedback onPress={() => setIsPressed(false)}>
        <View style={{gap: 18, width: '100%', marginVertical: 16}}>
          <ProfileSection setIsPressed={setIsPressed} isPressed={isPressed} />
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
      </TouchableWithoutFeedback>
    </Container>
  );
};

// const Button = ({children, onPress}: {children: React.ReactNode; onPress: () => void}) => {
//   return <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;
// };

export default Settings;
