import React from 'react';
import {View} from 'react-native';
import {WidgetPreview} from 'react-native-android-widget';

import Card from '@/components/Card';
import Container from '@/components/Container';
import {theme} from '@/styles/theme';
import {TimetableSingleWidget} from '@/widgets/TimetableWidget';

const Widget = () => {
  return (
    <Container scrollView bounce style={{gap: 8}}>
      <Card title="시간표" titleStyle={{fontSize: theme.typography.body.fontSize}}>
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
          <WidgetPreview renderWidget={() => <TimetableSingleWidget />} height={90} width={350} />
        </View>
      </Card>
    </Container>
  );
};

export default Widget;
