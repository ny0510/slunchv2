import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

interface Props {
  scrollView?: boolean;
  bounceVertical?: boolean;
  bounceHorizontal?: boolean;
  children: React.ReactNode;
}

const Container = ({scrollView = false, bounceVertical = false, bounceHorizontal = false, children}: Props) => {
  if (scrollView) {
    return (
      <ScrollView contentContainerStyle={s.container} alwaysBounceVertical={bounceVertical} alwaysBounceHorizontal={bounceHorizontal}>
        {children}
      </ScrollView>
    );
  }
  return <View style={s.container}>{children}</View>;
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default Container;
