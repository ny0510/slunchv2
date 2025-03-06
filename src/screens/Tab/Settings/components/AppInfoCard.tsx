import React from 'react';

import Content from './InfoContent';
import Card from '@/components/Card';
import {appBuildNumber, appVersion, buildDate} from '@/lib/buildInfo';
import {theme} from '@/styles/theme';

const AppInfoCard = () => {
  return (
    <Card title="앱 정보" titleStyle={{fontSize: theme.typography.body.fontSize}}>
      <Content title="빌드 날짜" content={buildDate.format('YYYY년 M월 D일')} />
      <Content title="빌드 번호" content={appBuildNumber} />
      <Content title="버전" content={appVersion} />
    </Card>
  );
};

export default AppInfoCard;
