import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import {
  AppConfig,
  MembershipSettings,
  BillingSettings,
  FeatureFlags,
  getAppConfig,
  defaultConfig,
} from '@/api/app-config';

interface AppConfigContextType {
  config: AppConfig | null;
  membership: MembershipSettings;
  billing: BillingSettings;
  features: FeatureFlags;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const fetchedConfig = await getAppConfig();
      if (fetchedConfig) {
        setConfig(fetchedConfig);
      }
    } catch (error) {
      console.error('Error loading app config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const refreshConfig = async () => {
    await loadConfig();
  };

  const value: AppConfigContextType = {
    config,
    membership: config?.membership || defaultConfig.membership!,
    billing: config?.billing || defaultConfig.billing!,
    features: config?.features || defaultConfig.features!,
    loading,
    refreshConfig,
  };

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
}

// Convenience hooks for specific config sections
export function useMembershipSettings() {
  const { membership } = useAppConfig();
  return membership;
}

export function useBillingSettings() {
  const { billing } = useAppConfig();
  return billing;
}

export function useFeatureFlags() {
  const { features } = useAppConfig();
  return features;
}
