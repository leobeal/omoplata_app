import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import CalendarClassCard from '@/components/CalendarClassCard';
import { getUpcomingClasses, Class } from '@/api/classes';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_ITEM_WIDTH = 70;

interface DayData {
  date: Date;
  dateString: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  classes: Class[];
}

export default function CalendarScreen() {
  const t = useT();
  const colors = useThemeColors();
  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  // Scroll to today on mount
  useEffect(() => {
    if (!loading && scrollViewRef.current) {
      const todayIndex = days.findIndex((day) => day.isToday);
      if (todayIndex !== -1) {
        // Center today's date
        const scrollToX = Math.max(0, todayIndex * DAY_ITEM_WIDTH - SCREEN_WIDTH / 2 + DAY_ITEM_WIDTH / 2);
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: scrollToX, animated: true });
        }, 100);
      }
    }
  }, [loading]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getUpcomingClasses();
      setAllClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group classes by date
  const classesByDate = useMemo(() => {
    const grouped: { [key: string]: Class[] } = {};
    allClasses.forEach((cls) => {
      if (!grouped[cls.date]) {
        grouped[cls.date] = [];
      }
      grouped[cls.date].push(cls);
    });
    return grouped;
  }, [allClasses]);

  // Generate days for horizontal scroll (90 days from now)
  const days = useMemo(() => {
    const today = new Date();
    const daysArray: DayData[] = [];
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      daysArray.push({
        date,
        dateString,
        dayName,
        dayNumber: date.getDate(),
        monthName,
        isToday: dateString === todayString,
        classes: classesByDate[dateString] || [],
      });
    }

    return daysArray;
  }, [classesByDate]);

  const selectedDateClasses = useMemo(() => {
    return classesByDate[selectedDate] || [];
  }, [selectedDate, classesByDate]);

  const selectedDayData = days.find((day) => day.dateString === selectedDate);

  const getCategoryColor = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      'BJJ': '#9333EA',
      'Muay Thai': '#DC2626',
      'Boxing': '#2563EB',
      'Wrestling': '#EA580C',
      'MMA': '#16A34A',
      'Grappling': '#7C3AED',
      'Self Defense': '#DB2777',
      'Fitness': '#0891B2',
      'Open Mat': '#65A30D',
    };
    return categoryColors[category] || colors.highlight;
  };

  return (
    <View className="flex-1 bg-background">
      {/* Horizontal Scrollable Days */}
      <View className="border-b border-border bg-secondary pb-3 pt-4">
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}>
          {days.map((day, index) => {
            const isSelected = day.dateString === selectedDate;
            const hasClasses = day.classes.length > 0;

            return (
              <Pressable
                key={day.dateString}
                onPress={() => setSelectedDate(day.dateString)}
                className="mx-1"
                style={{ width: DAY_ITEM_WIDTH }}>
                <View
                  className={`items-center rounded-2xl px-3 py-4 ${isSelected ? '' : ''}`}
                  style={{
                    backgroundColor: isSelected
                      ? colors.highlight
                      : day.isToday
                        ? colors.isDark
                          ? '#2A2A2A'
                          : '#E5E5E5'
                        : 'transparent',
                  }}>
                  {/* Day name */}
                  <ThemedText
                    className="mb-1 text-xs font-semibold uppercase"
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.text,
                      opacity: isSelected ? 1 : 0.5,
                    }}>
                    {day.dayName}
                  </ThemedText>

                  {/* Day number */}
                  <ThemedText
                    className="mb-2 text-2xl font-bold"
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.text,
                    }}>
                    {day.dayNumber}
                  </ThemedText>

                  {/* Month (show only on 1st of month or first item) */}
                  {(day.dayNumber === 1 || index === 0) && (
                    <ThemedText
                      className="text-xs font-semibold"
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                        opacity: isSelected ? 0.8 : 0.4,
                      }}>
                      {day.monthName}
                    </ThemedText>
                  )}

                  {/* Class indicators */}
                  {hasClasses && (
                    <View className="mt-2 flex-row gap-1">
                      {day.classes.slice(0, 3).map((cls, idx) => (
                        <View
                          key={idx}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: isSelected ? '#FFFFFF' : getCategoryColor(cls.category),
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Classes List */}
      <ThemedScroller className="flex-1 px-6 pt-6">
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color={colors.highlight} />
          </View>
        ) : selectedDateClasses.length > 0 ? (
          <>
            {/* Selected Date Header */}
            <View className="mb-4">
              <ThemedText className="text-2xl font-bold">
                {selectedDayData?.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>
              <ThemedText className="mt-1 text-sm opacity-60">
                {selectedDateClasses.length} {selectedDateClasses.length === 1 ? 'class' : 'classes'} scheduled
              </ThemedText>
            </View>

            {/* Classes */}
            {selectedDateClasses.map((classItem) => (
              <CalendarClassCard key={classItem.id} classData={classItem} />
            ))}
          </>
        ) : (
          <View className="items-center justify-center py-16">
            <View
              className="mb-4 rounded-full p-6"
              style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
              <Icon name="Calendar" size={48} color={colors.text} className="opacity-30" />
            </View>
            <ThemedText className="text-center text-xl font-bold opacity-80">
              {t('calendar.noClasses')}
            </ThemedText>
            <ThemedText className="mt-2 text-center opacity-50">
              {selectedDayData?.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </ThemedText>
          </View>
        )}

        {/* Category Legend */}
        <View className="mb-6 mt-8 rounded-2xl bg-secondary p-5">
          <ThemedText className="mb-4 text-sm font-bold uppercase opacity-60">
            {t('calendar.legend')}
          </ThemedText>
          <View className="flex-row flex-wrap gap-3">
            {Object.entries({
              'BJJ': '#9333EA',
              'Muay Thai': '#DC2626',
              'Boxing': '#2563EB',
              'Wrestling': '#EA580C',
              'MMA': '#16A34A',
              'Self Defense': '#DB2777',
              'Fitness': '#0891B2',
            }).map(([category, color]) => (
              <View key={category} className="flex-row items-center gap-2">
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <ThemedText className="text-sm">{category}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ThemedScroller>
    </View>
  );
}
