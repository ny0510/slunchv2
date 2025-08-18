import React, {useRef, useState} from 'react';
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
  debounceTime?: number;
  disabled?: boolean;
}

const TouchableScale = ({onPress, pressInDuration = 100, pressOutDuration = 100, scaleTo = 0.95, pressInEasing, pressOutEasing, style, children, debounceTime = 300, disabled = false, ...rest}: Props & {[key: string]: any}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);
  const lastPressTime = useRef(0);

  const onPressIn = () => {
    if (disabled) return;

    setIsPressed(true);
    Animated.timing(scale, {
      toValue: scaleTo,
      duration: pressInDuration,
      useNativeDriver: true,
      easing: pressInEasing,
    }).start();
  };

  const onPressOut = () => {
    setIsPressed(false);
    Animated.timing(scale, {
      toValue: 1,
      duration: pressOutDuration,
      useNativeDriver: true,
      easing: pressOutEasing,
    }).start();
  };

  const handlePress = () => {
    if (disabled || !onPress) return;

    const now = Date.now();
    if (now - lastPressTime.current < debounceTime) {
      return;
    }
    lastPressTime.current = now;

    onPress();
  };

  return (
    <Animated.View
      style={[{transform: [{scale}], opacity: disabled ? 0.5 : 1}, style]}
      onTouchStart={onPressIn}
      onTouchEnd={() => {
        onPressOut();
        if (isPressed) {
          handlePress();
        }
      }}
      onTouchCancel={onPressOut}
      {...rest}>
      <View pointerEvents={disabled ? 'none' : 'auto'}>{children}</View>
    </Animated.View>
  );
};

export default TouchableScale;
