import { TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Text, Pressable, View, Animated } from 'react-native';

import Icon, { IconName } from '@/components/Icon';
import { useScrollToTop } from '@/contexts/ScrollToTopContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export type TabButtonProps = TabTriggerSlotProps & {
  icon?: IconName;
  labelAnimated?: boolean;
};

export const TabButton = forwardRef<View, TabButtonProps>(
  ({ icon, children, isFocused, onPress, href, labelAnimated = true, ...props }, ref) => {
    const colors = useThemeColors();
    const { scrollToTop } = useScrollToTop();
    const lastTapTime = useRef<number>(0);
    const DOUBLE_TAP_DELAY = 300; // ms

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

    const handlePress = (e: any) => {
      const now = Date.now();
      const isDoubleTap = now - lastTapTime.current < DOUBLE_TAP_DELAY;
      lastTapTime.current = now;

      if (isFocused && isDoubleTap) {
        // Double tap on active tab - scroll to top
        e.preventDefault?.();
        e.stopPropagation?.();
        const path = typeof href === 'string' ? href : '/';
        scrollToTop(path);
        return;
      }

      if (isFocused) {
        // Single tap on active tab - do nothing (wait for potential double tap)
        e.preventDefault?.();
        e.stopPropagation?.();
        return;
      }

      // Tab is not active, proceed with navigation
      onPress?.(e);
    };

    return (
      <Pressable className="w-1/5 overflow-hidden" ref={ref} {...props} onPress={handlePress}>
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
              <Text className="mt-px text-[9px] text-highlight">{children}</Text>
            </Animated.View>
          ) : (
            <Text className="mt-px text-[9px]" style={{ color: colors.text }}>
              {children}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }
);
