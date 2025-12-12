import AsyncStorage from '@react-native-async-storage/async-storage';

import { SupportedLanguages } from '@/locales';

const LANGUAGE_KEY = '@omoplata/language';

/**
 * Get tenant-specific key for language storage
 */
const getTenantKey = (tenantSlug: string | null): string => {
  if (!tenantSlug) {
    return LANGUAGE_KEY;
  }
  return `${LANGUAGE_KEY}:${tenantSlug}`;
};

/**
 * Save language preference to persistent storage (per tenant)
 */
export const saveLanguage = async (
  language: SupportedLanguages,
  tenantSlug: string | null = null
): Promise<void> => {
  try {
    const key = getTenantKey(tenantSlug);
    await AsyncStorage.setItem(key, language);
  } catch (error) {
    console.error('Failed to save language:', error);
    throw error;
  }
};

/**
 * Load language preference from persistent storage (per tenant)
 */
export const loadLanguage = async (
  tenantSlug: string | null = null
): Promise<SupportedLanguages | null> => {
  try {
    const key = getTenantKey(tenantSlug);
    const language = await AsyncStorage.getItem(key);
    return language as SupportedLanguages | null;
  } catch (error) {
    console.error('Failed to load language:', error);
    return null;
  }
};

/**
 * Clear language preference from storage (per tenant)
 */
export const clearLanguage = async (tenantSlug: string | null = null): Promise<void> => {
  try {
    const key = getTenantKey(tenantSlug);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear language:', error);
    throw error;
  }
};
