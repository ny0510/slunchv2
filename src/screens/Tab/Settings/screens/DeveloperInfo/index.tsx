import {API_BASE_URL} from '@env';
import React from 'react';
import {ImageBackground, Text, View} from 'react-native';

import Card from '@/components/Card';
import Container from '@/components/Container';
import {useTheme} from '@/contexts/ThemeContext';

const DeveloperCard = ({name, role, profileImage}: {name: string; role: string; profileImage?: string}) => {
  const {theme, typography} = useTheme();

  return (
    <View style={{flexDirection: 'row', alignContent: 'center', gap: 10}}>
      <ImageBackground src={profileImage || `${API_BASE_URL}/public/default_profile.png`} style={{width: 48, height: 48, backgroundColor: theme.border, borderRadius: 48 / 2}} borderRadius={48 / 2} />
      <View style={{justifyContent: 'center', gap: 4}}>
        <Text style={[typography.body, {color: theme.primaryText, fontWeight: '600'}]}>{name}</Text>
        <Text style={[typography.caption, {color: theme.secondaryText}]}>{role}</Text>
      </View>
    </View>
  );
};

const DeveloperCardList = ({title, developers}: {title: string; developers: {name: string; role: string; profileImage?: string}[]}) => {
  const {typography} = useTheme();

  return (
    <Card title={title} titleStyle={{fontSize: typography.body.fontSize}}>
      <View style={{gap: 16, marginTop: 8}}>
        {developers.map((developer, index) => (
          <DeveloperCard key={index} {...developer} />
        ))}
      </View>
    </Card>
  );
};

const DeveloperInfo = () => {
  const data = {
    developers: [{name: '김가온 (118기)', role: 'Frontend, Backend', profileImage: `${API_BASE_URL}/public/ny64.png`}],
    specialThanks: [{name: '설지원 (118기)', role: 'Backend, CI / CD', profileImage: `${API_BASE_URL}/public/misile.png`}],
  };

  return (
    <Container scrollView bounce style={{gap: 8}}>
      <DeveloperCardList title="개발자" developers={data.developers} />
      <DeveloperCardList title="Special Thanks" developers={data.specialThanks} />
    </Container>
  );
};

export default DeveloperInfo;
