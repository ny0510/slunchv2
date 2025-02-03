import React, {ReactNode, createContext, useContext} from 'react';

import {theme} from '@/styles/theme';
import {Theme} from '@/types/theme';

interface Props {
  children: ReactNode;
}

const ThemeContext = createContext<Theme>(theme);

const ThemeProvider = ({children}: Props) => <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;

const useTheme = (): Theme => useContext(ThemeContext);

export {ThemeProvider, useTheme};
