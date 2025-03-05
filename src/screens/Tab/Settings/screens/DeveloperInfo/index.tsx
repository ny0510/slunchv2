import React from 'react';
import {ImageBackground, Text, View} from 'react-native';

import Card from '@/components/Card';
import Container from '@/components/Container';
import {theme} from '@/styles/theme';

const DeveloperCard = ({name, role, profileImage}: {name: string; role: string; profileImage?: string}) => (
  <View style={{flexDirection: 'row', alignContent: 'center', gap: 12}}>
    <ImageBackground src={profileImage || 'https://f.ny64.kr/slunchv2/defaultProfile.png'} style={{width: 48, height: 48, backgroundColor: theme.colors.border, borderRadius: 48 / 2}} borderRadius={48 / 2} />
    <View style={{justifyContent: 'center', gap: 4}}>
      <Text style={[theme.typography.body, {fontFamily: theme.fontWeights.semiBold}]}>{name}</Text>
      <Text style={[theme.typography.caption, {color: theme.colors.secondaryText}]}>{role}</Text>
    </View>
  </View>
);

const DeveloperCardList = ({title, developers}: {title: string; developers: {name: string; role: string; profileImage?: string}[]}) => (
  <Card title={title} titleStyle={{fontSize: theme.typography.body.fontSize}}>
    <View style={{gap: 16, marginTop: 8}}>
      {developers.map((developer, index) => (
        <DeveloperCard key={index} {...developer} />
      ))}
    </View>
  </Card>
);

const DeveloperInfo = () => {
  const data = {
    developers: [{name: '김가온', role: 'Frontend, Backend', profileImage: 'https://f.ny64.kr/slunchv2/ny64.png'}],
    specialThanks: [{name: '설지원', role: 'Some Backend, Server and more', profileImage: 'https://f.ny64.kr/slunchv2/misile.png'}],
  };

  return (
    <Container scrollView bounce style={{gap: 8}}>
      <DeveloperCardList title="개발자" developers={data.developers} />
      <DeveloperCardList title="Special Thanks" developers={data.specialThanks} />
    </Container>
  );
};

export default DeveloperInfo;
