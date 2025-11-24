import { Pressable } from 'react-native';

import Icon from './Icon';

import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Pressable onPress={toggleTheme} className="p-2">
      <Icon name={isDark ? 'Sun' : 'Moon'} size={24} />
    </Pressable>
  );
};

export default ThemeToggle;
