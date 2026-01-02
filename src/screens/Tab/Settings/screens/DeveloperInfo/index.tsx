import { API_BASE_URL } from '@env';
import React, { useRef } from 'react';
import { ImageBackground, Text, View, Pressable } from 'react-native';

import Card from '@/components/Card';
import Container from '@/components/Container';
import { useTheme } from '@/contexts/ThemeContext';

const DeveloperCard = ({ name, role, profileImage, isFurry }: { name: string; role: string; profileImage?: string; isFurry?: boolean }) => {
  const { theme, typography, setThemeMode } = useTheme();
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleProfileTap = () => {
    if (!isFurry) return;

    tapCountRef.current += 1;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    if (tapCountRef.current >= 5) {
      setThemeMode('kawaii');
      tapCountRef.current = 0;
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 1000);
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignContent: 'center', gap: 10 }}>
      <Pressable onPress={handleProfileTap}>
        <ImageBackground src={profileImage || `${API_BASE_URL}/public/default_profile.png`} style={{ width: 48, height: 48, backgroundColor: theme.border, borderRadius: 48 / 2 }} borderRadius={48 / 2} />
      </Pressable>
      <View style={{ justifyContent: 'center', gap: 4 }}>
        <Text style={[typography.body, { color: theme.primaryText, fontWeight: '600' }]}>{name}</Text>
        <Text style={[typography.caption, { color: theme.secondaryText }]}>{role}</Text>
      </View>
    </View>
  );
};

const DeveloperCardList = ({ title, developers, furry }: { title: string; developers: { name: string; role: string; profileImage?: string }[]; furry?: (name: string) => boolean }) => {
  const { typography } = useTheme();

  return (
    <Card title={title} titleStyle={{ fontSize: typography.body.fontSize }}>
      <View style={{ gap: 16, marginTop: 8 }}>
        {developers.map((developer, index) => (
          <DeveloperCard key={index} {...developer} isFurry={furry ? furry(developer.name) : false} />
        ))}
      </View>
    </Card>
  );
};

const DeveloperInfo = () => {
  const data = {
    developers: [
      { name: '김가온 (118기)', role: 'Frontend, Backend', profileImage: `${API_BASE_URL}/public/ny64.png` },
      { name: '남현석', role: 'Frontend, Backend', profileImage: `${API_BASE_URL}/public/imnyang.webp` },
    ],
    specialThanks: [{ name: '설지원 (118기)', role: 'Backend, CI / CD', profileImage: `${API_BASE_URL}/public/misile.png` }],
  };

  const isFurry = (name: string) => name.includes('남현석');

  return (
    <Container scrollView bounce style={{ gap: 8 }}>
      <DeveloperCardList title="개발자" developers={data.developers} furry={isFurry} />
      <DeveloperCardList title="Special Thanks" developers={data.specialThanks} furry={isFurry} />
    </Container>
  );
};

export default DeveloperInfo;
