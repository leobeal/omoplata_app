import { useEffect, useRef } from 'react';

import { Message } from '@/api/messages';
import reverbClient from '@/api/pusher';

interface UseMessageWebSocketOptions {
  threadId: string;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string, userId: string) => void;
  onTyping?: (userId: string, userName: string) => void;
}

/**
 * Hook for real-time message updates via Reverb/Pusher
 */
export function useMessageWebSocket({
  threadId,
  onNewMessage,
  onMessageRead,
  onTyping,
}: UseMessageWebSocketOptions) {
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageReadRef = useRef(onMessageRead);
  const onTypingRef = useRef(onTyping);

  // Keep refs updated
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onMessageReadRef.current = onMessageRead;
    onTypingRef.current = onTyping;
  }, [onNewMessage, onMessageRead, onTyping]);

  useEffect(() => {
    if (!threadId) return;

    // Subscribe to thread channel
    reverbClient.subscribeToThread(threadId, {
      onNewMessage: (data) => {
        onNewMessageRef.current?.(data.message);
      },
      onMessageRead: (data) => {
        onMessageReadRef.current?.(data.messageId, data.userId);
      },
      onTyping: (data) => {
        onTypingRef.current?.(data.userId, data.userName);
      },
    });

    // Cleanup - unsubscribe when leaving thread
    return () => {
      reverbClient.unsubscribeFromThread(threadId);
    };
  }, [threadId]);

  return {
    isConnected: reverbClient.isConnected(),
    socketId: reverbClient.getSocketId(),
  };
}

export default useMessageWebSocket;
