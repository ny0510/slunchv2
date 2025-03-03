import React from 'react';
import {Text, View} from 'react-native';

import {theme} from '@/styles/theme';

const Content = ({title, content}: {title: string; content: string}) => {
  return (
    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
      <Text style={theme.typography.body}>{title}</Text>
      <Text style={[theme.typography.body, {color: theme.colors.secondaryText}]}>{content}</Text>
    </View>
  );
};

export default Content;
