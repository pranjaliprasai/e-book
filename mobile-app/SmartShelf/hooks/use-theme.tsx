import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Themes, ThemeType, ThemeColors } from '../components/constants/Themes';

type ThemeContextType = {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('green');

  useEffect(() => {
    // Load saved theme
    AsyncStorage.getItem('user_theme').then(savedTheme => {
      if (savedTheme && (savedTheme === 'green' || savedTheme === 'pink' || savedTheme === 'brown' || savedTheme === 'yellow')) {
        setThemeState(savedTheme as ThemeType);
      }
    });
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    AsyncStorage.setItem('user_theme', newTheme);
  };

  const value = {
    theme,
    colors: Themes[theme],
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
