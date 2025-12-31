import Constants from 'expo-constants';

import { useTheme } from './ThemeContext';

// Get highlight color from tenant config, fallback to default blue
const getHighlightColor = (): string => {
  return Constants.expoConfig?.extra?.theme?.primary || '#00A6F4';
};

export const useThemeColors = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    icon: isDark ? 'white' : 'black',
    bg: isDark ? '#141414' : '#F4F4F5',
    invert: isDark ? '#000000' : '#ffffff',
    secondary: isDark ? '#1F1E1F' : '#ffffff',
    state: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
    sheet: isDark ? '#262626' : '#ffffff',
    highlight: getHighlightColor(),
    lightDark: isDark ? '#262626' : 'white',
    border: isDark ? '#404040' : '#E2E8F0',
    text: isDark ? 'white' : 'black',
    subtext: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    placeholder: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    switch: isDark ? 'rgba(255,255,255,0.4)' : '#ccc',
    chatBg: isDark ? '#262626' : '#efefef',
    skeleton: isDark ? '#2A2A2A' : '#E5E5E5',
    warning: '#F59E0B',
    error: '#EF4444',
    success: '#10B981',
    isDark,
  };
};

export default useThemeColors;
