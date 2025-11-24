import { router } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon, { IconName } from './Icon';
import ThemedText from './ThemedText';

import { useThemeColors } from '@/contexts/ThemeColors';

type HeaderProps = {
  title?: string;
  children?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponents?: React.ReactNode[];
  backgroundColor?: string;
  textColor?: string;
  leftComponent?: React.ReactNode;
  middleComponent?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
};

const Header: React.FC<HeaderProps> = ({
  title,
  children,
  showBackButton = false,
  onBackPress,
  rightComponents = [],
  leftComponent,
  middleComponent,
  className,
  style,
}) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[{ paddingTop: insets.top }, style]}
      className={`relative z-50 w-full flex-row justify-between bg-background px-6 pb-2 ${className}`}>
      {(showBackButton || leftComponent || title) && (
        <View className="flex-1 flex-row items-center">
          {showBackButton && (
            <TouchableOpacity onPress={handleBackPress} className="relative z-50 mr-6 py-4">
              <Icon name="ArrowLeft" size={24} color={colors.icon} />
            </TouchableOpacity>
          )}

          {leftComponent ||
            (title && (
              <View className="relative z-50 flex-row items-center py-4">
                {leftComponent}

                {title && <ThemedText className="text-lg font-bold">{title}</ThemedText>}
              </View>
            ))}
        </View>
      )}

      {middleComponent && (
        <View className="flex-1 flex-row items-center justify-center py-4">{middleComponent}</View>
      )}

      {rightComponents.length > 0 && (
        <View className="relative z-50 flex-1 flex-row items-center justify-end">
          {rightComponents.map((component, index) => (
            <View key={index} className="ml-6">
              {component}
            </View>
          ))}
        </View>
      )}
      {children}
    </View>
  );
};

export default Header;

type HeaderItemProps = {
  href?: string;
  icon: IconName;
  className?: string;
  hasBadge?: boolean;
  onPress?: () => void;
  isWhite?: boolean;
};

export const HeaderIcon = ({
  href,
  icon,
  hasBadge,
  onPress,
  className = '',
  isWhite = false,
}: HeaderItemProps) => (
  <TouchableOpacity
    onPress={onPress || (href ? () => router.push(href) : undefined)}
    className="overflow-visible">
    <View
      className={`relative h-7 w-7 flex-row items-center justify-center overflow-visible ${className}`}>
      {hasBadge && (
        <View className="absolute -right-[3px] -top-0 z-30 h-4 w-4 rounded-full border-2 border-background bg-red-500" />
      )}
      <Icon name={icon} size={25} color={isWhite ? 'white' : undefined} />
    </View>
  </TouchableOpacity>
);
