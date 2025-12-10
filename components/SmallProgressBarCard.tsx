import { View } from 'react-native';

import Icon from './Icon';
import ThemedText from './ThemedText';

import { useThemeColors } from '@/contexts/ThemeColors';

interface ProgressBarData {
  percentage: number;
  color?: string;
  label?: string;
}

interface SmallProgressBarCardProps {
  title: string;
  subtitle?: string;
  data: ProgressBarData[] | number;
  barColor?: string;
  value?: string;
  unit?: string;
  height?: number;
  barWidth?: number;
}

export const SmallProgressBarCard = ({
  title,
  subtitle,
  data,
  barColor,
  value,
  unit,
  height = 60,
  barWidth = 6,
}: SmallProgressBarCardProps) => {
  const colors = useThemeColors();

  const barsData = Array.isArray(data) ? data : [{ percentage: data, color: barColor }];

  return (
    <View className="min-w-0 rounded-lg bg-secondary p-1">
      <ThemedText className="pl-3 pt-3 text-xl font-bold">{title}</ThemedText>
      {subtitle && <ThemedText className="pl-3 text-sm opacity-50">{subtitle}</ThemedText>}

      <View className="mb-2 mt-4 items-center">
        <View className="flex-row items-end justify-center gap-4" style={{ height: height + 20 }}>
          {barsData.map((bar, index) => (
            <View key={index} className="items-center">
              <View
                className="relative overflow-hidden rounded-full bg-background"
                style={{
                  width: barWidth,
                  height,
                  marginHorizontal: 4,
                }}>
                <View
                  className="absolute bottom-0 left-0 right-0 rounded-full"
                  style={{
                    backgroundColor: bar.color || barColor || colors.highlight,
                    height: (bar.percentage / 100) * height,
                  }}
                />
              </View>

              <View className="mt-2 min-h-6 justify-center">
                <ThemedText className="text-center text-xs font-semibold">
                  {Math.round(bar.percentage)}%
                </ThemedText>
                {bar.label && (
                  <ThemedText className="text-center text-xs opacity-60">{bar.label}</ThemedText>
                )}
              </View>
            </View>
          ))}
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
