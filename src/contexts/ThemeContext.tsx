import React, {createContext, useContext, useEffect, useState} from 'react';
import {useColorScheme} from 'react-native';

import {darkTheme, lightTheme} from '@/theme';
import Palette from '@/theme/types/Palette';
import TextStyles from '@/theme/types/TextStyles';
import Typography from '@/theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext<{
  theme: Palette;
  isDark: boolean;
  typography: TextStyles;
  toggleTheme: () => void;
}>({
  theme: lightTheme,
  isDark: false,
  typography: Typography,
  toggleTheme: () => {},
});

export const ThemeProvider = ({children}: {children: React.ReactNode}) => {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        setIsDark(storedTheme === 'dark');
      } else {
        setIsDark(systemTheme === 'dark');
      }
    };
    loadTheme();
  }, [systemTheme]);

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return <ThemeContext.Provider value={{theme, isDark, typography: Typography, toggleTheme}}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
