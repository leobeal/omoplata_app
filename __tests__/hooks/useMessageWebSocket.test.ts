import { renderHook, act } from '@testing-library/react-native';

import { useMessageWebSocket } from '../../hooks/useMessageWebSocket';
import reverbClient from '../../api/pusher';
import { Message } from '../../api/messages';

// Mock the reverbClient
jest.mock('../../api/pusher', () => ({
  subscribeToThread: jest.fn(),
  unsubscribeFromThread: jest.fn(),
  isConnected: jest.fn().mockReturnValue(false),
  getSocketId: jest.fn().mockReturnValue(undefined),
  __esModule: true,
  default: {
    subscribeToThread: jest.fn(),
    unsubscribeFromThread: jest.fn(),
    isConnected: jest.fn().mockReturnValue(false),
    getSocketId: jest.fn().mockReturnValue(undefined),
  },
}));

const mockReverbClient = reverbClient as jest.Mocked<typeof reverbClient>;

describe('useMessageWebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should not subscribe when threadId is empty', () => {
      renderHook(() =>
        useMessageWebSocket({
          threadId: '',
          onNewMessage: jest.fn(),
        })
      );

      expect(mockReverbClient.subscribeToThread).not.toHaveBeenCalled();
    });

    it('should subscribe to thread when threadId is provided', () => {
      renderHook(() =>
        useMessageWebSocket({
          threadId: 'thread-123',
          onNewMessage: jest.fn(),
        })
      );

      expect(mockReverbClient.subscribeToThread).toHaveBeenCalledWith(
        'thread-123',
        expect.objectContaining({
          onNewMessage: expect.any(Function),
          onMessageRead: expect.any(Function),
          onTyping: expect.any(Function),
        })
      );
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from thread on unmount', () => {
      const { unmount } = renderHook(() =>
        useMessageWebSocket({
          threadId: 'thread-123',
          onNewMessage: jest.fn(),
        })
      );

      unmount();

      expect(mockReverbClient.unsubscribeFromThread).toHaveBeenCalledWith('thread-123');
    });

    it('should unsubscribe and resubscribe when threadId changes', () => {
      const { rerender } = renderHook(
        ({ threadId }) =>
          useMessageWebSocket({
            threadId,
            onNewMessage: jest.fn(),
          }),
        { initialProps: { threadId: 'thread-1' } }
      );

      expect(mockReverbClient.subscribeToThread).toHaveBeenCalledWith('thread-1', expect.anything());

      rerender({ threadId: 'thread-2' });

      expect(mockReverbClient.unsubscribeFromThread).toHaveBeenCalledWith('thread-1');
      expect(mockReverbClient.subscribeToThread).toHaveBeenCalledWith('thread-2', expect.anything());
    });
  });

  describe('Callbacks', () => {
    it('should pass onNewMessage callback to reverbClient', () => {
      const onNewMessage = jest.fn();

      renderHook(() =>
        useMessageWebSocket({
          threadId: 'thread-123',
          onNewMessage,
        })
      );

      const subscribeCall = mockReverbClient.subscribeToThread.mock.calls[0];
      const callbacks = subscribeCall[1];

      // Simulate receiving a new message
      const mockMessage: Message = {
        id: 'msg-1',
        text: 'Hello!',
        senderId: 'user-1',
        timestamp: '2025-12-20T10:00:00Z',
        status: 'sent',
      };

      callbacks.onNewMessage?.({ message: mockMessage, threadId: 'thread-123' });

      expect(onNewMessage).toHaveBeenCalledWith(mockMessage);
    });

    it('should pass onMessageRead callback to reverbClient', () => {
      const onMessageRead = jest.fn();

      renderHook(() =>
        useMessageWebSocket({
          threadId: 'thread-123',
          onMessageRead,
        })
      );

      const subscribeCall = mockReverbClient.subscribeToThread.mock.calls[0];
      const callbacks = subscribeCall[1];

      // Simulate message read event
      callbacks.onMessageRead?.({
        messageId: 'msg-1',
        userId: 'user-2',
        threadId: 'thread-123',
      });

      expect(onMessageRead).toHaveBeenCalledWith('msg-1', 'user-2');
    });

    it('should pass onTyping callback to reverbClient', () => {
      const onTyping = jest.fn();

      renderHook(() =>
        useMessageWebSocket({
          threadId: 'thread-123',
          onTyping,
        })
      );

      const subscribeCall = mockReverbClient.subscribeToThread.mock.calls[0];
      const callbacks = subscribeCall[1];

      // Simulate typing event
      callbacks.onTyping?.({
        userId: 'user-2',
        userName: 'Jane',
        threadId: 'thread-123',
      });

      expect(onTyping).toHaveBeenCalledWith('user-2', 'Jane');
    });

    it('should handle undefined callbacks gracefully', () => {
      renderHook(() =>
        useMessageWebSocket({
          threadId: 'thread-123',
        })
      );

      const subscribeCall = mockReverbClient.subscribeToThread.mock.calls[0];
      const callbacks = subscribeCall[1];

      // Should not throw when calling callbacks that weren't provided
      expect(() => {
        callbacks.onNewMessage?.({ message: {} as Message, threadId: 'thread-123' });
        callbacks.onMessageRead?.({ messageId: 'msg-1', userId: 'user-1', threadId: 'thread-123' });
        callbacks.onTyping?.({ userId: 'user-1', userName: 'Test', threadId: 'thread-123' });
      }).not.toThrow();
    });
  });

  describe('Return Values', () => {
    it('should return isConnected status', () => {
      mockReverbClient.isConnected.mockReturnValue(true);

      const { result } = renderHook(() =>
        useMessageWebSocket({
          threadId: 'thread-123',
        })
      );

      expect(result.current.isConnected).toBe(true);
    });

    it('should return socketId', () => {
      mockReverbClient.getSocketId.mockReturnValue('socket-456');

      const { result } = renderHook(() =>
        useMessageWebSocket({
          threadId: 'thread-123',
        })
      );

      expect(result.current.socketId).toBe('socket-456');
    });

    it('should return undefined socketId when not connected', () => {
      mockReverbClient.getSocketId.mockReturnValue(undefined);

      const { result } = renderHook(() =>
        useMessageWebSocket({
          threadId: 'thread-123',
        })
      );

      expect(result.current.socketId).toBeUndefined();
    });
  });

  describe('Callback Updates', () => {
    it('should use latest callback when callback changes', () => {
      const onNewMessage1 = jest.fn();
      const onNewMessage2 = jest.fn();

      const { rerender } = renderHook(
        ({ onNewMessage }) =>
          useMessageWebSocket({
            threadId: 'thread-123',
            onNewMessage,
          }),
        { initialProps: { onNewMessage: onNewMessage1 } }
      );

      // Update callback
      rerender({ onNewMessage: onNewMessage2 });

      // Get the callback that was passed to subscribeToThread
      const subscribeCall = mockReverbClient.subscribeToThread.mock.calls[0];
      const callbacks = subscribeCall[1];

      // Simulate receiving a message
      const mockMessage: Message = {
        id: 'msg-1',
        text: 'Hello!',
        senderId: 'user-1',
        timestamp: '2025-12-20T10:00:00Z',
        status: 'sent',
      };

      callbacks.onNewMessage?.({ message: mockMessage, threadId: 'thread-123' });

      // The latest callback should be called via ref
      expect(onNewMessage2).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid threadId changes', () => {
      const { rerender } = renderHook(
        ({ threadId }) =>
          useMessageWebSocket({
            threadId,
            onNewMessage: jest.fn(),
          }),
        { initialProps: { threadId: 'thread-1' } }
      );

      rerender({ threadId: 'thread-2' });
      rerender({ threadId: 'thread-3' });
      rerender({ threadId: 'thread-4' });

      // Should have subscribed to all threads and unsubscribed from previous ones
      expect(mockReverbClient.subscribeToThread).toHaveBeenCalledTimes(4);
      expect(mockReverbClient.unsubscribeFromThread).toHaveBeenCalledTimes(3);
    });

    it('should not resubscribe when same threadId is provided', () => {
      const { rerender } = renderHook(
        ({ threadId }) =>
          useMessageWebSocket({
            threadId,
            onNewMessage: jest.fn(),
          }),
        { initialProps: { threadId: 'thread-1' } }
      );

      rerender({ threadId: 'thread-1' });
      rerender({ threadId: 'thread-1' });

      // Should only subscribe once
      expect(mockReverbClient.subscribeToThread).toHaveBeenCalledTimes(1);
    });
  });
});
