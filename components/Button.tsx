// components/Button.tsx
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Text, ActivityIndicator, TouchableOpacity, View } from 'react-native';

import Icon, { IconName } from './Icon';

import { useThemeColors } from '@/contexts/ThemeColors';
import { useNavigationLock } from '@/hooks/useNavigationLock';

type RoundedOption = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ButtonProps {
  title?: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  rounded?: RoundedOption;
  href?: string;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  icon?: IconName; // Alias for iconStart
  iconStart?: IconName;
  iconEnd?: IconName;
  iconSize?: number;
  iconColor?: string;
  iconClassName?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  size = 'medium',
  rounded = 'lg',
  href,
  className = '',
  textClassName = '',
  disabled = false,
  icon,
  iconStart,
  iconEnd,
  iconSize,
  iconColor,
  iconClassName = '',
  ...props
}) => {
  // icon is an alias for iconStart
  const startIcon = icon || iconStart;
  const colors = useThemeColors();
  const { withLock } = useNavigationLock();

  const handleNavigation = useCallback(
    withLock(() => {
      if (href) {
        router.push(href);
      }
    }),
    [href, withLock]
  );

  const handlePress = useCallback(
    withLock(() => {
      if (onPress) {
        onPress();
      }
    }),
    [onPress, withLock]
  );

  const buttonStyles = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'border border-border bg-transparent',
    ghost: 'bg-transparent',
  };

  const buttonSize = {
    small: 'py-2 min-h-[36px]',
    medium: 'py-3 min-h-[44px]',
    large: 'py-4 min-h-[52px]',
  };

  const roundedStyles = {
    none: 'rounded-none',
    xs: 'rounded-xs',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const getTextColor = () => {
    if (variant === 'outline' || variant === 'secondary' || variant === 'ghost') {
      return colors.text;
    }
    return colors.invert;
  };

  const disabledStyle = disabled ? 'opacity-50' : '';

  // Default icon sizes based on button size
  const getIconSize = () => {
    if (iconSize) return iconSize;

    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 18;
      case 'large':
        return 20;
      default:
        return 18;
    }
  };

  // Default icon color based on variant
  const getIconColor = () => {
    if (iconColor) return iconColor;

    return variant === 'outline' || variant === 'secondary' || variant === 'ghost'
      ? colors.text
      : colors.invert;
  };

  const getLoaderColor = () => {
    if (variant === 'outline' || variant === 'secondary' || variant === 'ghost') {
      return colors.primary;
    }
    return colors.invert;
  };

  const ButtonContent = (
    <View className="flex-row items-center justify-center">
      {loading ? (
        <ActivityIndicator size="small" color={getLoaderColor()} />
      ) : (
        <>
          {startIcon && (
            <Icon
              name={startIcon}
              size={getIconSize()}
              color={getIconColor()}
              className={`mr-2 ${iconClassName}`}
            />
          )}

          <Text className={`font-medium ${textClassName}`} style={{ color: getTextColor() }}>
            {title}
          </Text>

          {iconEnd && (
            <Icon
              name={iconEnd}
              size={getIconSize()}
              color={getIconColor()}
              className={`ml-2 ${iconClassName}`}
            />
          )}
        </>
      )}
    </View>
  );

  if (href) {
    return (
      <TouchableOpacity
        disabled={loading || disabled}
        activeOpacity={0.8}
        className={`relative px-4 ${buttonStyles[variant]} ${buttonSize[size]} ${roundedStyles[rounded]} items-center justify-center ${disabledStyle} ${className}`}
        {...props}
        onPress={handleNavigation}>
        {ButtonContent}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading || disabled}
      activeOpacity={0.8}
      className={`relative px-4 ${buttonStyles[variant]} ${buttonSize[size]} ${roundedStyles[rounded]} items-center justify-center ${disabledStyle} ${className}`}
      {...props}>
      {ButtonContent}
    </TouchableOpacity>
  );
};

export default Button;
