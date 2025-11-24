import { useState } from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import Icon from './Icon';
import ThemedText from './ThemedText';

import { useThemeColors } from '@/contexts/ThemeColors';

interface SmallChartCardProps {
  title: string;
  subtitle?: string;
  data: number[];
  lineColor?: string;
  value?: string;
  unit?: string;
  height?: number;
}

export const SmallChartCard = ({
  title,
  subtitle,
  data,
  lineColor,
  value,
  unit,
  height = 83,
}: SmallChartCardProps) => {
  const colors = useThemeColors();
  const [containerWidth, setContainerWidth] = useState(200);

  const chartData = {
    labels: data.map(() => ''),
    datasets: [
      {
        data,
        color: () => lineColor || colors.highlight,
        strokeWidth: 4,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: () => lineColor || colors.highlight,
    labelColor: () => 'transparent',
    style: {
      borderRadius: 0,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '1.4',
      fill: colors.bg,
      stroke: lineColor || colors.highlight,
      strokeOpacity: 1,
    },
    propsForBackgroundLines: {
      strokeWidth: 0,
    },
    withHorizontalLabels: false,
    withVerticalLabels: false,
    withInnerLines: false,
    withOuterLines: false,
  };

  return (
    <View
      className="min-w-0 rounded-lg bg-secondary p-4"
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width - 32);
      }}>
      <ThemedText className="text-xl font-bold">{title}</ThemedText>
      {subtitle && <ThemedText className="text-sm opacity-50">{subtitle}</ThemedText>}
      <View className="mt-2 items-center">
        <LineChart
          data={chartData}
          width={containerWidth + 20}
          height={height}
          chartConfig={chartConfig}
          withDots
          withShadow={false}
          style={{
            paddingRight: 10,
            paddingLeft: 0,
            marginLeft: 20,
          }}
        />
      </View>
      {value && (
        <View className="mt-6 w-full flex-row justify-between border-t border-border pt-4">
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
