import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Reanimated, {Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';

interface Props {
  emojis?: string[];
  emojiHeight?: number;
  delay?: number;
  duration?: number;
}

const EmojiSlotMachine = ({emojis = ['🍔', '🍕', '🍟', '🍦', '🍩'], emojiHeight = 45, delay = 1500, duration = 500}: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useSharedValue(-emojiHeight);

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
    setCurrentIndex(prev => (prev - 1 + emojis.length) % emojis.length);
    translateY.value = -emojiHeight;
    setTimeout(animateStep, delay);
  };

  useEffect(() => {
    animateStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevIndex = (currentIndex - 1 + emojis.length) % emojis.length;
  const nextIndex = (currentIndex + 1) % emojis.length;

  const s = StyleSheet.create({
    container: {
      height: emojiHeight,
      overflow: 'hidden',
    },
    emoji: {
      fontSize: 32,
      textAlign: 'center',
      height: emojiHeight,
      lineHeight: emojiHeight,
    },
  });

  return (
    <View style={s.container}>
      <Reanimated.View style={[animatedStyle]}>
        <Text style={s.emoji}>{emojis[prevIndex]}</Text>
        <Text style={s.emoji}>{emojis[currentIndex]}</Text>
        <Text style={s.emoji}>{emojis[nextIndex]}</Text>
      </Reanimated.View>
    </View>
  );
};

export default EmojiSlotMachine;
