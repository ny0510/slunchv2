import React from 'react';
import {ScrollView, StyleSheet, Text} from 'react-native';

import {theme} from '@/styles/theme';

const Timetable = () => {
  return (
    <ScrollView contentContainerStyle={[styles.container]} bounces={false}>
      <Text style={[theme.typography.subtitle, {color: theme.colors.primaryText}]}>🚧 아직 준비 중인 기능이에요</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Timetable;
