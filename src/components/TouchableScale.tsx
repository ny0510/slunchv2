import React from 'react';
import {Animated, View} from 'react-native';

interface Props {
  pressInDuration?: number;
  pressOutDuration?: number;
  scaleTo?: number;
  pressInEasing?: (t: number) => number;
  pressOutEasing?: (t: number) => number;
  onPress?: (...args: any[]) => void;
  style?: object;
  children: React.ReactNode;
}

const TouchableScale = ({onPress, pressInDuration = 100, pressOutDuration = 100, scaleTo = 0.95, pressInEasing, pressOutEasing, style, children, ...rest}: Props & {[key: string]: any}) => {
  const scale = new Animated.Value(1);

  const onPressIn = () => {
    Animated.timing(scale, {
      toValue: scaleTo,
      duration: pressInDuration,
      useNativeDriver: true,
      easing: pressInEasing,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: pressOutDuration,
      useNativeDriver: true,
      easing: pressOutEasing,
    }).start();
  };

  return (
    <Animated.View style={{transform: [{scale}], ...style}} onTouchEnd={onPress} onTouchCancel={onPressOut} {...rest}>
      <View onTouchStart={onPressIn} onTouchEnd={onPressOut} onTouchCancel={onPressOut}>
        {children}
      </View>
    </Animated.View>
  );
};

export default TouchableScale;
