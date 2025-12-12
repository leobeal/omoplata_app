import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, Pressable, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { Chip } from '@/components/Chip';
import Header from '@/components/Header';
import Icon, { IconName } from '@/components/Icon';
import SkeletonLoader from '@/components/SkeletonLoader';
import ThemedText from '@/components/ThemedText';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

type NotificationType = 'class' | 'achievement' | 'reminder' | 'billing' | 'all';

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: IconName;
  user?: {
    id: number;
    name: string;
    avatar: string;
  };
}

// Simulated notification data
const generateNotifications = (): Notification[] => [
  {
    id: 1,
    type: 'class',
    title: 'Class Confirmed',
    message: 'Your attendance for BJJ Fundamentals has been confirmed',
    time: '2 min ago',
    read: false,
    icon: 'CheckCircle',
  },
  {
    id: 2,
    type: 'achievement',
    title: 'New Achievement!',
    message: "You've reached a 7-day training streak!",
    time: '1 hour ago',
    read: false,
    icon: 'Award',
  },
  {
    id: 3,
    type: 'class',
    title: 'Class Reminder',
    message: 'No-Gi class starts in 1 hour',
    time: '2 hours ago',
    read: true,
    icon: 'Clock',
  },
  {
    id: 4,
    type: 'reminder',
    title: 'Training Reminder',
    message: "Don't forget your scheduled MMA class today at 6 PM",
    time: '3 hours ago',
    read: false,
    icon: 'Bell',
  },
  {
    id: 5,
    type: 'billing',
    title: 'Payment Processed',
    message: 'Your monthly membership payment has been processed',
    time: '4 hours ago',
    read: true,
    icon: 'CreditCard',
  },
  {
    id: 6,
    type: 'class',
    title: 'Class Cancelled',
    message: 'Wrestling class on Friday has been cancelled',
    time: '1 day ago',
    read: true,
    icon: 'XCircle',
  },
  {
    id: 7,
    type: 'achievement',
    title: 'Monthly Goal Reached!',
    message: "You've attended 20 classes this month!",
    time: '1 day ago',
    read: false,
    icon: 'Trophy',
  },
  {
    id: 8,
    type: 'reminder',
    title: 'Schedule Update',
    message: 'New BJJ Advanced class added on Saturdays at 10 AM',
    time: '2 days ago',
    read: true,
    icon: 'Calendar',
  },
  {
    id: 9,
    type: 'billing',
    title: 'Invoice Available',
    message: 'Your January invoice is ready to view',
    time: '3 days ago',
    read: true,
    icon: 'FileText',
  },
  {
    id: 10,
    type: 'achievement',
    title: 'Personal Record!',
    message: "You've trained 4 days in a row this week",
    time: '4 days ago',
    read: true,
    icon: 'TrendingUp',
  },
];

export default function NotificationsScreen() {
  const t = useT();
  const colors = useThemeColors();
  const [selectedType, setSelectedType] = useState<NotificationType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setNotifications(generateNotifications());
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

  const markAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  // Filter notifications based on selected type
  const filteredNotifications = notifications.filter((notification) =>
    selectedType === 'all' ? true : notification.type === selectedType
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filterChips: { type: NotificationType; label: string }[] = [
    { type: 'all', label: t('notifications.all') },
    { type: 'class', label: t('notifications.classes') },
    { type: 'achievement', label: t('notifications.achievements') },
    { type: 'reminder', label: t('notifications.reminders') },
    { type: 'billing', label: t('notifications.billing') },
  ];

  const renderNotification = (notification: Notification) => (
    <Pressable
      key={notification.id}
      onPress={() => markAsRead(notification.id)}
      className={`flex-row border-b border-border p-4 ${!notification.read ? 'bg-secondary/30' : ''}`}>
      {/* Icon or Avatar */}
      {notification.user ? (
        <Image source={{ uri: notification.user.avatar }} className="h-10 w-10 rounded-full" />
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
        <ThemedText className="text-xs opacity-50">{notification.time}</ThemedText>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title={t('notifications.title')} />

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
          <Pressable
            onPress={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}>
            <ThemedText className="text-sm font-semibold" style={{ color: colors.highlight }}>
              {t('notifications.markAllRead')}
            </ThemedText>
          </Pressable>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
            colors={[colors.highlight]}
            progressBackgroundColor={colors.bg}
          />
        }>
        {isLoading ? (
          <View className="px-4">
            <SkeletonLoader variant="list" count={6} />
          </View>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map(renderNotification)
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
      </ScrollView>
    </View>
  );
}
