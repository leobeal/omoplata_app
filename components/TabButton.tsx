import { useThemeColors } from '@/contexts/ThemeColors';
import { TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef, useEffect, useState } from 'react';
import { Text, Pressable, View, Animated } from 'react-native';
import Icon, { IconName } from '@/components/Icon';

export type TabButtonProps = TabTriggerSlotProps & {
  icon?: IconName;
  labelAnimated?: boolean;
};

export const TabButton = forwardRef<View, TabButtonProps>(
  ({ icon, children, isFocused, onPress, labelAnimated = true, ...props }, ref) => {
    const colors = useThemeColors();

    const [labelOpacity] = useState(new Animated.Value(isFocused ? 1 : 0));
    const [labelMarginBottom] = useState(new Animated.Value(isFocused ? 0 : 10));

    useEffect(() => {
      Animated.parallel([
        Animated.timing(labelOpacity, {
          toValue: isFocused ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(labelMarginBottom, {
          toValue: isFocused ? 0 : 10,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isFocused]);

    return (
      <Pressable
        className={`w-1/5 overflow-hidden ${isFocused ? '' : ''}`}
        ref={ref}
        {...props}
        onPress={onPress}>
        <View className="relative w-full flex-col items-center justify-center pb-0 pt-4">
          {icon && (
            <View className="relative">
              <View className={`relative w-full ${isFocused ? 'opacity-100' : 'opacity-40'}`}>
                <Icon
                  name={icon}
                  size={24}
                  strokeWidth={isFocused ? 2.5 : 2}
                  color={isFocused ? colors.highlight : colors.icon}
                />
              </View>
            </View>
          )}

          {labelAnimated ? (
            <Animated.View
              className="relative"
              style={{
                opacity: labelOpacity,
                transform: [{ translateY: labelMarginBottom }],
              }}>
              <Text className={`mt-px text-[9px] text-highlight`}>{children}</Text>
            </Animated.View>
          ) : (
            <Text className={`mt-px text-[9px]`} style={{ color: colors.text }}>
              {children}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }
);
