import React, {useRef} from 'react';
import {Animated, View} from 'react-native';

interface Props {
  pressInDuration?: number;
  pressOutDuration?: number;
  scaleTo?: number;
  pressInEasing?: (t: number) => number;
  pressOutEasing?: (t: number) => number;
  style?: object;
  children: React.ReactNode;
  onPress?: () => void;
}

const TouchableScale = ({onPress, pressInDuration = 100, pressOutDuration = 100, scaleTo = 0.95, pressInEasing, pressOutEasing, style, children, ...rest}: Props & {[key: string]: any}) => {
  const scale = useRef(new Animated.Value(1)).current;

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
    <Animated.View
      style={[{transform: [{scale}]}, style]}
      onTouchStart={onPressIn}
      onTouchEnd={() => {
        onPressOut();
        if (onPress) onPress();
      }}
      onTouchCancel={onPressOut}
      {...rest}>
      <View>{children}</View>
    </Animated.View>
  );
};

export default TouchableScale;
