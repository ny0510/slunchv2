import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

interface Props {
  scrollView?: boolean;
  bounce?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  style?: {};
  children: React.ReactNode;
  refreshControl?: React.ReactElement; // added refreshControl prop
}

const Container = ({scrollView = false, bounce = false, showsVerticalScrollIndicator = false, showsHorizontalScrollIndicator = false, style, children, refreshControl}: Props) => {
  if (scrollView) {
    return (
      <ScrollView contentContainerStyle={[s.container, style]} bounces={bounce} showsVerticalScrollIndicator={showsVerticalScrollIndicator} showsHorizontalScrollIndicator={showsHorizontalScrollIndicator} refreshControl={refreshControl}>
        {children}
      </ScrollView>
    );
  }
  return <View style={[s.container, style]}>{children}</View>;
};

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 14,
  },
});

export default Container;
