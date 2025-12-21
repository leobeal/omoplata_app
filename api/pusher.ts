// Pusher/Reverb client for real-time messaging
import Pusher, { Channel } from 'pusher-js';

import { getAuthToken } from './client';
import { API_CONFIG, getPusherAppKey, getReverbHost, isDevelopment } from './config';
import { Message } from './messages';

// Enable Pusher logging in development
if (__DEV__) {
  Pusher.logToConsole = true;
}

interface NewMessageEvent {
  message: Message;
  threadId: string;
}

interface MessageReadEvent {
  messageId: string;
  userId: string;
  threadId: string;
}

interface TypingEvent {
  userId: string;
  userName: string;
  threadId: string;
}

type EventCallback<T> = (data: T) => void;

class ReverbClient {
  private pusher: Pusher | null = null;
  private userChannel: Channel | null = null;
  private threadChannels: Map<string, Channel> = new Map();
  private userId: string | null = null;
  private pendingSubscriptions: Map<
    string,
    {
      onNewMessage?: EventCallback<NewMessageEvent>;
      onMessageRead?: EventCallback<MessageReadEvent>;
      onTyping?: EventCallback<TypingEvent>;
    }
  > = new Map();

  /**
   * Initialize and connect to Reverb
   * Gracefully handles connection failures - app continues to work without real-time updates
   */
  connect(userId: string): void {
    if (this.pusher) {
      console.log('[Reverb] Already connected');
      return;
    }

    this.userId = userId;
    const token = getAuthToken();

    if (!token) {
      console.log('[Reverb] ⚠️ No auth token available, skipping connection');
      return;
    }

    const reverbHost = getReverbHost();
    const isDevEnv = isDevelopment();

    console.log('[Reverb] 🔄 Connecting to Reverb...', { host: reverbHost, isDev: isDevEnv });

    try {
      this.pusher = new Pusher(getPusherAppKey(), {
        wsHost: reverbHost,
        wsPort: 443,
        wssPort: 443,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        enableStats: false,
        cluster: '', // Required but not used for Reverb
        // Shorter timeouts to fail fast when WebSocket is unavailable
        activityTimeout: 10000, // 10s before sending ping (default: 120s)
        pongTimeout: 5000, // 5s to wait for pong response (default: 30s)
        authorizer: (channel) => ({
          authorize: async (socketId, callback) => {
            // Use AbortController for 5 second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
              console.log('[Reverb] 🔐 Authorizing channel:', channel.name);
              const authUrl = `${API_CONFIG.baseUrl}/broadcasting/auth`;
              const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

              if (!response.ok) {
                const errorBody = await response.text();
                console.warn('[Reverb] ⚠️ Auth failed:', response.status, errorBody);
                callback(new Error(`Auth failed: ${response.status}`), null);
                return;
              }

              const data = await response.json();
              console.log('[Reverb] ✅ Channel authorized:', channel.name);
              callback(null, data);
            } catch (error) {
              clearTimeout(timeoutId);
              const message =
                error instanceof Error && error.name === 'AbortError'
                  ? 'Auth request timed out'
                  : String(error);
              console.warn('[Reverb] ⚠️ Auth error:', message);
              callback(new Error(message), null);
            }
          },
        }),
      });

      // Connection event handlers
      this.pusher.connection.bind('connected', () => {
        console.log('[Reverb] ✅ Connected! Socket ID:', this.pusher?.connection.socket_id);
        this.subscribeToUserChannel();
        this.processPendingSubscriptions();
      });

      this.pusher.connection.bind('error', (error: Error) => {
        console.warn('[Reverb] ⚠️ Connection error:', error);
        // Don't crash - just log the error and continue without real-time updates
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('[Reverb] 🔌 Disconnected');
      });

      this.pusher.connection.bind(
        'state_change',
        (states: { current: string; previous: string }) => {
          console.log('[Reverb] 📊 State change:', states.previous, '→', states.current);
        }
      );

      this.pusher.connection.bind('unavailable', () => {
        console.warn('[Reverb] ⚠️ WebSocket unavailable - real-time updates disabled');
      });

      this.pusher.connection.bind('failed', () => {
        console.warn('[Reverb] ⚠️ WebSocket connection failed - real-time updates disabled');
      });
    } catch (error) {
      console.warn('[Reverb] ⚠️ Failed to initialize WebSocket connection:', error);
      this.pusher = null;
      // App continues to work without real-time updates
    }
  }

  /**
   * Subscribe to user's private channel for notifications
   */
  private subscribeToUserChannel(): void {
    if (!this.pusher || !this.userId) return;

    try {
      const channelName = `private-user.${this.userId}`;
      console.log('[Reverb] 📌 Subscribing to user channel:', channelName);

      this.userChannel = this.pusher.subscribe(channelName);

      this.userChannel.bind('pusher:subscription_succeeded', () => {
        console.log('[Reverb] ✅ Subscribed to user channel');
      });

      this.userChannel.bind('pusher:subscription_error', (error: Error) => {
        console.warn('[Reverb] ⚠️ User channel subscription error:', error);
      });
    } catch (error) {
      console.warn('[Reverb] ⚠️ Failed to subscribe to user channel:', error);
    }
  }

  /**
   * Process any pending subscriptions after connection is established
   */
  private processPendingSubscriptions(): void {
    if (this.pendingSubscriptions.size === 0) return;

    console.log('[Reverb] 📋 Processing pending subscriptions:', this.pendingSubscriptions.size);

    this.pendingSubscriptions.forEach((callbacks, threadId) => {
      this.doSubscribeToThread(threadId, callbacks);
    });

    this.pendingSubscriptions.clear();
  }

  /**
   * Subscribe to a thread channel for real-time updates
   * If userId is provided and not connected, will attempt lazy connection
   */
  subscribeToThread(
    threadId: string,
    callbacks: {
      onNewMessage?: EventCallback<NewMessageEvent>;
      onMessageRead?: EventCallback<MessageReadEvent>;
      onTyping?: EventCallback<TypingEvent>;
    },
    userId?: string
  ): void {
    if (this.threadChannels.has(threadId)) {
      console.log('[Reverb] Already subscribed to thread:', threadId);
      return;
    }

    // If not connected yet, try to connect lazily if we have a userId
    if (!this.isConnected()) {
      if (userId && !this.pusher) {
        console.log('[Reverb] 🔄 Lazy connecting for thread subscription...');
        this.connect(userId);
      }
      console.log('[Reverb] ⏳ Connection not ready, queuing subscription for thread:', threadId);
      this.pendingSubscriptions.set(threadId, callbacks);
      return;
    }

    this.doSubscribeToThread(threadId, callbacks);
  }

  /**
   * Internal method to actually subscribe to a thread channel
   */
  private doSubscribeToThread(
    threadId: string,
    callbacks: {
      onNewMessage?: EventCallback<NewMessageEvent>;
      onMessageRead?: EventCallback<MessageReadEvent>;
      onTyping?: EventCallback<TypingEvent>;
    }
  ): void {
    if (!this.pusher) {
      console.log('[Reverb] ⚠️ No pusher instance, cannot subscribe to thread');
      return;
    }

    try {
      const channelName = `private-thread.${threadId}`;
      console.log('[Reverb] 📌 Subscribing to thread channel:', channelName);

      const channel = this.pusher.subscribe(channelName);
      this.threadChannels.set(threadId, channel);

      channel.bind('pusher:subscription_succeeded', () => {
        console.log('[Reverb] ✅ Subscribed to thread:', threadId);
      });

      channel.bind('pusher:subscription_error', (error: Error) => {
        console.warn('[Reverb] ⚠️ Thread subscription error:', error);
      });

      // Debug: Log ALL events on this channel
      channel.bind_global((eventName: string, data: unknown) => {
        console.log('[Reverb] 🔔 Event received:', eventName, JSON.stringify(data));
      });

      // Bind to events
      // Note: Event names must match Laravel's broadcastAs() - uses snake_case
      if (callbacks.onNewMessage) {
        channel.bind('new_message', (data: NewMessageEvent) => {
          console.log('[Reverb] 📩 New message in thread:', threadId, JSON.stringify(data));
          callbacks.onNewMessage!(data);
        });
      }

      if (callbacks.onMessageRead) {
        channel.bind('message_read', (data: MessageReadEvent) => {
          console.log('[Reverb] 👁️ Message read in thread:', threadId);
          callbacks.onMessageRead!(data);
        });
      }

      if (callbacks.onTyping) {
        channel.bind('user_typing', (data: TypingEvent) => {
          console.log('[Reverb] ⌨️ User typing in thread:', threadId);
          callbacks.onTyping!(data);
        });
      }
    } catch (error) {
      console.warn('[Reverb] ⚠️ Failed to subscribe to thread:', threadId, error);
    }
  }

  /**
   * Unsubscribe from a thread channel
   */
  unsubscribeFromThread(threadId: string): void {
    try {
      // Remove from pending if it was queued
      this.pendingSubscriptions.delete(threadId);

      const channel = this.threadChannels.get(threadId);
      if (channel && this.pusher) {
        const channelName = `private-thread.${threadId}`;
        console.log('[Reverb] 📌 Unsubscribing from thread:', channelName);
        this.pusher.unsubscribe(channelName);
        this.threadChannels.delete(threadId);
      }
    } catch (error) {
      console.warn('[Reverb] ⚠️ Failed to unsubscribe from thread:', threadId, error);
    }
  }

  /**
   * Disconnect from Reverb
   */
  disconnect(): void {
    try {
      if (this.pusher) {
        console.log('[Reverb] 🔌 Disconnecting...');
        this.pusher.disconnect();
        this.pusher = null;
        this.userChannel = null;
        this.threadChannels.clear();
        this.pendingSubscriptions.clear();
        this.userId = null;
      }
    } catch (error) {
      console.warn('[Reverb] ⚠️ Failed to disconnect:', error);
      // Clean up state anyway
      this.pusher = null;
      this.userChannel = null;
      this.threadChannels.clear();
      this.pendingSubscriptions.clear();
      this.userId = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    try {
      return this.pusher?.connection?.state === 'connected';
    } catch {
      return false;
    }
  }

  /**
   * Get socket ID (needed for excluding self from broadcasts)
   */
  getSocketId(): string | undefined {
    try {
      return this.pusher?.connection?.socket_id;
    } catch {
      return undefined;
    }
  }
}

// Singleton instance
export const reverbClient = new ReverbClient();

export default reverbClient;
