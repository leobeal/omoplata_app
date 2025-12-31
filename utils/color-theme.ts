import Constants from 'expo-constants';
import { vars } from 'nativewind';

// Get highlight color from tenant config, fallback to default blue
const highlightColor = Constants.expoConfig?.extra?.theme?.primary || '#00A6F4';

export const themes = {
  light: vars({
    '--color-primary': '#000000',
    '--color-invert': '#ffffff',
    '--color-secondary': '#ffffff',
    '--color-background': '#F4F4F5',
    '--color-darker': '#F4F4F5',
    '--color-text': '#000000',
    '--color-highlight': highlightColor,
    '--color-border': 'rgba(0, 0, 0, 0.1)',
  }),
  dark: vars({
    '--color-primary': '#ffffff',
    '--color-invert': '#000000',
    '--color-secondary': '#1F1E1F',
    '--color-background': '#141414',
    '--color-darker': '#000000',
    '--color-text': '#ffffff',
    '--color-highlight': highlightColor,
    '--color-border': 'rgba(255, 255, 255, 0.1)',
  }),
};
