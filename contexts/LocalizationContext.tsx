import Constants from 'expo-constants';
import { I18n } from 'i18n-js';
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';

import { translations, SupportedLanguages } from '@/locales';
import { loadLanguage, saveLanguage } from '@/utils/language-storage';

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
  // Get default language from tenant config
  const tenantLanguage = (Constants.expoConfig?.extra?.language as SupportedLanguages) || 'en';

  const [locale, setLocaleState] = useState<SupportedLanguages>(tenantLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Create i18n instance
  const i18n = useMemo(() => {
    const i18nInstance = new I18n(translations);
    i18nInstance.enableFallback = true;
    i18nInstance.defaultLocale = 'en';
    return i18nInstance;
  }, []);

  // Update i18n locale when state changes
  useEffect(() => {
    i18n.locale = locale;
    currentLocale = locale;
  }, [locale, i18n]);

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
