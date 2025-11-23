import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import CalendarClassCard from '@/components/CalendarClassCard';
import { getUpcomingClasses, Class } from '@/api/classes';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_ITEM_WIDTH = 56;

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

  // Scroll to selected date when it changes
  useEffect(() => {
    if (!loading && scrollViewRef.current) {
      const selectedIndex = days.findIndex((day) => day.dateString === selectedDate);
      if (selectedIndex !== -1) {
        const scrollToX = Math.max(0, selectedIndex * DAY_ITEM_WIDTH - SCREEN_WIDTH / 2 + DAY_ITEM_WIDTH / 2);
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: scrollToX, animated: true });
        }, 100);
      }
    }
  }, [selectedDate, loading]);

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

  // Get current month/year from selected date
  const currentMonthYear = useMemo(() => {
    const date = new Date(selectedDate);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  // Check if selected date is today
  const isSelectedToday = useMemo(() => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return selectedDate === todayString;
  }, [selectedDate]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const currentDate = new Date(selectedDate);
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const dateString = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}-${String(previousMonth.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateString);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const currentDate = new Date(selectedDate);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const dateString = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateString);
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayString);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="flex-1 bg-background">
        {/* Month/Year Header with Navigation */}
        <View className="border-b border-border bg-secondary px-6 py-3">
          <View className="flex-row items-center justify-between">
            {/* Previous Month Arrow */}
            <Pressable
              onPress={goToPreviousMonth}
              className="rounded-full p-2"
              style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
              <Icon name="ChevronLeft" size={20} color={colors.text} />
            </Pressable>

            {/* Month and Year */}
            <ThemedText className="text-lg font-bold">{currentMonthYear}</ThemedText>

            {/* Next Month Arrow or Today Button */}
            <View className="flex-row items-center gap-2">
              {!isSelectedToday && (
                <Pressable
                  onPress={goToToday}
                  className="rounded-full px-3 py-2"
                  style={{ backgroundColor: colors.highlight }}>
                  <ThemedText className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>
                    Today
                  </ThemedText>
                </Pressable>
              )}
              <Pressable
                onPress={goToNextMonth}
                className="rounded-full p-2"
                style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
                <Icon name="ChevronRight" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Horizontal Scrollable Days */}
        <View className="border-b border-border bg-secondary pb-2">
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8 }}>
            {days.map((day, index) => {
              const isSelected = day.dateString === selectedDate;

              return (
                <Pressable
                  key={day.dateString}
                  onPress={() => setSelectedDate(day.dateString)}
                  className="mx-1"
                  style={{ width: DAY_ITEM_WIDTH }}>
                  <View
                    className="items-center rounded-xl px-2 py-2"
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
                      className="mb-0.5 text-[10px] font-semibold uppercase"
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                        opacity: isSelected ? 1 : 0.5,
                      }}>
                      {day.dayName}
                    </ThemedText>

                    {/* Day number */}
                    <ThemedText
                      className="text-lg font-bold"
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                      }}>
                      {day.dayNumber}
                    </ThemedText>

                    {/* Month (show only on 1st of month or first item) */}
                    {(day.dayNumber === 1 || index === 0) && (
                      <ThemedText
                        className="text-[9px] font-semibold"
                        style={{
                          color: isSelected ? '#FFFFFF' : colors.text,
                          opacity: isSelected ? 0.8 : 0.4,
                        }}>
                        {day.monthName}
                      </ThemedText>
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
    </SafeAreaView>
  );
}
