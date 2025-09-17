import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Reanimated, {Easing, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<boolean>(true);

  list = list.sort(() => Math.random() - 0.5);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  const animateStep = useCallback(() => {
    if (!animationRef.current) return;

    translateY.value = withTiming(0, {duration: duration, easing: Easing.ease});

    // Use setTimeout to handle the animation completion
    setTimeout(() => {
      if (animationRef.current) {
        setCurrentIndex(prev => (prev - 1 + list.length) % list.length);
        translateY.value = -height;
        timeoutRef.current = setTimeout(animateStep, delay);
      }
    }, duration);
  }, [translateY, duration, height, delay, list.length]);

  useEffect(() => {
    // Start the animation
    timeoutRef.current = setTimeout(animateStep, delay);

    // Cleanup function to stop animation and clear timeout when component unmounts
    return () => {
      animationRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [animateStep, delay]);

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
