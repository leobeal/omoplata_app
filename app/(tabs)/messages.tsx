import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import {
  formatThreadTimestamp,
  getMessages,
  getThread,
  getThreads,
  Message,
  PaginatedMessages,
  Thread,
} from '@/api/messages';
import Avatar from '@/components/Avatar';
import ErrorState from '@/components/ErrorState';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import LargeTitle from '@/components/LargeTitle';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

function ThreadItem({
  thread,
  onPress,
  currentUserId,
  isLoading,
}: {
  thread: Thread;
  onPress: () => void;
  currentUserId: string;
  isLoading: boolean;
}) {
  const colors = useThemeColors();
  const t = useT();

  const isGroup = thread.type === 'group';
  const hasUnread = thread.unreadCount > 0;

  // Get last message preview
  const lastMessagePreview = thread.lastMessage
    ? thread.lastMessage.senderId === currentUserId
      ? `${t('messages.you')}: ${thread.lastMessage.text}`
      : thread.lastMessage.text
    : '';

  return (
    <Pressable
      className="flex-row items-center"
      onPress={onPress}
      disabled={isLoading}
      style={{ opacity: isLoading ? 0.6 : 1 }}>
      {/* Avatar */}
      <View className="mr-3 py-4">
        {isLoading ? (
          <View className="h-16 w-16 items-center justify-center">
            <ActivityIndicator size="small" color={colors.highlight} />
          </View>
        ) : isGroup ? (
          <View
            className="h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.highlight + '20' }}>
            <Icon name="Users" size={24} color={colors.highlight} />
          </View>
        ) : (
          <Avatar src={thread.avatar} name={thread.name} size="lg" />
        )}
      </View>

      {/* Content with border */}
      <View className="flex-1 flex-row items-center border-b border-border py-4">
        <View className="flex-1">
          <View className="mb-1 flex-row items-center justify-between">
            <ThemedText
              className={`text-base ${hasUnread ? 'font-bold' : 'font-semibold'}`}
              numberOfLines={1}>
              {thread.name}
            </ThemedText>
            <ThemedText className="text-xs opacity-50">
              {thread.lastMessage ? formatThreadTimestamp(thread.lastMessage.timestamp) : ''}
            </ThemedText>
          </View>
          <View className="flex-row items-center justify-between">
            <ThemedText
              className={`flex-1 text-sm ${hasUnread ? 'font-medium opacity-80' : 'opacity-50'}`}
              numberOfLines={1}>
              {lastMessagePreview}
            </ThemedText>
          </View>
        </View>

        {/* Message status for last sent message */}
        {thread.lastMessage?.senderId === currentUserId && (
          <View className="ml-2">
            {thread.lastMessage.status === 'read' ? (
              <Icon name="CheckCheck" size={16} color={colors.highlight} />
            ) : thread.lastMessage.status === 'delivered' ? (
              <Icon name="CheckCheck" size={16} color={colors.text} style={{ opacity: 0.5 }} />
            ) : (
              <Icon name="Check" size={16} color={colors.text} style={{ opacity: 0.5 }} />
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const PAGE_SIZE = 50;

export default function MessagesScreen() {
  const t = useT();
  const colors = useThemeColors();
  const { user } = useAuth();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);

  // Scroll state for collapsible title
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const LARGE_TITLE_HEIGHT = 44;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowHeaderTitle(offsetY > LARGE_TITLE_HEIGHT);
  }, []);

  const loadThreads = async (isRefreshing: boolean = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      const response = await getThreads();
      setThreads(response.threads);
      setError(null);
    } catch (err) {
      console.error('Error loading threads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const handleRefresh = () => {
    loadThreads(true);
  };

  const handleThreadPress = async (thread: Thread) => {
    if (loadingThreadId) return; // Prevent double-tap

    setLoadingThreadId(thread.id);
    try {
      // Pre-load thread and messages
      const [threadData, messagesResult] = await Promise.all([
        getThread(thread.id),
        getMessages(thread.id, PAGE_SIZE),
      ]);

      // Navigate with pre-loaded data
      router.push({
        pathname: '/screens/message-thread',
        params: {
          id: thread.id,
          preloadedThread: JSON.stringify(threadData),
          preloadedMessages: JSON.stringify(messagesResult.messages),
          preloadedHasMore: messagesResult.hasMore ? 'true' : 'false',
          preloadedCursor: messagesResult.nextCursor || '',
        },
      });
    } catch (err) {
      console.error('Error loading thread:', err);
      // Fall back to navigating without preloaded data
      router.push(`/screens/message-thread?id=${thread.id}`);
    } finally {
      setLoadingThreadId(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header
          rightComponents={[
            <Avatar
              key="avatar"
              name={user ? `${user.firstName} ${user.lastName}` : ''}
              size="sm"
              link="/screens/settings"
              src={user?.profilePicture}
            />,
          ]}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background">
        <Header
          rightComponents={[
            <Avatar
              key="avatar"
              name={user ? `${user.firstName} ${user.lastName}` : ''}
              size="sm"
              link="/screens/settings"
              src={user?.profilePicture}
            />,
          ]}
        />
        <ErrorState
          title={t('messages.errorTitle')}
          message={error}
          onRetry={() => {
            setLoading(true);
            loadThreads();
          }}
          retryButtonText={t('common.tryAgain')}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header
        title={showHeaderTitle ? t('messages.title') : undefined}
        rightComponents={[
          <Avatar
            key="avatar"
            name={user ? `${user.firstName} ${user.lastName}` : ''}
            size="sm"
            link="/screens/settings"
            src={user?.profilePicture}
          />,
        ]}
      />
      <ScrollView
        className="flex-1 bg-background px-6"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF', colors.highlight]}
            progressBackgroundColor={colors.bg}
          />
        }>
        <LargeTitle title={t('messages.title')} className="pt-2" />

        {/* Threads List */}
        {threads.length === 0 ? (
          <View className="flex-1 items-center justify-center py-16">
            <View
              className="mb-4 rounded-full p-6"
              style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
              <Icon name="MessageSquare" size={48} color={colors.text} style={{ opacity: 0.3 }} />
            </View>
            <ThemedText className="text-center text-lg font-semibold opacity-60">
              {t('messages.noMessages')}
            </ThemedText>
            <ThemedText className="mt-2 text-center opacity-40">
              {t('messages.noMessagesDescription')}
            </ThemedText>
          </View>
        ) : (
          <View>
            {threads.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                onPress={() => handleThreadPress(thread)}
                currentUserId={user?.prefixedId || ''}
                isLoading={loadingThreadId === thread.id}
              />
            ))}
          </View>
        )}

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
