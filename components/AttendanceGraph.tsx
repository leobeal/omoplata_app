import { useState, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';

import ThemedText from './ThemedText';

import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

interface AttendanceGraphProps {
  title?: string;
  subtitle?: string;
}

interface WeekData {
  count: number;
  weekStart: Date;
}

// Generate dummy weekly attendance data for the past year (52 weeks)
const generateWeeklyData = (): WeekData[] => {
  const weeks: WeekData[] = [];
  const today = new Date();

  for (let i = 51; i >= 0; i--) {
    // Calculate week start date
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - i * 7);
    // Set to start of week (Monday)
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    // Random attendance 0-7 days per week, weighted towards 2-4
    const rand = Math.random();
    let count;
    if (rand < 0.1) count = 0;
    else if (rand < 0.2) count = 1;
    else if (rand < 0.4) count = 2;
    else if (rand < 0.6) count = 3;
    else if (rand < 0.8) count = 4;
    else if (rand < 0.9) count = 5;
    else count = Math.floor(Math.random() * 2) + 6; // 6-7

    weeks.push({ count, weekStart });
  }
  return weeks;
};

const formatWeekRange = (weekStart: Date): string => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const formatDate = (d: Date) => {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
};

export const AttendanceGraph = ({ title, subtitle }: AttendanceGraphProps) => {
  const colors = useThemeColors();
  const t = useT();
  const [containerWidth, setContainerWidth] = useState(300);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const weeklyData = useMemo(() => generateWeeklyData(), []);
  const maxValue = 7; // Max days per week

  const barWidth = 5;
  const barGap = 2;
  const maxBarHeight = 80;

  const selectedData = selectedWeek !== null ? weeklyData[selectedWeek] : null;

  return (
    <View
      className="rounded-lg bg-secondary p-1"
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width - 8);
      }}>
      {title && <ThemedText className="pl-3 pt-3 text-xl font-bold">{title}</ThemedText>}
      {subtitle && <ThemedText className="pl-3 text-sm opacity-50">{subtitle}</ThemedText>}

      {/* Selected week info */}
      <View className="mx-3 mt-3 h-10 items-center justify-center">
        {selectedData ? (
          <View className="flex-row items-center">
            <ThemedText className="text-sm font-semibold">
              {formatWeekRange(selectedData.weekStart)}:
            </ThemedText>
            <ThemedText className="ml-2 text-sm">
              {selectedData.count}{' '}
              {selectedData.count === 1 ? t('settings.day') : t('settings.days')}
            </ThemedText>
          </View>
        ) : (
          <ThemedText className="text-sm opacity-50">{t('settings.tapToSeeDetails')}</ThemedText>
        )}
      </View>

      <View className="px-3 pb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: 'flex-end',
            height: maxBarHeight + 20,
            paddingTop: 10,
          }}>
          {weeklyData.map((week, index) => {
            const height = (week.count / maxValue) * maxBarHeight;
            const isSelected = selectedWeek === index;
            const opacity = week.count === 0 ? 0.2 : 0.4 + (week.count / maxValue) * 0.6;

            return (
              <Pressable
                key={index}
                onPress={() => setSelectedWeek(isSelected ? null : index)}
                style={{
                  paddingHorizontal: 2,
                  paddingVertical: 5,
                }}>
                <View
                  style={{
                    width: isSelected ? barWidth + 2 : barWidth,
                    height: Math.max(height, 2),
                    backgroundColor: isSelected ? colors.text : colors.highlight,
                    opacity: isSelected ? 1 : opacity,
                    borderRadius: 2,
                    marginRight: barGap,
                  }}
                />
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Labels */}
        <View className="mt-2 flex-row justify-between">
          <ThemedText className="text-xs opacity-50">52 {t('settings.weeksAgo')}</ThemedText>
          <ThemedText className="text-xs opacity-50">{t('settings.now')}</ThemedText>
        </View>
      </View>
    </View>
  );
};
