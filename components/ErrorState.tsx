import React from 'react';
import { View } from 'react-native';
import ThemedText from './ThemedText';
import { Button } from './Button';
import Icon from './Icon';
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
        className="w-16 h-16 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: colors.error + '20' }}
      >
        <Icon name="AlertCircle" size={32} color={colors.error} />
      </View>

      {/* Title */}
      <ThemedText className="text-xl font-bold text-center mb-2">
        {title}
      </ThemedText>

      {/* Message */}
      <ThemedText className="text-base text-text-muted text-center mb-6 max-w-sm">
        {message}
      </ThemedText>

      {/* Retry Button */}
      <Button onPress={onRetry} className="min-w-[140px]">
        <View className="flex-row items-center justify-center">
          <Icon name="RefreshCw" size={18} color={colors.background} style={{ marginRight: 8 }} />
          <ThemedText className="text-white font-semibold">
            {retryButtonText}
          </ThemedText>
        </View>
      </Button>
    </View>
  );
}
