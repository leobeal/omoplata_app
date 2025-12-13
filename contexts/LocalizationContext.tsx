import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';

import { translations, SupportedLanguages, SUPPORTED_LANGUAGES } from '@/locales';
import { loadLanguage, saveLanguage } from '@/utils/language-storage';

/**
 * Get the device's preferred language, mapped to a supported language
 */
const getDeviceLanguage = (): SupportedLanguages => {
  const deviceLocale = Localization.getLocales()[0]?.languageTag || 'en';

  // Check for exact match first (e.g., 'pt-BR')
  if (SUPPORTED_LANGUAGES.includes(deviceLocale as SupportedLanguages)) {
    return deviceLocale as SupportedLanguages;
  }

  // Check for language code match (e.g., 'de' from 'de-DE')
  const languageCode = deviceLocale.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(languageCode as SupportedLanguages)) {
    return languageCode as SupportedLanguages;
  }

  // Special case: any Portuguese variant -> pt-BR
  if (languageCode === 'pt') {
    return 'pt-BR';
  }

  // Default to English
  return 'en';
};

interface LocalizationContextType {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: SupportedLanguages;
  setLocale: (locale: SupportedLanguages, tenantSlug?: string | null) => Promise<void>;
  isLoading: boolean;
  i18n: I18n;
}

// Global locale state for API client access (before context is available)
let currentLocale: SupportedLanguages = 'en';
export const getCurrentLocale = (): SupportedLanguages => currentLocale;

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
  children: React.ReactNode;
  tenantSlug?: string | null;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({
  children,
  tenantSlug = null,
}) => {
  // Priority: device language > tenant config > English
  const deviceLanguage = getDeviceLanguage();
  const tenantLanguage = (Constants.expoConfig?.extra?.language as SupportedLanguages) || null;
  const defaultLanguage = deviceLanguage || tenantLanguage || 'en';

  const [locale, setLocaleState] = useState<SupportedLanguages>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Create i18n instance - recreate when locale changes to ensure proper updates
  const i18n = useMemo(() => {
    const i18nInstance = new I18n(translations);
    i18nInstance.enableFallback = true;
    i18nInstance.defaultLocale = 'en';
    i18nInstance.locale = locale;
    return i18nInstance;
  }, [locale]);

  // Update global locale state for API client access
  useEffect(() => {
    currentLocale = locale;
  }, [locale]);

  // Load saved language preference on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await loadLanguage(tenantSlug);
        if (savedLanguage && savedLanguage !== locale) {
          setLocaleState(savedLanguage);
        }
      } catch (error) {
        console.error('Failed to load saved language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLanguage();
  }, [tenantSlug]);

  // Set locale and persist to storage
  const setLocale = useCallback(
    async (newLocale: SupportedLanguages, slug?: string | null) => {
      const tenantKey = slug !== undefined ? slug : tenantSlug;
      try {
        await saveLanguage(newLocale, tenantKey);
        setLocaleState(newLocale);
      } catch (error) {
        console.error('Failed to save language:', error);
        throw error;
      }
    },
    [tenantSlug]
  );

  const value = useMemo(
    () => ({
      t: (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
      locale,
      setLocale,
      isLoading,
      i18n,
    }),
    [i18n, locale, setLocale, isLoading]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useTranslation must be used within LocalizationProvider');
  }
  return context;
};

/**
 * Hook to get the translation function
 * Shorthand for useTranslation().t
 */
export const useT = () => {
  const { t } = useTranslation();
  return t;
};
