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
  showTitle?: boolean; // For collapsible title behavior
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
  showTitle = true,
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
      className={`relative z-50 w-full bg-background px-6 pb-2 ${className}`}>
      <View className="h-14 flex-row items-center justify-between">
        {/* Left side - back button or left component */}
        <View className="z-10 min-w-[40px] flex-row items-center">
          {showBackButton && (
            <TouchableOpacity onPress={handleBackPress}>
              <Icon name="ArrowLeft" size={24} color={colors.icon} />
            </TouchableOpacity>
          )}
          {leftComponent}
        </View>

        {/* Center - title (absolutely positioned for true center) */}
        {title && (
          <View
            className="absolute inset-x-0 -z-10 items-center justify-center"
            style={{ height: 56 }}
            pointerEvents="none">
            <ThemedText className="text-lg font-semibold" style={{ opacity: showTitle ? 1 : 0 }}>
              {title}
            </ThemedText>
          </View>
        )}

        {/* Middle component (if provided, replaces title centering) */}
        {middleComponent && (
          <View className="flex-1 flex-row items-center justify-center">{middleComponent}</View>
        )}

        {/* Right side - right components */}
        <View className="z-10 min-w-[40px] flex-row items-center justify-end">
          {rightComponents.map((component, index) => (
            <View key={index} className="ml-4">
              {component}
            </View>
          ))}
        </View>
      </View>
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
