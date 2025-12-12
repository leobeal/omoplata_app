import { Link } from 'expo-router';
import React from 'react';
import { View, Pressable, ViewStyle, ActivityIndicator } from 'react-native';

import Icon, { IconName } from './Icon';
import ThemedText from './ThemedText';

import { useThemeColors } from '@/contexts/ThemeColors';

interface ListLinkProps {
  icon?: IconName;
  title: string;
  description?: string;
  href?: string;
  onPress?: () => void;
  showChevron?: boolean;
  className?: string;
  iconSize?: number;
  rightIcon?: IconName;
  disabled?: boolean;
  style?: ViewStyle;
  hasBorder?: boolean;
  isLoading?: boolean;
}

const ListLink: React.FC<ListLinkProps> = ({
  icon,
  title,
  description,
  href,
  onPress,
  showChevron = true,
  className = '',
  iconSize = 20,
  rightIcon = 'ChevronRight',
  disabled = false,
  style,
  hasBorder = false,
  isLoading = false,
}) => {
  const colors = useThemeColors();

  const Content = () => (
    <View
      className={`flex-row items-center py-5 ${className} ${disabled || isLoading ? 'opacity-50' : ''}`}
      style={style}>
      {icon && (
        <View className="mr-4">
          <Icon name={icon} size={iconSize} />
        </View>
      )}
      <View className="flex-1">
        <ThemedText className="text-lg font-semibold">{title}</ThemedText>
        {description && <ThemedText className="text-xs opacity-50">{description}</ThemedText>}
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : showChevron ? (
        <View className="opacity-20">
          <Icon name={rightIcon} size={20} />
        </View>
      ) : null}
    </View>
  );

  if (href && !disabled) {
    return (
      <Link href={href} asChild className={`${hasBorder ? 'border-b border-border' : ''}`}>
        <Pressable>
          <Content />
        </Pressable>
      </Link>
    );
  }

  return (
    <Pressable
      onPress={disabled || isLoading ? undefined : onPress}
      className={`${hasBorder ? 'border-b border-border' : ''}`}>
      <Content />
    </Pressable>
  );
};

export default ListLink;
