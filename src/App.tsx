import React from 'react';
import {StatusBar} from 'react-native';

import Home from '@/screens/Home';
import Onboarding from '@/screens/Onboarding';
import {theme} from '@/styles/theme';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

const App = () => {
  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <StatusBar animated barStyle="light-content" backgroundColor={theme.colors.background} />
      <Stack.Navigator initialRouteName="Onboarding" screenOptions={{headerShown: false, animation: 'slide_from_right', cardStyle: {backgroundColor: theme.colors.background}}}>
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
