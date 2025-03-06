import React, {useEffect, useState} from 'react';
import {TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';

import AppInfoCard from './components/AppInfoCard';
import MyInfoCard from './components/MyInfoCard';
import ProfileSection from './components/ProfileSection';
import Card from '@/components/Card';
import Container from '@/components/Container';
import {RootStackParamList} from '@/navigation/RootStacks';
import {theme} from '@/styles/theme';
import {NavigationProp, useIsFocused, useNavigation} from '@react-navigation/native';

const Settings = () => {
  const [isPressed, setIsPressed] = useState(false);
  const isFocused = useIsFocused();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
          <Button onPress={() => navigation.navigate('SchoolSearch')}>
            <Card title="학교 정보 변경하기" arrow titleStyle={{fontSize: theme.typography.body.fontSize}} />
          </Button>
          <View style={{gap: 8}}>
            <MyInfoCard />
            <AppInfoCard />
            <Button onPress={() => navigation.navigate('DeveloperInfo')}>
              <Card title="갈려나간 사람들" arrow titleStyle={{fontSize: theme.typography.body.fontSize}} />
            </Button>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Container>
  );
};

const Button = ({children, onPress}: {children: React.ReactNode; onPress: () => void}) => {
  return <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;
};

export default Settings;
