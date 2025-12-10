import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import Icon from './Icon';
import ThemedText from './ThemedText';

import { useThemeColors } from '@/contexts/ThemeColors';

interface SmallCircleCardProps {
  title: string;
  subtitle?: string;
  percentage: number;
  circleColor?: string;
  value?: string;
  unit?: string;
  size?: number;
}

export const SmallCircleCard = ({
  title,
  subtitle,
  percentage,
  circleColor,
  value,
  unit,
  size = 80,
}: SmallCircleCardProps) => {
  const colors = useThemeColors();

  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View className="min-w-0 rounded-lg bg-secondary p-1">
      <ThemedText className="pl-3 pt-3 text-xl font-bold">{title}</ThemedText>
      {subtitle && <ThemedText className="pl-3 text-sm opacity-50">{subtitle}</ThemedText>}

      <View className="mb-2 mt-4 items-center">
        <View
          className="relative items-center justify-center"
          style={{ width: size, height: size }}>
          <Svg width={size} height={size} style={{ position: 'absolute' }}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.bg}
              strokeWidth={strokeWidth}
              fill="transparent"
              opacity={0.3}
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={circleColor || colors.highlight}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          <View className="absolute items-center">
            <ThemedText className="text-lg font-bold">{Math.round(percentage)}%</ThemedText>
          </View>
        </View>
      </View>

      {value && (
        <View className="mx-3 mb-3 mt-2 flex-row justify-between border-t border-border pt-4">
          <View className="flex-row items-end">
            <ThemedText className="text-xl font-bold">{value}</ThemedText>
            <ThemedText className="ml-1 text-sm opacity-50">{unit}</ThemedText>
          </View>
          <Icon name="ChevronRight" size={20} color={colors.text} />
        </View>
      )}
    </View>
  );
};
