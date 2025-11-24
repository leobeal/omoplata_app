import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paths, File } from 'expo-file-system';

const CACHE_METADATA_PREFIX = '@omoplata/image_metadata/';
const CACHE_EXPIRY_DAYS = 7; // Cache images for 7 days

/**
 * Convert a Blob to ArrayBuffer using FileReader (React Native compatible)
 */
const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to ArrayBuffer'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

interface ImageCacheMetadata {
  url: string;
  localUri: string;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Generate a cache key from a URL
 */
const getCacheKey = (url: string): string => {
  // Use a simple hash of the URL as the cache key
  return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
};

/**
 * Get the local file path for a cached image
 */
const getLocalPath = (cacheKey: string): string => {
  const fileExtension = '.jpg'; // Default to jpg
  const cacheDir = Paths.cache.uri;
  return `${cacheDir}${cacheKey}${fileExtension}`;
};

/**
 * Check if cached image is still valid
 */
const isCacheValid = (metadata: ImageCacheMetadata): boolean => {
  const now = Date.now();
  return metadata.expiresAt > now;
};

/**
 * Download and cache an image from a URL
 */
export const cacheImage = async (url: string): Promise<string> => {
  try {
    const cacheKey = getCacheKey(url);
    const metadataKey = `${CACHE_METADATA_PREFIX}${cacheKey}`;

    // Check if we already have a valid cached version
    const metadataJson = await AsyncStorage.getItem(metadataKey);
    if (metadataJson) {
      const metadata: ImageCacheMetadata = JSON.parse(metadataJson);

      // Check if cache is still valid
      if (isCacheValid(metadata)) {
        // Verify the file still exists
        const file = new File(metadata.localUri);
        if (file.exists) {
          console.log('Using cached image:', metadata.localUri);
          return metadata.localUri;
        }
      }
    }

    // Download the image
    console.log('Downloading image from:', url);
    const localPath = getLocalPath(cacheKey);
    const file = new File(localPath);

    // Download the image using fetch and save it
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blobToArrayBuffer(blob);

    // Delete existing file if it exists (handles race conditions)
    try {
      await file.delete();
    } catch {
      // File doesn't exist, ignore
    }

    await file.create();
    await file.write(new Uint8Array(arrayBuffer));

    // Save metadata
    const now = Date.now();
    const metadata: ImageCacheMetadata = {
      url,
      localUri: file.uri,
      cachedAt: now,
      expiresAt: now + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };

    await AsyncStorage.setItem(metadataKey, JSON.stringify(metadata));
    console.log('Image cached successfully:', file.uri);

    return file.uri;
  } catch (error) {
    console.error('Failed to cache image:', error);
    throw error;
  }
};

/**
 * Get a cached image if available, otherwise return null
 */
export const getCachedImage = async (url: string): Promise<string | null> => {
  try {
    const cacheKey = getCacheKey(url);
    const metadataKey = `${CACHE_METADATA_PREFIX}${cacheKey}`;

    const metadataJson = await AsyncStorage.getItem(metadataKey);
    if (!metadataJson) {
      return null;
    }

    const metadata: ImageCacheMetadata = JSON.parse(metadataJson);

    // Check if cache is still valid
    if (!isCacheValid(metadata)) {
      return null;
    }

    // Verify the file still exists
    const file = new File(metadata.localUri);
    if (!file.exists) {
      return null;
    }

    return metadata.localUri;
  } catch (error) {
    console.error('Failed to get cached image:', error);
    return null;
  }
};

/**
 * Clear all cached images
 */
export const clearImageCache = async (): Promise<void> => {
  try {
    // Get all AsyncStorage keys
    const keys = await AsyncStorage.getAllKeys();

    // Filter keys that are image metadata
    const metadataKeys = keys.filter((key) => key.startsWith(CACHE_METADATA_PREFIX));

    // Delete all cached files and metadata
    for (const key of metadataKeys) {
      const metadataJson = await AsyncStorage.getItem(key);
      if (metadataJson) {
        const metadata: ImageCacheMetadata = JSON.parse(metadataJson);
        try {
          const file = new File(metadata.localUri);
          await file.delete();
        } catch {
          // Ignore errors if file doesn't exist
        }
      }
      await AsyncStorage.removeItem(key);
    }

    console.log('Image cache cleared');
  } catch (error) {
    console.error('Failed to clear image cache:', error);
    throw error;
  }
};

/**
 * Clear expired cached images
 */
export const clearExpiredCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const metadataKeys = keys.filter((key) => key.startsWith(CACHE_METADATA_PREFIX));

    for (const key of metadataKeys) {
      const metadataJson = await AsyncStorage.getItem(key);
      if (metadataJson) {
        const metadata: ImageCacheMetadata = JSON.parse(metadataJson);

        if (!isCacheValid(metadata)) {
          try {
            const file = new File(metadata.localUri);
            await file.delete();
          } catch {
            // Ignore errors
          }
          await AsyncStorage.removeItem(key);
        }
      }
    }

    console.log('Expired cache cleared');
  } catch (error) {
    console.error('Failed to clear expired cache:', error);
  }
};
