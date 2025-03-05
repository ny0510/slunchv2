import React, {useState} from 'react';
import {TouchableWithoutFeedback, View} from 'react-native';

import AppInfoCard from './components/AppInfoCard';
import MyInfoCard from './components/MyInfoCard';
import ProfileSection from './components/ProfileSection';
import Card from '@/components/Card';
import Container from '@/components/Container';
import {theme} from '@/styles/theme';

const Settings = () => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Container scrollView bounce>
      <TouchableWithoutFeedback onPress={() => setIsPressed(false)}>
        <View style={{gap: 18, width: '100%', marginTop: 16}}>
          <ProfileSection setIsPressed={setIsPressed} isPressed={isPressed} />
          <Card title="학교 정보 변경하기" arrow titleStyle={{fontSize: theme.typography.body.fontSize}} />
          <View style={{gap: 8}}>
            <MyInfoCard />
            <AppInfoCard />
            <Card title="갈려나간 사람들" arrow titleStyle={{fontSize: theme.typography.body.fontSize}} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Container>
  );
};

export default Settings;
