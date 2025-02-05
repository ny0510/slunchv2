import Home from '@/screens/Home';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

const BottomTabs = createBottomTabNavigator({
  initialRouteName: 'Home',
  screenOptions: {
    headerShown: false,
    animation: 'shift',
  },
  screens: {
    Home: Home,
  },
});

export default BottomTabs;
