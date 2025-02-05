import React from 'react';
import {ScrollView, StyleSheet, Text} from 'react-native';

import {theme} from '@/styles/theme';

const SchoolCard = () => {
  return (
    <ScrollView contentContainerStyle={[styles.container]}>
      <Text style={[theme.typography.title, {color: theme.colors.primaryText}]}>학생증</Text>
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

export default SchoolCard;
