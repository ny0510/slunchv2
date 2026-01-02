import React, {createContext, useContext, useEffect, useState} from 'react';
import {useColorScheme} from 'react-native';

import {darkTheme, lightTheme, kawaiiTheme} from '@/theme';
import Palette from '@/theme/types/Palette';
import TextStyles from '@/theme/types/TextStyles';
import Typography from '@/theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'kawaii';

const ThemeContext = createContext<{
  theme: Palette;
  isDark: boolean;
  typography: TextStyles;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}>({
  theme: lightTheme,
  isDark: false,
  typography: Typography,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider = ({children}: {children: React.ReactNode}) => {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === 'dark');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        setThemeModeState(storedTheme as ThemeMode);
        setIsDark(storedTheme === 'dark' || storedTheme === 'kawaii');
      } else {
        setIsDark(systemTheme === 'dark');
        setThemeModeState(systemTheme === 'dark' ? 'dark' : 'light');
      }
    };
    loadTheme();
  }, [systemTheme]);

  let theme: Palette;
  if (themeMode === 'kawaii') {
    theme = kawaiiTheme;
  } else {
    theme = isDark ? darkTheme : lightTheme;
  }

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    setThemeModeState(newIsDark ? 'dark' : 'light');
    await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('theme', mode);
    setIsDark(mode === 'dark' || mode === 'kawaii');
  };

  return <ThemeContext.Provider value={{theme, isDark, typography: Typography, toggleTheme, setThemeMode}}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
