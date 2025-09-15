import React, {useCallback, useRef, useState} from 'react';
import {Animated, View, ViewProps, ViewStyle} from 'react-native';

import {ANIMATION_DURATION, OPACITY} from '@/theme/constants';

interface TouchableScaleProps extends Omit<ViewProps, 'onPress'> {
  /** 터치 시작시 애니메이션 지속시간 (ms) */
  pressInDuration?: number;
  /** 터치 종료시 애니메이션 지속시간 (ms) */
  pressOutDuration?: number;
  /** 터치시 스케일 값 (0.0 ~ 1.0) */
  scaleTo?: number;
  /** 터치 시작시 이징 함수 */
  pressInEasing?: (t: number) => number;
  /** 터치 종료시 이징 함수 */
  pressOutEasing?: (t: number) => number;
  /** 스타일 */
  style?: ViewStyle;
  /** 자식 컴포넌트 */
  children: React.ReactNode;
  /** 터치 이벤트 핸들러 */
  onPress?: () => void;
  /** 중복 터치 방지 시간 (ms) */
  debounceTime?: number;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 접근성 라벨 */
  accessibilityLabel?: string;
  /** 접근성 역할 */
  accessibilityRole?: 'button' | 'none';
}

const TouchableScale = ({
  onPress,
  pressInDuration = ANIMATION_DURATION.fast,
  pressOutDuration = ANIMATION_DURATION.fast,
  scaleTo = 0.95,
  pressInEasing,
  pressOutEasing,
  style,
  children,
  debounceTime = 300,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  ...rest
}: TouchableScaleProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);
  const lastPressTime = useRef(0);

  const onPressIn = useCallback(() => {
    if (disabled) return;

    setIsPressed(true);
    Animated.timing(scale, {
      toValue: scaleTo,
      duration: pressInDuration,
      useNativeDriver: true,
      easing: pressInEasing,
    }).start();
  }, [disabled, scale, scaleTo, pressInDuration, pressInEasing]);

  const onPressOut = useCallback(() => {
    setIsPressed(false);
    Animated.timing(scale, {
      toValue: 1,
      duration: pressOutDuration,
      useNativeDriver: true,
      easing: pressOutEasing,
    }).start();
  }, [scale, pressOutDuration, pressOutEasing]);

  const handlePress = useCallback(() => {
    if (disabled || !onPress) return;

    const now = Date.now();
    if (now - lastPressTime.current < debounceTime) {
      return;
    }
    lastPressTime.current = now;

    onPress();
  }, [disabled, onPress, debounceTime]);

  const handleTouchEnd = useCallback(() => {
    onPressOut();
    if (isPressed) {
      handlePress();
    }
  }, [onPressOut, isPressed, handlePress]);

  return (
    <Animated.View
      style={[
        {
          transform: [{scale}],
          opacity: disabled ? OPACITY.disabled : 1,
        },
        style,
      ]}
      onTouchStart={onPressIn}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={onPressOut}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{disabled}}
      {...rest}>
      <View pointerEvents={disabled ? 'none' : 'auto'}>{children}</View>
    </Animated.View>
  );
};

export default TouchableScale;
