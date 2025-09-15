import React, {useEffect, useRef} from 'react';
import {Animated, View, ViewStyle} from 'react-native';

import {useTheme} from '@/contexts/ThemeContext';

interface SkeletonLoaderProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

const SkeletonLoader = ({width = '100%', height = 20, borderRadius = 4, style, children}: SkeletonLoaderProps) => {
  const {theme} = useTheme();
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnimation]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (children) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard = ({style}: {style?: ViewStyle}) => {
  const {theme} = useTheme();

  return (
    <View
      style={[
        {
          gap: 12,
        },
        style,
      ]}>
      <SkeletonLoader width="40%" height={24} />
      <View style={{gap: 8}}>
        <SkeletonLoader width="100%" height={16} />
        <SkeletonLoader width="80%" height={16} />
        <SkeletonLoader width="60%" height={16} />
      </View>
    </View>
  );
};

export const SkeletonList = ({count = 3}: {count?: number}) => {
  return (
    <View style={{gap: 12}}>
      {Array.from({length: count}).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
};

export default SkeletonLoader;
