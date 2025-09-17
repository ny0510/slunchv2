import React from 'react';
import {View} from 'react-native';

import Content from './Content';
import Card from '@/components/Card';
import {useAuth} from '@/contexts/AuthContext';
import {useTheme} from '@/contexts/ThemeContext';
import {UserClassInfo, UserSchoolInfo} from '@/types/user';

interface MyInfoCardProps {
  schoolInfo: UserSchoolInfo;
  classInfo: UserClassInfo;
}

const MyInfoCard = ({schoolInfo, classInfo}: MyInfoCardProps) => {
  const {user: authUser} = useAuth();

  const {typography} = useTheme();

  return (
    <Card title="내 정보" titleStyle={{fontSize: typography.body.fontSize}}>
      <View style={{gap: 8, marginTop: 8}}>
        <Content title="학교" content={schoolInfo.schoolName || '학교 정보 없음'} />
        <Content title="학급" content={classInfo.grade && classInfo.class ? `${classInfo.grade}학년 ${classInfo.class}반` : '학급 정보 없음'} />
        <Content title="이메일" content={authUser && authUser.email ? authUser.email : '로그인해 주세요'} />
      </View>
    </Card>
  );
};

export default MyInfoCard;
