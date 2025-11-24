import React from 'react';
import { View } from 'react-native';

import { Button } from './Button';
import Icon from './Icon';
import ThemedText from './ThemedText';

import { useThemeColors } from '@/contexts/ThemeColors';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry: () => void;
  retryButtonText?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryButtonText = 'Try Again',
}: ErrorStateProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center px-global py-8">
      {/* Error Icon */}
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.error + '20' }}>
        <Icon name="AlertCircle" size={32} color={colors.error} />
      </View>

      {/* Title */}
      <ThemedText className="mb-2 text-center text-xl font-bold">{title}</ThemedText>

      {/* Message */}
      <ThemedText className="text-text-muted mb-6 max-w-sm text-center text-base">
        {message}
      </ThemedText>

      {/* Retry Button */}
      <Button onPress={onRetry} className="min-w-[140px]">
        <View className="flex-row items-center justify-center">
          <Icon name="RefreshCw" size={18} color={colors.background} style={{ marginRight: 8 }} />
          <ThemedText className="font-semibold text-white">{retryButtonText}</ThemedText>
        </View>
      </Button>
    </View>
  );
}
