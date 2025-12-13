import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import ThemedText from './ThemedText';

import { useThemeColors } from '@/contexts/ThemeColors';

interface SmallStreakCardProps {
  title: string;
  currentLabel?: string;
  bestLabel?: string;
  streakWeeks: number;
  goalWeeks: number;
  color?: string;
}

const HexagonBadge = ({
  value,
  size = 60,
  color,
  bgColor,
}: {
  value: number;
  size?: number;
  color: string;
  bgColor: string;
}) => {
  // Create hexagon points
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 2;

  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background circle */}
      <View
        style={{
          position: 'absolute',
          width: size + 10,
          height: size + 10,
          borderRadius: (size + 10) / 2,
          backgroundColor: bgColor,
          opacity: 0.3,
        }}
      />
      {/* Hexagon */}
      <Svg width={size} height={size}>
        <Polygon points={points.join(' ')} fill={color} />
      </Svg>
      {/* Value */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
};

export const SmallStreakCard = ({
  title,
  currentLabel = 'Current',
  bestLabel = 'Best',
  streakWeeks,
  goalWeeks,
  color,
}: SmallStreakCardProps) => {
  const colors = useThemeColors();

  const progress = goalWeeks > 0 ? Math.min(streakWeeks / goalWeeks, 1) : 0;
  const badgeColor = color || '#f97316';

  return (
    <View className="min-w-0 rounded-lg bg-secondary p-4">
      <View className="flex-row items-center">
        {/* Hexagon Badge */}
        <HexagonBadge value={streakWeeks} color={badgeColor} bgColor={badgeColor} size={56} />

        {/* Content */}
        <View className="ml-4 flex-1">
          {/* Title */}
          <ThemedText className="text-base font-bold">{title}</ThemedText>

          {/* Current and Best labels */}
          <View className="flex-row items-center gap-3">
            <ThemedText className="text-sm opacity-50">
              {currentLabel}:{' '}
              <ThemedText className="font-semibold opacity-100">{streakWeeks}w</ThemedText>
            </ThemedText>
            <ThemedText className="text-sm opacity-50">
              {bestLabel}:{' '}
              <ThemedText className="font-semibold opacity-100">{goalWeeks}w</ThemedText>
            </ThemedText>
          </View>

          {/* Progress bar */}
          <View className="mt-2 flex-row items-center">
            <View className="h-2 flex-1 overflow-hidden rounded-full bg-background">
              <View
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  backgroundColor: badgeColor,
                  borderRadius: 9999,
                }}
              />
            </View>
            {/* Goal marker */}
            <View
              style={{
                marginLeft: 8,
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: colors.border,
                backgroundColor: progress >= 1 ? badgeColor : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {progress >= 1 && (
                <ThemedText className="text-xs font-bold" style={{ color: '#FFFFFF' }}>
                  ✓
                </ThemedText>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
