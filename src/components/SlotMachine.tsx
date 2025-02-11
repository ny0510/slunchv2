import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Reanimated, {Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';

interface Props {
  list: string[];
  style?: object;
  height?: number;
  delay?: number;
  duration?: number;
}

const SlotMachine = ({list, height = 45, delay = 1500, duration = 500, style}: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useSharedValue(-height);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  const animateStep = () => {
    translateY.value = withTiming(0, {duration: duration, easing: Easing.ease}, finished => {
      if (finished) {
        runOnJS(handleAnimationEnd)();
      }
    });
  };

  const handleAnimationEnd = () => {
    setCurrentIndex(prev => (prev - 1 + list.length) % list.length);
    translateY.value = -height;
    setTimeout(animateStep, delay);
  };

  useEffect(() => {
    animateStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevIndex = (currentIndex - 1 + list.length) % list.length;
  const nextIndex = (currentIndex + 1) % list.length;

  const s = StyleSheet.create({
    container: {
      height: height,
      overflow: 'hidden',
    },
    emoji: {
      height: height,
      lineHeight: height,
      ...style,
    },
  });

  return (
    <View style={s.container}>
      <Reanimated.View style={[animatedStyle]}>
        <Text style={s.emoji}>{list[prevIndex]}</Text>
        <Text style={s.emoji}>{list[currentIndex]}</Text>
        <Text style={s.emoji}>{list[nextIndex]}</Text>
      </Reanimated.View>
    </View>
  );
};

export default SlotMachine;
