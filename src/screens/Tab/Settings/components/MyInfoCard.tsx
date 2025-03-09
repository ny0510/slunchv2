import React from 'react';
import {View} from 'react-native';

import Content from './Content';
import Card from '@/components/Card';
import {useUser} from '@/hooks/useUser';
import {useAuth} from '@/providers/AuthProvider';
import {theme} from '@/styles/theme';

const AppInfoCard = () => {
  const user = useUser();
  const {user: authUser} = useAuth();

  return (
    <Card title="내 정보" titleStyle={{fontSize: theme.typography.body.fontSize}}>
      <View style={{gap: 8, marginTop: 8}}>
        <Content title="학교" content={user.schoolInfo.schoolName} />
        <Content title="학급" content={`${user.classInfo.grade}학년 ${user.classInfo.class}반`} />
        <Content title="이메일" content={authUser ? authUser?.user.email : '로그인해 주세요'} />
      </View>
    </Card>
  );
};

export default AppInfoCard;
