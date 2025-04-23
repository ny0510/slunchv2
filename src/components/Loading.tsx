import React from 'react';
import {ActivityIndicator, View} from 'react-native';

import {theme} from '@/styles/theme';

interface Props {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

const Loading = ({size = 'large', fullScreen = true, color = theme.colors.primaryText}: Props) => {
  return fullScreen ? (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size={size} color={color} />
    </View>
  ) : (
    <ActivityIndicator size={size} color={color} />
  );
};

export default Loading;
