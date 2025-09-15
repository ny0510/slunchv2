import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

interface Props {
  scrollView?: boolean;
  bounce?: boolean;
  style?: {};
  children: React.ReactNode;
}

const Container = ({scrollView = false, bounce = false, style, children, ...rest}: Props & {[key: string]: any}) => {
  if (scrollView) {
    return (
      <ScrollView ref={rest.scrollViewRef} contentContainerStyle={[s.container, style]} bounces={bounce} keyboardShouldPersistTaps="never" scrollEventThrottle={16} nestedScrollEnabled={true} scrollIndicatorInsets={{right: 1}} removeClippedSubviews={false} {...rest}>
        {children}
      </ScrollView>
    );
  }
  return (
    <View style={[s.container, style]} {...rest}>
      {children}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default Container;
