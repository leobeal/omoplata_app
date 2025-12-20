import Pusher, { Channel } from 'pusher-js';

import { reverbClient } from '../../api/pusher';
import * as client from '../../api/client';
import * as config from '../../api/config';

// Mock Pusher
jest.mock('pusher-js');

// Mock client module
jest.mock('../../api/client', () => ({
  getAuthToken: jest.fn(),
}));

// Mock config module
jest.mock('../../api/config', () => ({
  API_CONFIG: {
    baseUrl: 'https://test.omoplata.localhost/api',
  },
  getReverbHost: jest.fn().mockReturnValue('reverb.test.localhost'),
  getPusherAppKey: jest.fn().mockReturnValue('omoplatakey'),
  isDevelopment: jest.fn().mockReturnValue(false),
}));

// Mock global __DEV__
(global as unknown as { __DEV__: boolean }).__DEV__ = false;

const MockPusher = Pusher as jest.MockedClass<typeof Pusher>;

describe('ReverbClient', () => {
  let mockPusherInstance: jest.Mocked<Pusher>;
  let mockChannel: jest.Mocked<Channel>;
  let mockConnection: {
    socket_id: string;
    state: string;
    bind: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the singleton state by disconnecting
    reverbClient.disconnect();

    // Setup mock channel
    mockChannel = {
      bind: jest.fn(),
      bind_global: jest.fn(),
      unbind: jest.fn(),
      unbind_all: jest.fn(),
    } as unknown as jest.Mocked<Channel>;

    // Setup mock connection
    mockConnection = {
      socket_id: 'socket-123',
      state: 'disconnected',
      bind: jest.fn(),
    };

    // Setup mock Pusher instance
    mockPusherInstance = {
      connection: mockConnection,
      subscribe: jest.fn().mockReturnValue(mockChannel),
      unsubscribe: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<Pusher>;

    MockPusher.mockImplementation(() => mockPusherInstance);
  });

  afterEach(() => {
    reverbClient.disconnect();
  });

  describe('connect', () => {
    it('should not connect when no auth token is available', () => {
      (client.getAuthToken as jest.Mock).mockReturnValue(null);

      reverbClient.connect('user-123');

      expect(MockPusher).not.toHaveBeenCalled();
      expect(reverbClient.isConnected()).toBe(false);
    });

    it('should connect when auth token is available', () => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');

      reverbClient.connect('user-123');

      expect(MockPusher).toHaveBeenCalledWith('omoplatakey', expect.objectContaining({
        wsHost: 'reverb.test.localhost',
        wsPort: 443,
        wssPort: 443,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        enableStats: false,
        cluster: '',
      }));
    });

    it('should bind connection event handlers', () => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');

      reverbClient.connect('user-123');

      expect(mockConnection.bind).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockConnection.bind).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockConnection.bind).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockConnection.bind).toHaveBeenCalledWith('state_change', expect.any(Function));
    });

    it('should not create multiple connections', () => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');

      reverbClient.connect('user-123');
      reverbClient.connect('user-123');

      expect(MockPusher).toHaveBeenCalledTimes(1);
    });

    it('should subscribe to user channel on connection', () => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');

      reverbClient.connect('user-123');

      // Simulate connection success
      const connectedCallback = mockConnection.bind.mock.calls.find(
        (call) => call[0] === 'connected'
      )?.[1];
      connectedCallback?.();

      expect(mockPusherInstance.subscribe).toHaveBeenCalledWith('private-user.user-123');
    });
  });

  describe('subscribeToThread', () => {
    beforeEach(() => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');
      reverbClient.connect('user-123');

      // Simulate connected state
      mockConnection.state = 'connected';
      const connectedCallback = mockConnection.bind.mock.calls.find(
        (call) => call[0] === 'connected'
      )?.[1];
      connectedCallback?.();
    });

    it('should subscribe to thread channel', () => {
      const callbacks = {
        onNewMessage: jest.fn(),
      };

      reverbClient.subscribeToThread('thread-1', callbacks);

      expect(mockPusherInstance.subscribe).toHaveBeenCalledWith('private-thread.thread-1');
    });

    it('should bind new_message event', () => {
      const onNewMessage = jest.fn();

      reverbClient.subscribeToThread('thread-1', { onNewMessage });

      expect(mockChannel.bind).toHaveBeenCalledWith('new_message', expect.any(Function));
    });

    it('should bind message_read event', () => {
      const onMessageRead = jest.fn();

      reverbClient.subscribeToThread('thread-1', { onMessageRead });

      expect(mockChannel.bind).toHaveBeenCalledWith('message_read', expect.any(Function));
    });

    it('should bind user_typing event', () => {
      const onTyping = jest.fn();

      reverbClient.subscribeToThread('thread-1', { onTyping });

      expect(mockChannel.bind).toHaveBeenCalledWith('user_typing', expect.any(Function));
    });

    it('should not subscribe twice to the same thread', () => {
      reverbClient.subscribeToThread('thread-1', {});
      const subscribeCount = mockPusherInstance.subscribe.mock.calls.filter(
        (call) => call[0] === 'private-thread.thread-1'
      ).length;

      reverbClient.subscribeToThread('thread-1', {});
      const newSubscribeCount = mockPusherInstance.subscribe.mock.calls.filter(
        (call) => call[0] === 'private-thread.thread-1'
      ).length;

      expect(newSubscribeCount).toBe(subscribeCount);
    });

    it('should queue subscription when not connected', () => {
      // Disconnect and reset
      reverbClient.disconnect();
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');

      // Create new pusher instance with disconnected state
      mockConnection.state = 'disconnected';
      reverbClient.connect('user-123');

      const onNewMessage = jest.fn();
      reverbClient.subscribeToThread('thread-pending', { onNewMessage });

      // Should not subscribe yet (not connected)
      const pendingSubscription = mockPusherInstance.subscribe.mock.calls.find(
        (call) => call[0] === 'private-thread.thread-pending'
      );
      expect(pendingSubscription).toBeUndefined();
    });
  });

  describe('unsubscribeFromThread', () => {
    beforeEach(() => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');
      reverbClient.connect('user-123');
      mockConnection.state = 'connected';
      const connectedCallback = mockConnection.bind.mock.calls.find(
        (call) => call[0] === 'connected'
      )?.[1];
      connectedCallback?.();
    });

    it('should unsubscribe from thread channel', () => {
      reverbClient.subscribeToThread('thread-1', {});
      reverbClient.unsubscribeFromThread('thread-1');

      expect(mockPusherInstance.unsubscribe).toHaveBeenCalledWith('private-thread.thread-1');
    });

    it('should handle unsubscribe from non-existent thread gracefully', () => {
      expect(() => reverbClient.unsubscribeFromThread('non-existent')).not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Pusher', () => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');
      reverbClient.connect('user-123');

      reverbClient.disconnect();

      expect(mockPusherInstance.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when not connected', () => {
      expect(() => reverbClient.disconnect()).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(reverbClient.isConnected()).toBe(false);
    });

    it('should return true when connected', () => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');
      reverbClient.connect('user-123');
      mockConnection.state = 'connected';

      expect(reverbClient.isConnected()).toBe(true);
    });
  });

  describe('getSocketId', () => {
    it('should return undefined when not connected', () => {
      expect(reverbClient.getSocketId()).toBeUndefined();
    });

    it('should return socket ID when connected', () => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');
      reverbClient.connect('user-123');

      expect(reverbClient.getSocketId()).toBe('socket-123');
    });
  });

  describe('Authorizer', () => {
    it('should create authorizer with correct configuration', () => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');
      reverbClient.connect('user-123');

      const pusherConfig = MockPusher.mock.calls[0][1];
      expect(pusherConfig.authorizer).toBeDefined();
    });
  });

  describe('Event Callbacks', () => {
    beforeEach(() => {
      (client.getAuthToken as jest.Mock).mockReturnValue('valid-token');
      reverbClient.connect('user-123');
      mockConnection.state = 'connected';
      const connectedCallback = mockConnection.bind.mock.calls.find(
        (call) => call[0] === 'connected'
      )?.[1];
      connectedCallback?.();
    });

    it('should call onNewMessage callback with message data', () => {
      const onNewMessage = jest.fn();
      reverbClient.subscribeToThread('thread-1', { onNewMessage });

      // Find and trigger the new_message event handler
      const newMessageHandler = mockChannel.bind.mock.calls.find(
        (call) => call[0] === 'new_message'
      )?.[1];

      const messageData = {
        message: { id: 'msg-1', text: 'Hello', senderId: 'user-1', timestamp: '2025-12-20T10:00:00Z', status: 'sent' },
        threadId: 'thread-1',
      };

      newMessageHandler?.(messageData);

      expect(onNewMessage).toHaveBeenCalledWith(messageData);
    });

    it('should call onMessageRead callback with read data', () => {
      const onMessageRead = jest.fn();
      reverbClient.subscribeToThread('thread-1', { onMessageRead });

      const messageReadHandler = mockChannel.bind.mock.calls.find(
        (call) => call[0] === 'message_read'
      )?.[1];

      const readData = {
        messageId: 'msg-1',
        userId: 'user-2',
        threadId: 'thread-1',
      };

      messageReadHandler?.(readData);

      expect(onMessageRead).toHaveBeenCalledWith(readData);
    });

    it('should call onTyping callback with typing data', () => {
      const onTyping = jest.fn();
      reverbClient.subscribeToThread('thread-1', { onTyping });

      const typingHandler = mockChannel.bind.mock.calls.find(
        (call) => call[0] === 'user_typing'
      )?.[1];

      const typingData = {
        userId: 'user-2',
        userName: 'Jane',
        threadId: 'thread-1',
      };

      typingHandler?.(typingData);

      expect(onTyping).toHaveBeenCalledWith(typingData);
    });
  });
});
