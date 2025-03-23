import React from 'react';
import {ActivityIndicator, View} from 'react-native';

import {theme} from '@/styles/theme';

interface Props {
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

const Loading = ({size = 'large', fullScreen = true}: Props) => {
  return fullScreen ? (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size={size} color={theme.colors.primaryText} />
    </View>
  ) : (
    <ActivityIndicator size={size} color={theme.colors.primaryText} />
  );
};

export default Loading;
