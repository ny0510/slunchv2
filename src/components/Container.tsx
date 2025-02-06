import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

interface Props {
  scrollView?: boolean;
  bounceVertical?: boolean;
  bounceHorizontal?: boolean;
  children: React.ReactNode;
}

const Container = ({scrollView = false, bounceVertical = false, children}: Props) => {
  if (scrollView) {
    return (
      <ScrollView contentContainerStyle={s.container} bounces={bounceVertical}>
        {children}
      </ScrollView>
    );
  }
  return <View style={s.container}>{children}</View>;
};

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default Container;
