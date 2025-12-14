import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './client';
import { ENDPOINTS } from './config';

// Mood levels (0-4)
export type MoodLevel = 0 | 1 | 2 | 3 | 4;

const MOOD_STORAGE_KEY = '@mood_selection';
const DEBOUNCE_DELAY = 5000; // 5 seconds debounce

interface StoredMood {
  moodLevel: MoodLevel;
  date: string; // YYYY-MM-DD format
  synced: boolean;
}

// Debounce timer
let debounceTimer: NodeJS.Timeout | null = null;
let pendingMood: MoodLevel | null = null;

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Get the stored mood for today (if any)
 */
export const getTodayMood = async (): Promise<MoodLevel | null> => {
  try {
    const stored = await AsyncStorage.getItem(MOOD_STORAGE_KEY);
    if (!stored) return null;

    const data: StoredMood = JSON.parse(stored);
    const today = getTodayDate();

    // Reset if not from today
    if (data.date !== today) {
      await AsyncStorage.removeItem(MOOD_STORAGE_KEY);
      return null;
    }

    return data.moodLevel;
  } catch (error) {
    console.error('Failed to get stored mood:', error);
    return null;
  }
};

/**
 * Save mood locally
 */
const saveMoodLocally = async (moodLevel: MoodLevel, synced: boolean): Promise<void> => {
  const data: StoredMood = {
    moodLevel,
    date: getTodayDate(),
    synced,
  };
  await AsyncStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(data));
};

/**
 * Submit mood to API
 */
const submitMoodToApi = async (moodLevel: MoodLevel): Promise<boolean> => {
  try {
    const response = await api.post<{ mood: number }>(ENDPOINTS.MOOD.SUBMIT, {
      mood_level: moodLevel,
    });

    return !response.error;
  } catch (error) {
    console.error('Failed to submit mood:', error);
    return false;
  }
};

/**
 * Submit mood with debouncing
 * - Saves locally immediately for UI feedback
 * - Debounces API call to handle rapid clicks
 * - If user clicks multiple times quickly, only the last selection is sent
 */
export const submitMood = async (moodLevel: MoodLevel): Promise<void> => {
  // Save locally immediately (unsynced)
  await saveMoodLocally(moodLevel, false);

  // Store pending mood
  pendingMood = moodLevel;

  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Set new debounce timer
  debounceTimer = setTimeout(async () => {
    if (pendingMood !== null) {
      const success = await submitMoodToApi(pendingMood);
      if (success) {
        // Mark as synced
        await saveMoodLocally(pendingMood, true);
      }
      pendingMood = null;
    }
    debounceTimer = null;
  }, DEBOUNCE_DELAY);
};

/**
 * Clear mood selection (for testing or manual reset)
 */
export const clearMood = async (): Promise<void> => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingMood = null;
  await AsyncStorage.removeItem(MOOD_STORAGE_KEY);
};
