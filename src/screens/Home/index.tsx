import React from 'react';
import {Button, ScrollView, StyleSheet, Text} from 'react-native';

import {theme} from '@/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = () => {
  return (
    <ScrollView contentContainerStyle={[styles.container]}>
      <Text style={[theme.typography.title, {color: theme.colors.primaryText}]}>Home</Text>
      <Button
        title="Go to Onboarding"
        onPress={() => {
          AsyncStorage.setItem('isFirstOpen', 'true');
          console.log('isFirstOpen set to false');
        }}
      />
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

export default Home;
