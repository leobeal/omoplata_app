import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache durations in milliseconds
 */
export const CACHE_DURATIONS = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 1 * 60 * 60 * 1000, // 1 hour
  LONG: 4 * 60 * 60 * 1000, // 4 hours
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  APP_CONFIG: '@omoplata/cache/app_config',
  CLASSES: '@omoplata/cache/classes',
  INVOICES: '@omoplata/cache/invoices',
  MEMBERSHIP: '@omoplata/cache/membership',
  PROFILE: '@omoplata/cache/profile',
  PAYMENT_METHODS: '@omoplata/cache/payment_methods',
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version?: number;
}

/**
 * Get cached data if it exists and is not expired
 */
export async function getFromCache<T>(
  key: string,
  maxAge: number = CACHE_DURATIONS.MEDIUM
): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;

    if (age > maxAge) {
      // Cache expired, remove it
      await AsyncStorage.removeItem(key);
      console.log(`[Cache] Expired: ${key}`);
      return null;
    }

    console.log(`[Cache] Hit: ${key} (age: ${Math.round(age / 1000)}s)`);
    return entry.data;
  } catch (error) {
    console.error(`[Cache] Error reading ${key}:`, error);
    return null;
  }
}

/**
 * Get cached data even if expired (for offline fallback)
 * Returns the data along with whether it's stale
 */
export async function getFromCacheWithStale<T>(
  key: string,
  maxAge: number = CACHE_DURATIONS.MEDIUM
): Promise<{ data: T | null; isStale: boolean; age: number | null }> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) {
      return { data: null, isStale: false, age: null };
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;
    const isStale = age > maxAge;

    console.log(`[Cache] ${isStale ? 'Stale' : 'Fresh'}: ${key} (age: ${Math.round(age / 1000)}s)`);
    return { data: entry.data, isStale, age };
  } catch (error) {
    console.error(`[Cache] Error reading ${key}:`, error);
    return { data: null, isStale: false, age: null };
  }
}

/**
 * Save data to cache
 */
export async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
    console.log(`[Cache] Saved: ${key}`);
  } catch (error) {
    console.error(`[Cache] Error saving ${key}:`, error);
  }
}

/**
 * Remove a specific cache entry
 */
export async function removeFromCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`[Cache] Removed: ${key}`);
  } catch (error) {
    console.error(`[Cache] Error removing ${key}:`, error);
  }
}

/**
 * Clear all cache entries
 */
export async function clearAllCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter((key) => key.startsWith('@omoplata/cache/'));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    console.log('[Cache] Cleared all cache');
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}

/**
 * Clear user-specific cache (classes, invoices, membership, etc.)
 * Call this when user logs out or switches profiles
 */
export async function clearUserCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    // Clear all cache keys except app_config (which is tenant-level, not user-level)
    const userCacheKeys = allKeys.filter(
      (key) => key.startsWith('@omoplata/cache/') && !key.includes('app_config')
    );
    if (userCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(userCacheKeys);
    }
    console.log('[Cache] Cleared user cache');
  } catch (error) {
    console.error('[Cache] Error clearing user cache:', error);
  }
}

/**
 * Get cache age in a human-readable format
 */
export function formatCacheAge(ageMs: number | null): string {
  if (ageMs === null) return '';

  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
