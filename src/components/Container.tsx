import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

interface Props {
  scrollView?: boolean;
  bounceVertical?: boolean;
  bounceHorizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  children: React.ReactNode;
}

const Container = ({scrollView = false, bounceVertical = false, showsVerticalScrollIndicator = false, showsHorizontalScrollIndicator = false, children}: Props) => {
  if (scrollView) {
    return (
      <ScrollView contentContainerStyle={s.container} bounces={bounceVertical} showsVerticalScrollIndicator={showsVerticalScrollIndicator} showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}>
        {children}
      </ScrollView>
    );
  }
  return <View style={s.container}>{children}</View>;
};

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 14,
  },
});

export default Container;
