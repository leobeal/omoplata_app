import Constants from 'expo-constants';
import { I18n } from 'i18n-js';
import React, { createContext, useContext, useMemo } from 'react';

import { translations, SupportedLanguages } from '@/locales';

interface LocalizationContextType {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: SupportedLanguages;
  i18n: I18n;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const i18n = useMemo(() => {
    // Get language from tenant config
    const tenantLanguage = (Constants.expoConfig?.extra?.language as SupportedLanguages) || 'en';

    const i18nInstance = new I18n(translations);
    i18nInstance.locale = tenantLanguage;
    i18nInstance.enableFallback = true;
    i18nInstance.defaultLocale = 'en';

    return i18nInstance;
  }, []);

  const value = useMemo(
    () => ({
      t: (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
      locale: i18n.locale as SupportedLanguages,
      i18n,
    }),
    [i18n]
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
