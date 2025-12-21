import { useEffect, useRef, useState } from 'react';

import { Message } from '@/api/messages';
import reverbClient from '@/api/pusher';

interface UseMessageWebSocketOptions {
  threadId: string;
  userId?: string; // Required for lazy connection
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string, userId: string) => void;
  onTyping?: (userId: string, userName: string) => void;
}

/**
 * Hook for real-time message updates via Reverb/Pusher
 * Gracefully handles WebSocket unavailability - messaging still works via REST API
 */
export function useMessageWebSocket({
  threadId,
  userId,
  onNewMessage,
  onMessageRead,
  onTyping,
}: UseMessageWebSocketOptions) {
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageReadRef = useRef(onMessageRead);
  const onTypingRef = useRef(onTyping);
  const [isConnected, setIsConnected] = useState(false);

  // Keep refs updated
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onMessageReadRef.current = onMessageRead;
    onTypingRef.current = onTyping;
  }, [onNewMessage, onMessageRead, onTyping]);

  useEffect(() => {
    if (!threadId) {
      console.log('[useMessageWebSocket] No threadId, skipping subscription');
      return;
    }

    try {
      const connected = reverbClient.isConnected();
      setIsConnected(connected);
      console.log('[useMessageWebSocket] Subscribing to thread:', threadId);
      console.log('[useMessageWebSocket] Reverb connected:', connected);

      // Subscribe to thread channel (passes userId for lazy connection)
      reverbClient.subscribeToThread(
        threadId,
        {
          onNewMessage: (data) => {
            console.log('[useMessageWebSocket] onNewMessage callback triggered:', data);
            onNewMessageRef.current?.(data.message);
          },
          onMessageRead: (data) => {
            onMessageReadRef.current?.(data.messageId, data.userId);
          },
          onTyping: (data) => {
            onTypingRef.current?.(data.userId, data.userName);
          },
        },
        userId
      );
    } catch (error) {
      console.warn(
        '[useMessageWebSocket] WebSocket subscription failed, falling back to REST:',
        error
      );
      setIsConnected(false);
    }

    // Cleanup - unsubscribe when leaving thread
    return () => {
      try {
        console.log('[useMessageWebSocket] Unsubscribing from thread:', threadId);
        reverbClient.unsubscribeFromThread(threadId);
      } catch (error) {
        console.warn('[useMessageWebSocket] Failed to unsubscribe:', error);
      }
    };
  }, [threadId, userId]);

  // Safely get socket ID
  const getSocketId = (): string | undefined => {
    try {
      return reverbClient.getSocketId();
    } catch {
      return undefined;
    }
  };

  return {
    isConnected,
    socketId: getSocketId(),
  };
}

export default useMessageWebSocket;
