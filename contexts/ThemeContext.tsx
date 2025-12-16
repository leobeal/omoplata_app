import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { colorScheme } from 'nativewind';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, useColorScheme } from 'react-native';

import { themes } from '@/utils/color-theme';

const THEME_STORAGE_KEY = '@app_theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  themeMode: 'system',
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Resolve actual theme based on mode
  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemColorScheme ?? 'dark') : themeMode;

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Apply theme to nativewind when resolved theme changes
  useEffect(() => {
    if (isLoaded) {
      colorScheme.set(resolvedTheme);
    }
  }, [resolvedTheme, isLoaded]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Legacy toggle for backwards compatibility
  const toggleTheme = () => {
    const newMode = resolvedTheme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  // Don't render until theme is loaded - show dark background to avoid white flash
  if (!isLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#141414' }} />;
  }

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, themeMode, setThemeMode, toggleTheme }}>
      <StatusBar
        backgroundColor="transparent"
        translucent
        style={resolvedTheme === 'dark' ? 'light' : 'dark'}
      />
      <View style={themes[resolvedTheme]} className="flex-1 bg-background">
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
