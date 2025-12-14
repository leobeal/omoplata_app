import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getClasses, Class } from '@/api/classes';
import Avatar from '@/components/Avatar';
import CalendarClassCard from '@/components/CalendarClassCard';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useScrollToTop } from '@/contexts/ScrollToTopContext';
import { useThemeColors } from '@/contexts/ThemeColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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

// Helper to map app locale to date locale string
const getDateLocale = (locale: string) => {
  switch (locale) {
    case 'pt-BR':
      return 'pt-BR';
    case 'de':
      return 'de-DE';
    case 'tr':
      return 'tr-TR';
    default:
      return 'en-US';
  }
};

export default function CalendarScreen() {
  const { t, locale } = useTranslation();
  const dateLocale = getDateLocale(locale);
  const colors = useThemeColors();
  const { user } = useAuth();
  const { registerScrollHandler, unregisterScrollHandler } = useScrollToTop();
  const daysListRef = useRef<FlatList<DayData>>(null);
  const classesListRef = useRef<FlatList<DayData>>(null);
  const currentDayScrollViewRef = useRef<ScrollView>(null);
  const isScrollingFromSwipe = useRef(false);
  const scrollHandlerRef = useRef<() => void>(() => {});
  const selectedDateRef = useRef<string>('');

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [visibleMonthYear, setVisibleMonthYear] = useState<string>('');
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCachedData, setUsingCachedData] = useState(false);

  // Reload when user changes (profile switch)
  useEffect(() => {
    setLoading(true);
    loadClasses();
  }, [user?.id]);

  // Register scroll-to-top handler
  useEffect(() => {
    const handleScrollToTop = () => {
      scrollHandlerRef.current();
    };

    registerScrollHandler('/calendar', handleScrollToTop);

    return () => {
      unregisterScrollHandler('/calendar');
    };
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

      // Fetch classes for the next 30 days using date range
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 30);

      const fromDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const toDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const { classes, fromCache } = await getClasses({ fromDate, toDate });
      setAllClasses(classes);
      setUsingCachedData(fromCache);
    } catch (err) {
      console.error('Error loading classes:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
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

  // Group classes by date (extract YYYY-MM-DD)
  const classesByDate = useMemo(() => {
    const grouped: { [key: string]: Class[] } = {};
    allClasses.forEach((cls) => {
      // cls.date can be "2025-12-08 10:00:00" or "2025-12-08T10:00:00.000Z"
      // Extract just the date part (YYYY-MM-DD) by splitting on space or T
      const dateKey = cls.date.split(/[T ]/)[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(cls);
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
      const dayName = date.toLocaleDateString(dateLocale, { weekday: 'short' });
      const monthName = date.toLocaleDateString(dateLocale, { month: 'short' });

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
  }, [classesByDate, dateLocale]);

  // Initialize visible month/year on first load or when locale changes
  useEffect(() => {
    if (days.length > 0) {
      const today = new Date();
      setVisibleMonthYear(today.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' }));
    }
  }, [days.length, dateLocale]);

  // Handle scroll to update visible month
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      const centerX = scrollX + SCREEN_WIDTH / 2;
      // Calculate which item is at the center of the screen
      // First item center is at: SCROLL_PADDING + DAY_MARGIN + DAY_ITEM_WIDTH / 2
      const centerIndex = Math.round(
        (centerX - SCROLL_PADDING - DAY_MARGIN - DAY_ITEM_WIDTH / 2) / DAY_TOTAL_WIDTH
      );

      if (days[centerIndex]) {
        const centerDate = days[centerIndex].date;
        const monthYear = centerDate.toLocaleDateString(dateLocale, {
          month: 'long',
          year: 'numeric',
        });
        if (monthYear !== visibleMonthYear) {
          setVisibleMonthYear(monthYear);
        }
      }
    },
    [days, dateLocale, visibleMonthYear]
  );

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

  // Keep selectedDateRef in sync
  selectedDateRef.current = selectedDate;

  // Scroll to top (go to today and scroll content to top)
  const scrollToTop = useCallback(() => {
    // Scroll current day's content to top
    currentDayScrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });

    // Go to today
    goToToday();

    // Also scroll the days list to the beginning (today)
    daysListRef.current?.scrollToIndex({
      index: 0,
      animated: true,
      viewPosition: 0.5,
    });
  }, []);

  // Keep scroll handler ref updated
  scrollHandlerRef.current = scrollToTop;

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
                  : colors.isDark
                    ? '#1A1A1A'
                    : '#F5F5F5',
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

  // Key extractor for days
  const dayKeyExtractor = useCallback((item: DayData) => item.dateString, []);

  // Get item layout for days FlatList (for better scroll performance)
  const getDayItemLayout = useCallback(
    (_: ArrayLike<DayData> | null | undefined, index: number) => ({
      length: DAY_TOTAL_WIDTH,
      offset: DAY_TOTAL_WIDTH * index,
      index,
    }),
    []
  );

  // Get selected date index
  const selectedDateIndex = useMemo(() => {
    return days.findIndex((day) => day.dateString === selectedDate);
  }, [days, selectedDate]);

  // Handle viewable items change for swipe
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { item: DayData }[] }) => {
      if (viewableItems.length > 0 && isScrollingFromSwipe.current) {
        const visibleDay = viewableItems[0].item;
        if (visibleDay.dateString !== selectedDateRef.current) {
          setSelectedDate(visibleDay.dateString);
        }
        isScrollingFromSwipe.current = false;
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Handle scroll begin to detect swipe
  const handleScrollBeginDrag = useCallback(() => {
    isScrollingFromSwipe.current = true;
  }, []);

  // Scroll classes to selected date when date changes (not from swipe)
  useEffect(() => {
    if (!loading && classesListRef.current && !isScrollingFromSwipe.current) {
      classesListRef.current.scrollToIndex({
        index: selectedDateIndex,
        animated: false,
      });
    }
  }, [selectedDateIndex, loading]);

  // FlatList item layout for performance
  const getItemLayout = useCallback(
    (_: ArrayLike<DayData> | null | undefined, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );

  // Render each day page
  const renderDayPage: ListRenderItem<DayData> = useCallback(
    ({ item: day }) => (
      <View style={{ width: SCREEN_WIDTH }}>
        <ScrollView
          ref={day.dateString === selectedDateRef.current ? currentDayScrollViewRef : undefined}
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.text}
              colors={[colors.highlight]}
              progressBackgroundColor={colors.bg}
            />
          }>
          {day.classes.length > 0 ? (
            <>
              {/* Date Header */}
              <View className="mb-4">
                <ThemedText className="text-2xl font-bold">
                  {day.date.toLocaleDateString(dateLocale, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </ThemedText>
                <ThemedText className="mt-1 text-sm opacity-60">
                  {day.classes.length}{' '}
                  {day.classes.length === 1
                    ? t('calendar.classCount.one')
                    : t('calendar.classCount.other')}{' '}
                  {t('calendar.scheduled')}
                </ThemedText>
              </View>

              {/* Classes */}
              {day.classes.map((classItem) => (
                <CalendarClassCard key={classItem.id} classData={classItem} />
              ))}
              <View className="h-24" />
            </>
          ) : (
            <View className="flex-1 items-center justify-center py-16">
              <View
                className="mb-4 rounded-full p-6"
                style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
                <Icon name="Calendar" size={48} color={colors.text} className="opacity-30" />
              </View>
              <ThemedText className="text-center text-xl font-bold opacity-80">
                {t('calendar.noClasses')}
              </ThemedText>
              <ThemedText className="mt-2 text-center opacity-50">
                {day.date.toLocaleDateString(dateLocale, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    ),
    [refreshing, handleRefresh, colors, t, dateLocale]
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-secondary">
      <View className="flex-1 bg-background">
        {/* Month/Year Header */}
        <View className="border-b border-border bg-secondary px-6 pb-3 pt-2">
          <View className="flex-row items-center justify-between">
            {/* Title */}
            <ThemedText className="text-xl font-bold">{t('nav.classes')}</ThemedText>

            {/* Month and Year */}
            <ThemedText className="text-base opacity-70">{visibleMonthYear}</ThemedText>

            {/* Right side: Today Button + Avatar */}
            <View className="flex-row items-center gap-3">
              {/* Today Button */}
              <Pressable
                onPress={goToToday}
                className="rounded-full px-3 py-2"
                style={{
                  backgroundColor: isSelectedToday ? 'transparent' : colors.highlight,
                  opacity: isSelectedToday ? 0 : 1,
                }}
                disabled={isSelectedToday}>
                <ThemedText className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>
                  {t('calendar.today')}
                </ThemedText>
              </Pressable>

              {/* Avatar */}
              <Avatar
                name={user ? `${user.firstName} ${user.lastName}` : ''}
                size="sm"
                link="/screens/settings"
                src={user?.profilePicture}
              />
            </View>
          </View>
        </View>

        {/* Cached Data Banner */}
        {usingCachedData && !loading && (
          <View
            className="flex-row items-center justify-center px-4 py-2"
            style={{ backgroundColor: colors.warning + '20' }}>
            <Icon name="CloudOff" size={14} color={colors.warning} />
            <ThemedText className="ml-2 text-xs" style={{ color: colors.warning }}>
              {t('network.usingCachedData')}
            </ThemedText>
          </View>
        )}

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

        {/* Classes List - Horizontal Swipeable */}
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
              {t('calendar.errorTitle')}
            </ThemedText>
            <ThemedText className="mb-6 max-w-sm text-center text-sm opacity-70">
              {error}
            </ThemedText>
            <Pressable
              onPress={() => loadClasses()}
              className="rounded-full px-6 py-3"
              style={{ backgroundColor: colors.highlight }}>
              <View className="flex-row items-center">
                <Icon name="RefreshCw" size={16} color="#FFFFFF" />
                <ThemedText className="ml-2 font-semibold" style={{ color: '#FFFFFF' }}>
                  {t('common.tryAgain')}
                </ThemedText>
              </View>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={classesListRef}
            data={days}
            renderItem={renderDayPage}
            keyExtractor={(item) => item.dateString}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={handleScrollBeginDrag}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={getItemLayout}
            initialScrollIndex={selectedDateIndex}
            windowSize={3}
            maxToRenderPerBatch={3}
            removeClippedSubviews
          />
        )}
      </View>
    </SafeAreaView>
  );
}
