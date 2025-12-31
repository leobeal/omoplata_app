import { router } from 'expo-router';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
  Dimensions,
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUpcomingClasses, Class } from '@/api/classes';
import CalendarClassCard from '@/components/CalendarClassCard';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_ITEM_WIDTH = 56;
const DAY_MARGIN = 4; // mx-1 = 4px on each side
const DAY_TOTAL_WIDTH = DAY_ITEM_WIDTH + DAY_MARGIN * 2; // 56 + 8 = 64
const SCROLL_PADDING = 8; // paddingHorizontal on ScrollView

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
  const daysListRef = useRef<FlatList<DayData>>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [visibleMonthYear, setVisibleMonthYear] = useState<string>('');
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  // Scroll to selected date when it changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    if (!loading && daysListRef.current) {
      const selectedIndex = days.findIndex((day) => day.dateString === selectedDate);
      if (selectedIndex !== -1) {
        timeoutId = setTimeout(() => {
          daysListRef.current?.scrollToIndex({
            index: selectedIndex,
            animated: true,
            viewPosition: 0.5, // Center the item
          });
        }, 100);
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedDate, loading]);

  const loadClasses = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await getUpcomingClasses();
      setAllClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load classes. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadClasses(true);
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

  // Generate days for horizontal scroll (30 days from now)
  const days = useMemo(() => {
    const today = new Date();
    const daysArray: DayData[] = [];
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < 30; i++) {
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

  // Initialize visible month/year on first load
  useEffect(() => {
    if (days.length > 0 && !visibleMonthYear) {
      const today = new Date();
      setVisibleMonthYear(today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    }
  }, [days, visibleMonthYear]);

  // Handle scroll to update visible month
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const centerX = scrollX + SCREEN_WIDTH / 2;
    // Calculate which item is at the center of the screen
    // First item center is at: SCROLL_PADDING + DAY_MARGIN + DAY_ITEM_WIDTH / 2
    const centerIndex = Math.round(
      (centerX - SCROLL_PADDING - DAY_MARGIN - DAY_ITEM_WIDTH / 2) / DAY_TOTAL_WIDTH
    );

    if (days[centerIndex]) {
      const centerDate = days[centerIndex].date;
      const monthYear = centerDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (monthYear !== visibleMonthYear) {
        setVisibleMonthYear(monthYear);
      }
    }
  };

  // Check if selected date is today
  const isSelectedToday = useMemo(() => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return selectedDate === todayString;
  }, [selectedDate]);

  // Go to today
  const goToToday = () => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayString);
  };

  // Render day item for horizontal FlatList
  const renderDayItem: ListRenderItem<DayData> = useCallback(
    ({ item: day }) => {
      const isSelected = day.dateString === selectedDate;

      return (
        <Pressable
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
          </View>
        </Pressable>
      );
    },
    [selectedDate, colors]
  );

  // Render class item for vertical FlatList
  const renderClassItem: ListRenderItem<Class> = useCallback(
    ({ item: classItem }) => <CalendarClassCard key={classItem.id} classData={classItem} />,
    []
  );

  // Key extractor for days
  const dayKeyExtractor = useCallback((item: DayData) => item.dateString, []);

  // Key extractor for classes
  const classKeyExtractor = useCallback((item: Class) => item.id, []);

  // Get item layout for days FlatList (for better scroll performance)
  const getDayItemLayout = useCallback(
    (_: ArrayLike<DayData> | null | undefined, index: number) => ({
      length: DAY_TOTAL_WIDTH,
      offset: DAY_TOTAL_WIDTH * index,
      index,
    }),
    []
  );

  // Header component for classes FlatList
  const ClassesListHeader = useCallback(
    () => (
      <View className="mb-4">
        <ThemedText className="text-2xl font-bold">
          {selectedDayData?.date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </ThemedText>
        <ThemedText className="mt-1 text-sm opacity-60">
          {selectedDateClasses.length} {selectedDateClasses.length === 1 ? 'class' : 'classes'}{' '}
          scheduled
        </ThemedText>
      </View>
    ),
    [selectedDayData, selectedDateClasses.length]
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-secondary">
      <View className="flex-1 bg-background">
        {/* Month/Year Header */}
        <View className="border-b border-border bg-secondary px-6 pb-3 pt-4">
          <View className="flex-row items-center justify-between">
            {/* Back Button */}
            <Pressable
              onPress={() => router.back()}
              className="rounded-full p-2"
              style={{ backgroundColor: colors.skeleton }}>
              <Icon name="ChevronLeft" size={20} color={colors.text} />
            </Pressable>

            {/* Month and Year */}
            <ThemedText className="text-lg font-bold">{visibleMonthYear}</ThemedText>

            {/* Today Button */}
            {!isSelectedToday ? (
              <Pressable
                onPress={goToToday}
                className="rounded-full px-3 py-2"
                style={{ backgroundColor: colors.highlight }}>
                <ThemedText className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>
                  Today
                </ThemedText>
              </Pressable>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </View>
        </View>

        {/* Horizontal Scrollable Days */}
        <View className="border-b border-border bg-secondary pb-2 pt-2">
          <FlatList
            ref={daysListRef}
            data={days}
            renderItem={renderDayItem}
            keyExtractor={dayKeyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: 8 }}
            getItemLayout={getDayItemLayout}
            extraData={selectedDate}
          />
        </View>

        {/* Classes List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.highlight} />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <View
              className="mb-4 h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.error + '20' }}>
              <Icon name="AlertCircle" size={32} color={colors.error} />
            </View>
            <ThemedText className="mb-2 text-center text-lg font-bold">
              {t('calendar.errorTitle') || 'Unable to load classes'}
            </ThemedText>
            <ThemedText className="mb-6 max-w-sm text-center text-sm opacity-70">
              {error}
            </ThemedText>
            <Pressable
              onPress={loadClasses}
              className="rounded-full px-6 py-3"
              style={{ backgroundColor: colors.highlight }}>
              <View className="flex-row items-center">
                <Icon name="RefreshCw" size={16} color="#FFFFFF" />
                <ThemedText className="ml-2 font-semibold" style={{ color: '#FFFFFF' }}>
                  {t('common.tryAgain') || 'Try Again'}
                </ThemedText>
              </View>
            </Pressable>
          </View>
        ) : selectedDateClasses.length > 0 ? (
          <FlatList
            data={selectedDateClasses}
            renderItem={renderClassItem}
            keyExtractor={classKeyExtractor}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24 }}
            ListHeaderComponent={ClassesListHeader}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.text}
                colors={[colors.highlight]}
                progressBackgroundColor={colors.bg}
              />
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <View className="mb-4 rounded-full p-6" style={{ backgroundColor: colors.skeleton }}>
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
      </View>
    </SafeAreaView>
  );
}
