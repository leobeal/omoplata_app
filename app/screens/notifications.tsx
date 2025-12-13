import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  Pressable,
  RefreshControl,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  Notification,
  NotificationType,
} from '@/api/notifications';
import { Chip } from '@/components/Chip';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import LargeTitle from '@/components/LargeTitle';
import SkeletonLoader from '@/components/SkeletonLoader';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

type FilterType = NotificationType | 'all';

export default function NotificationsScreen() {
  const t = useT();
  const colors = useThemeColors();
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Scroll state for collapsible title
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const LARGE_TITLE_HEIGHT = 44;

  const handleScrollForTitle = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowHeaderTitle(offsetY > LARGE_TITLE_HEIGHT);
  }, []);

  const loadNotifications = useCallback(async (cursor?: string) => {
    try {
      const result = await getNotifications({
        limit: 20,
        cursor,
      });

      if (cursor) {
        // Appending more results
        setNotifications((prev) => [...prev, ...result.notifications]);
      } else {
        // Fresh load
        setNotifications(result.notifications);
      }
      setUnreadCount(result.unreadCount);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await loadNotifications();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [loadNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      await loadNotifications(nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, loadNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markAsRead(notificationId);
    } catch (error) {
      // Revert on failure
      console.error('Failed to mark as read:', error);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await markAllAsRead();
    } catch (error) {
      // Revert on failure
      console.error('Failed to mark all as read:', error);
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  }, [notifications, unreadCount]);

  // Filter notifications based on selected type
  const filteredNotifications = notifications.filter((notification) =>
    selectedType === 'all' ? true : notification.type === selectedType
  );

  const filterChips: { type: FilterType; label: string }[] = [
    { type: 'all', label: t('notifications.all') },
    { type: 'class', label: t('notifications.classes') },
    { type: 'achievement', label: t('notifications.achievements') },
    { type: 'reminder', label: t('notifications.reminders') },
    { type: 'billing', label: t('notifications.billing') },
  ];

  const renderNotification = (notification: Notification) => (
    <Pressable
      key={notification.id}
      onPress={() => !notification.read && handleMarkAsRead(notification.id)}
      className={`flex-row border-b border-border p-4 ${!notification.read ? 'bg-secondary/30' : ''}`}>
      {/* Icon or Avatar */}
      {notification.user ? (
        <Image
          source={{ uri: notification.user.avatar || '' }}
          className="h-10 w-10 rounded-full"
        />
      ) : (
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.highlight + '20' }}>
          <Icon name={notification.icon} size={20} color={colors.highlight} />
        </View>
      )}

      {/* Content */}
      <View className="ml-3 flex-1">
        <View className="mb-1 flex-row items-center justify-between">
          <ThemedText className={`font-semibold ${!notification.read ? 'font-bold' : ''}`}>
            {notification.title}
          </ThemedText>
          {!notification.read && <View className="h-2 w-2 rounded-full bg-highlight" />}
        </View>
        <ThemedText className="mb-1 text-sm opacity-70">{notification.message}</ThemedText>
        <ThemedText className="text-xs opacity-50">{notification.timeAgo}</ThemedText>
      </View>
    </Pressable>
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      handleScrollForTitle(event);

      // Check if near bottom for infinite scroll
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;

      if (isNearBottom && nextCursor && !isLoadingMore) {
        handleLoadMore();
      }
    },
    [handleScrollForTitle, nextCursor, isLoadingMore, handleLoadMore]
  );

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title={showHeaderTitle ? t('notifications.title') : undefined} />

      {/* Notifications List */}
      <ThemedScroller
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
            colors={[colors.highlight]}
            progressBackgroundColor={colors.bg}
          />
        }>
        <LargeTitle title={t('notifications.title')} className="px-6 pt-2" />

        {/* Filter Chips */}
        <View className="border-b border-border px-4 py-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {filterChips.map((chip) => (
                <Chip
                  key={chip.type}
                  label={chip.label}
                  isSelected={selectedType === chip.type}
                  onPress={() => setSelectedType(chip.type)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Unread count banner */}
        {unreadCount > 0 && !isLoading && (
          <View
            className="flex-row items-center justify-between px-4 py-2"
            style={{ backgroundColor: colors.highlight + '10' }}>
            <ThemedText className="text-sm">
              {t('notifications.unreadCount', { count: unreadCount })}
            </ThemedText>
            <Pressable onPress={handleMarkAllAsRead}>
              <ThemedText className="text-sm font-semibold" style={{ color: colors.highlight }}>
                {t('notifications.markAllRead')}
              </ThemedText>
            </Pressable>
          </View>
        )}

        {isLoading ? (
          <View className="px-4">
            <SkeletonLoader variant="list" count={6} />
          </View>
        ) : filteredNotifications.length > 0 ? (
          <>
            {filteredNotifications.map(renderNotification)}
            {isLoadingMore && (
              <View className="py-4">
                <SkeletonLoader variant="list" count={2} />
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <View
              className="mb-4 h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.secondary }}>
              <Icon name="BellOff" size={32} className="opacity-50" />
            </View>
            <ThemedText className="mb-2 text-lg font-semibold">
              {t('notifications.noNotifications')}
            </ThemedText>
            <ThemedText className="text-center text-sm opacity-50">
              {t('notifications.noNotificationsMessage')}
            </ThemedText>
          </View>
        )}
      </ThemedScroller>
    </View>
  );
}
