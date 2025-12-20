import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';

import {
  formatMessageDateHeader,
  formatMessageTimestamp,
  getMessages,
  getParticipant,
  getThread,
  isCurrentUserMessage,
  markThreadAsRead,
  Message,
  sendMessage,
  Thread,
} from '@/api/messages';
import Avatar from '@/components/Avatar';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';
import { useMessageWebSocket } from '@/hooks/useMessageWebSocket';

interface MessageGroup {
  date: string;
  messages: Message[];
}

function MessageBubble({
  message,
  thread,
  isFirst,
  isLast,
  currentUserId,
}: {
  message: Message;
  thread: Thread;
  isFirst: boolean;
  isLast: boolean;
  currentUserId: string;
}) {
  const colors = useThemeColors();
  const isOwn = isCurrentUserMessage(message.senderId, currentUserId);
  const sender = getParticipant(thread, message.senderId);

  // Show sender name for group chats on first message of a group
  const showSenderName = !isOwn && thread.type === 'group' && isFirst;

  return (
    <View
      className={`mb-1 flex-row ${isFirst ? 'mt-3' : ''} ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for group messages (other users) */}
      {!isOwn && thread.type === 'group' && (
        <View className="mr-2 w-8 justify-end">
          {isLast && <Avatar src={sender?.avatar} name={sender?.name || 'User'} size="xs" />}
        </View>
      )}

      <View className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showSenderName && (
          <ThemedText className="mb-1 px-3 text-sm font-medium opacity-60">
            {sender?.name || 'Unknown'}
          </ThemedText>
        )}
        <View
          className={`rounded-2xl px-4 py-2.5 ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`}
          style={{
            backgroundColor: isOwn ? colors.highlight : colors.secondary,
          }}>
          <ThemedText className="text-base" style={{ color: isOwn ? 'white' : colors.text }}>
            {message.text}
          </ThemedText>
        </View>
        {isLast && (
          <View className={`mt-1 flex-row items-center px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <ThemedText className="text-xs opacity-40">
              {formatMessageTimestamp(message.timestamp)}
            </ThemedText>
            {isOwn && (
              <View className={isOwn ? 'mr-1' : 'ml-1'}>
                {message.status === 'read' ? (
                  <Icon name="CheckCheck" size={12} color={colors.highlight} />
                ) : message.status === 'delivered' ? (
                  <Icon name="CheckCheck" size={12} color={colors.text} style={{ opacity: 0.4 }} />
                ) : (
                  <Icon name="Check" size={12} color={colors.text} style={{ opacity: 0.4 }} />
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function DateHeader({ date }: { date: string }) {
  const colors = useThemeColors();

  return (
    <View className="my-4 items-center">
      <View
        className="rounded-full px-3 py-1"
        style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
        <ThemedText className="text-sm font-medium opacity-60">{date}</ThemedText>
      </View>
    </View>
  );
}

const PAGE_SIZE = 50;

interface MessageThreadParams {
  id: string;
  preloadedThread?: string;
  preloadedMessages?: string;
  preloadedHasMore?: string;
  preloadedCursor?: string;
}

export default function MessageThreadScreen() {
  const params = useLocalSearchParams<MessageThreadParams>();
  const { id, preloadedThread, preloadedMessages, preloadedHasMore, preloadedCursor } = params;
  const t = useT();
  const colors = useThemeColors();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const currentUserId = user?.prefixedId || '';

  // Parse preloaded data if available
  const initialThread = preloadedThread ? (JSON.parse(preloadedThread) as Thread) : null;
  const initialMessages = preloadedMessages ? (JSON.parse(preloadedMessages) as Message[]) : [];
  const initialHasMore = preloadedHasMore === 'true';
  const initialCursor = preloadedCursor || undefined;

  const [thread, setThread] = useState<Thread | null>(initialThread);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(!initialThread);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const prevMessageCount = useRef(0);

  // Handle new messages from WebSocket
  const handleNewMessage = useCallback(
    (message: Message) => {
      // Don't add if message already exists (e.g., we sent it)
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      // Mark as read
      if (id) {
        markThreadAsRead(id);
      }
    },
    [id]
  );

  // Connect to WebSocket for real-time updates
  useMessageWebSocket({
    threadId: id || '',
    onNewMessage: handleNewMessage,
  });

  useEffect(() => {
    // Skip loading if we have preloaded data
    if (initialThread) {
      markThreadAsRead(id || '');
      return;
    }
    loadData();
  }, [id]);

  // Scroll to bottom when messages are first loaded
  useEffect(() => {
    if (!initialScrollDone && messages.length > 0 && !loading) {
      // Double requestAnimationFrame to ensure layout is fully complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
          setInitialScrollDone(true);
          prevMessageCount.current = messages.length;
        });
      });
    }
  }, [messages.length, loading, initialScrollDone]);

  const loadData = async () => {
    if (!id) return;

    try {
      const [threadData, messagesResult] = await Promise.all([
        getThread(id),
        getMessages(id, PAGE_SIZE),
      ]);
      setThread(threadData);
      setMessages(messagesResult.messages);
      setHasMore(messagesResult.hasMore);
      setCursor(messagesResult.nextCursor);

      if (threadData) {
        markThreadAsRead(id);
      }
    } catch (err) {
      console.error('Error loading thread:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!id || loadingMore || !hasMore || !cursor) return;

    setLoadingMore(true);
    try {
      const result = await getMessages(id, PAGE_SIZE, cursor);
      // Prepend older messages to the beginning
      setMessages((prev) => [...result.messages, ...prev]);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !id || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMessage = await sendMessage(id, { text });
      // Add message only if it doesn't already exist (prevent duplicates from WebSocket race)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    } catch (err) {
      console.error('Error sending message:', err);
      // Restore the input text on error
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  // Group messages by date (with deduplication)
  const groupMessagesByDate = useCallback((msgs: Message[]): MessageGroup[] => {
    const groups: { [key: string]: Message[] } = {};
    const seenIds = new Set<string>();

    msgs.forEach((msg) => {
      // Skip duplicates
      if (seenIds.has(msg.id)) {
        return;
      }
      seenIds.add(msg.id);

      const dateKey = formatMessageDateHeader(msg.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
  }, []);

  const messageGroups = groupMessagesByDate(messages);

  // Header subtitle based on thread type
  const getSubtitle = () => {
    if (!thread) return '';
    if (thread.type === 'group') {
      return t('messages.members', { count: thread.memberCount || thread.participants.length });
    }
    const participant = thread.participants[0];
    if (participant?.role === 'instructor') {
      return t('messages.instructor');
    } else if (participant?.role === 'admin') {
      return t('messages.admin');
    }
    return '';
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title={t('messages.loading')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (!thread) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title={t('messages.title')} />
        <View className="flex-1 items-center justify-center">
          <ThemedText className="opacity-50">{t('messages.threadNotFound')}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <Header
        showBackButton
        title={thread.name}
        subtitle={getSubtitle()}
        rightComponents={
          thread.type === 'group'
            ? [
                <View
                  key="group-icon"
                  className="h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.highlight + '20' }}>
                  <Icon name="Users" size={16} color={colors.highlight} />
                </View>,
              ]
            : thread.avatar
              ? [<Avatar key="avatar" src={thread.avatar} name={thread.name} size="sm" />]
              : undefined
        }
      />

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messageGroups}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 }}
        onContentSizeChange={() => {
          // Auto-scroll for new messages if user is near bottom (initial scroll handled by useEffect)
          if (initialScrollDone) {
            const currentCount = messages.length;
            if (currentCount > prevMessageCount.current && shouldAutoScroll) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
            prevMessageCount.current = currentCount;
          }
        }}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
          setShouldAutoScroll(isNearBottom);

          // Load more when ~25% from top OR within 800px of top (whichever comes first)
          // This gives enough buffer for smooth scrolling while new messages load
          const scrollableHeight = contentSize.height - layoutMeasurement.height;
          const scrollPercentage = scrollableHeight > 0 ? contentOffset.y / scrollableHeight : 1;
          const isNearTop = scrollPercentage < 0.25 || contentOffset.y < 800;

          if (isNearTop && hasMore && !loadingMore) {
            loadMoreMessages();
          }
        }}
        scrollEventThrottle={16}
        ListHeaderComponent={
          loadingMore ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
        renderItem={({ item: group }) => (
          <View>
            <DateHeader date={group.date} />
            {group.messages.map((message, index) => {
              const prevMessage = group.messages[index - 1];
              const nextMessage = group.messages[index + 1];
              const isFirst = !prevMessage || prevMessage.senderId !== message.senderId;
              const isLast = !nextMessage || nextMessage.senderId !== message.senderId;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  thread={thread}
                  isFirst={isFirst}
                  isLast={isLast}
                  currentUserId={currentUserId}
                />
              );
            })}
          </View>
        )}
      />

      {/* Input Area */}
      <View
        className="flex-row items-end border-t border-border px-4 py-3"
        style={{ backgroundColor: colors.bg }}>
        <View
          className="mr-3 flex-1 flex-row items-end rounded-3xl px-4"
          style={{ backgroundColor: colors.secondary }}>
          <TextInput
            className="max-h-24 flex-1 py-3 text-base"
            style={{ color: colors.text }}
            placeholder={t('messages.placeholder')}
            placeholderTextColor={colors.text + '50'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlignVertical="center"
          />
        </View>
        <Pressable
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: inputText.trim() ? colors.highlight : colors.secondary,
          }}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}>
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icon
              name="Send"
              size={20}
              color={inputText.trim() ? 'white' : colors.text}
              style={{ opacity: inputText.trim() ? 1 : 0.3 }}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
