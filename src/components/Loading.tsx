import React from 'react';
import {ActivityIndicator, View} from 'react-native';

import {useTheme} from '@/contexts/ThemeContext';

interface Props {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

const Loading = ({size = 'large', fullScreen = true, color}: Props) => {
  const {theme} = useTheme();
  const defaultColor = theme.primaryText;

  return fullScreen ? (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size={size} color={color || defaultColor} />
    </View>
  ) : (
    <ActivityIndicator size={size} color={color || defaultColor} />
  );
};

export default Loading;
