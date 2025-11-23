import React, { useState, useEffect, useMemo } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import ClassCard from '@/components/ClassCard';
import { getUpcomingClasses, confirmAttendance, denyAttendance, Class } from '@/api/classes';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

interface DayData {
  date: number;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  classes: Class[];
}

export default function CalendarScreen() {
  const t = useT();
  const colors = useThemeColors();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

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

  const handleConfirm = async (classId: string) => {
    try {
      await confirmAttendance(classId);
      setAllClasses((prev) =>
        prev.map((cls) => (cls.id === classId ? { ...cls, status: 'confirmed' as const } : cls))
      );
    } catch (error) {
      console.error('Error confirming attendance:', error);
    }
  };

  const handleDeny = async (classId: string) => {
    try {
      await denyAttendance(classId);
      setAllClasses((prev) =>
        prev.map((cls) => (cls.id === classId ? { ...cls, status: 'denied' as const } : cls))
      );
    } catch (error) {
      console.error('Error denying attendance:', error);
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

  // Generate calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: DayData[] = [];
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Add previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i;
      const dateObj = new Date(year, month - 1, date);
      const dateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        classes: classesByDate[dateString] || [],
      });
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        date: i,
        dateString,
        isCurrentMonth: true,
        isToday: dateString === todayString,
        classes: classesByDate[dateString] || [],
      });
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const dateObj = new Date(year, month + 1, i);
      const dateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        date: i,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        classes: classesByDate[dateString] || [],
      });
    }

    return days;
  }, [currentDate, classesByDate]);

  const selectedDateClasses = useMemo(() => {
    if (!selectedDate) return [];
    return classesByDate[selectedDate] || [];
  }, [selectedDate, classesByDate]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const formatSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

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
      <Header title={t('calendar.title')} showBack />

      <ThemedScroller className="flex-1">
        {/* Month Navigation */}
        <View className="border-b border-border bg-secondary px-6 py-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={previousMonth}
              className="rounded-full p-2"
              style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
              <Icon name="ChevronLeft" size={24} color={colors.text} />
            </Pressable>

            <ThemedText className="text-xl font-bold">{monthName}</ThemedText>

            <Pressable
              onPress={nextMonth}
              className="rounded-full p-2"
              style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
              <Icon name="ChevronRight" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Calendar Grid */}
        <View className="px-4 py-4">
          {/* Day names */}
          <View className="mb-2 flex-row">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} className="flex-1 items-center py-2">
                <ThemedText className="text-xs font-semibold opacity-50">{day}</ThemedText>
              </View>
            ))}
          </View>

          {/* Calendar days */}
          {loading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={colors.highlight} />
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {calendarData.map((day, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    if (day.classes.length > 0) {
                      setSelectedDate(day.dateString === selectedDate ? null : day.dateString);
                    }
                  }}
                  className="w-[14.28%] aspect-square p-1">
                  <View
                    className={`flex-1 items-center justify-center rounded-lg ${
                      day.isToday ? 'border-2' : ''
                    } ${selectedDate === day.dateString ? 'bg-highlight' : ''}`}
                    style={{
                      borderColor: day.isToday ? colors.highlight : 'transparent',
                      backgroundColor: selectedDate === day.dateString ? colors.highlight : 'transparent',
                    }}>
                    <ThemedText
                      className={`text-sm font-semibold ${
                        !day.isCurrentMonth ? 'opacity-30' : ''
                      } ${selectedDate === day.dateString ? 'text-white' : ''}`}
                      style={{
                        color: selectedDate === day.dateString ? '#FFFFFF' : colors.text,
                      }}>
                      {day.date}
                    </ThemedText>

                    {/* Class indicators */}
                    {day.classes.length > 0 && (
                      <View className="absolute bottom-1 flex-row gap-0.5">
                        {day.classes.slice(0, 3).map((cls, idx) => (
                          <View
                            key={idx}
                            className="h-1 w-1 rounded-full"
                            style={{ backgroundColor: getCategoryColor(cls.category) }}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Selected Date Classes */}
        {selectedDate && selectedDateClasses.length > 0 && (
          <View className="border-t border-border px-6 py-4">
            <View className="mb-4 flex-row items-center justify-between">
              <ThemedText className="text-lg font-bold">
                {formatSelectedDate(selectedDate)}
              </ThemedText>
              <Pressable onPress={() => setSelectedDate(null)}>
                <Icon name="X" size={20} color={colors.text} />
              </Pressable>
            </View>

            <View className="gap-3">
              {selectedDateClasses.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classData={classItem}
                  onConfirm={handleConfirm}
                  onDeny={handleDeny}
                />
              ))}
            </View>
          </View>
        )}

        {/* Legend */}
        <View className="mx-6 mb-6 rounded-2xl bg-secondary p-4">
          <ThemedText className="mb-3 text-sm font-semibold">{t('calendar.legend')}</ThemedText>
          <View className="flex-row flex-wrap gap-2">
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
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <ThemedText className="text-xs">{category}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ThemedScroller>
    </View>
  );
}
