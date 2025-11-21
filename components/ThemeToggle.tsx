import { Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Icon from './Icon';

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
