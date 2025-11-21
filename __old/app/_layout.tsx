import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from './contexts/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import useThemeColors from './contexts/ThemeColors';

export default function RootLayout() {
  const colors = useThemeColors();
  return (
    <GestureHandlerRootView className={`bg-background  ${Platform.OS === 'ios' ? 'pb-0 ' : ''}`} style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
