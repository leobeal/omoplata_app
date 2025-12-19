// Pusher/Reverb client for real-time messaging
import Pusher, { Channel } from 'pusher-js';

import { getAuthToken } from './client';
import { API_CONFIG } from './config';
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

  /**
   * Initialize and connect to Reverb
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

    console.log('[Reverb] 🔄 Connecting to Reverb...');

    this.pusher = new Pusher('generate-secure-key', {
      wsHost: 'reverb.omoplata.eu',
      wsPort: 443,
      wssPort: 443,
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
      cluster: '', // Required but not used for Reverb
      authorizer: (channel) => ({
        authorize: async (socketId, callback) => {
          try {
            console.log('[Reverb] 🔐 Authorizing channel:', channel.name);
            const response = await fetch(`${API_CONFIG.baseUrl}/broadcasting/auth`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAuthToken()}`,
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            });

            if (!response.ok) {
              console.error('[Reverb] ❌ Auth failed:', response.status);
              callback(new Error(`Auth failed: ${response.status}`), null);
              return;
            }

            const data = await response.json();
            console.log('[Reverb] ✅ Channel authorized:', channel.name);
            callback(null, data);
          } catch (error) {
            console.error('[Reverb] ❌ Auth error:', error);
            callback(error as Error, null);
          }
        },
      }),
    });

    // Connection event handlers
    this.pusher.connection.bind('connected', () => {
      console.log('[Reverb] ✅ Connected! Socket ID:', this.pusher?.connection.socket_id);
      this.subscribeToUserChannel();
    });

    this.pusher.connection.bind('error', (error: Error) => {
      console.error('[Reverb] ❌ Connection error:', error);
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('[Reverb] 🔌 Disconnected');
    });

    this.pusher.connection.bind('state_change', (states: { current: string; previous: string }) => {
      console.log('[Reverb] 📊 State change:', states.previous, '→', states.current);
    });
  }

  /**
   * Subscribe to user's private channel for notifications
   */
  private subscribeToUserChannel(): void {
    if (!this.pusher || !this.userId) return;

    const channelName = `private-user.${this.userId}`;
    console.log('[Reverb] 📌 Subscribing to user channel:', channelName);

    this.userChannel = this.pusher.subscribe(channelName);

    this.userChannel.bind('pusher:subscription_succeeded', () => {
      console.log('[Reverb] ✅ Subscribed to user channel');
    });

    this.userChannel.bind('pusher:subscription_error', (error: Error) => {
      console.error('[Reverb] ❌ User channel subscription error:', error);
    });
  }

  /**
   * Subscribe to a thread channel for real-time updates
   */
  subscribeToThread(
    threadId: string,
    callbacks: {
      onNewMessage?: EventCallback<NewMessageEvent>;
      onMessageRead?: EventCallback<MessageReadEvent>;
      onTyping?: EventCallback<TypingEvent>;
    }
  ): void {
    if (!this.pusher) {
      console.log('[Reverb] ⚠️ Not connected, cannot subscribe to thread');
      return;
    }

    if (this.threadChannels.has(threadId)) {
      console.log('[Reverb] Already subscribed to thread:', threadId);
      return;
    }

    const channelName = `private-thread.${threadId}`;
    console.log('[Reverb] 📌 Subscribing to thread channel:', channelName);

    const channel = this.pusher.subscribe(channelName);
    this.threadChannels.set(threadId, channel);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Reverb] ✅ Subscribed to thread:', threadId);
    });

    channel.bind('pusher:subscription_error', (error: Error) => {
      console.error('[Reverb] ❌ Thread subscription error:', error);
    });

    // Bind to events
    if (callbacks.onNewMessage) {
      channel.bind('NewMessage', (data: NewMessageEvent) => {
        console.log('[Reverb] 📩 New message in thread:', threadId);
        callbacks.onNewMessage!(data);
      });
    }

    if (callbacks.onMessageRead) {
      channel.bind('MessageRead', (data: MessageReadEvent) => {
        console.log('[Reverb] 👁️ Message read in thread:', threadId);
        callbacks.onMessageRead!(data);
      });
    }

    if (callbacks.onTyping) {
      channel.bind('UserTyping', (data: TypingEvent) => {
        console.log('[Reverb] ⌨️ User typing in thread:', threadId);
        callbacks.onTyping!(data);
      });
    }
  }

  /**
   * Unsubscribe from a thread channel
   */
  unsubscribeFromThread(threadId: string): void {
    const channel = this.threadChannels.get(threadId);
    if (channel && this.pusher) {
      const channelName = `private-thread.${threadId}`;
      console.log('[Reverb] 📌 Unsubscribing from thread:', channelName);
      this.pusher.unsubscribe(channelName);
      this.threadChannels.delete(threadId);
    }
  }

  /**
   * Disconnect from Reverb
   */
  disconnect(): void {
    if (this.pusher) {
      console.log('[Reverb] 🔌 Disconnecting...');
      this.pusher.disconnect();
      this.pusher = null;
      this.userChannel = null;
      this.threadChannels.clear();
      this.userId = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.pusher?.connection.state === 'connected';
  }

  /**
   * Get socket ID (needed for excluding self from broadcasts)
   */
  getSocketId(): string | undefined {
    return this.pusher?.connection.socket_id;
  }
}

// Singleton instance
export const reverbClient = new ReverbClient();

export default reverbClient;
