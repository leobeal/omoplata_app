import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import {
  AppConfig,
  MembershipSettings,
  BillingSettings,
  FeatureFlags,
  getAppConfig,
  defaultConfig,
  clearConfigCache,
} from '@/api/app-config';
import { useTenant } from '@/contexts/TenantContext';

interface AppConfigContextType {
  config: AppConfig | null;
  membership: MembershipSettings;
  billing: BillingSettings;
  features: FeatureFlags;
  loading: boolean;
  error: boolean;
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { tenant, isTenantRequired } = useTenant();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [previousTenantSlug, setPreviousTenantSlug] = useState<string | null | undefined>(
    undefined
  );

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(false);
      const fetchedConfig = await getAppConfig();
      if (fetchedConfig) {
        setConfig(fetchedConfig);
      } else {
        // No config returned - treat as error
        setError(true);
      }
    } catch (err) {
      console.error('Error loading app config:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle config loading based on tenant state
  useEffect(() => {
    const currentTenantSlug = tenant?.slug || null;

    // If tenant is required but not selected, mark as not loading (waiting for tenant)
    if (isTenantRequired && !tenant) {
      setLoading(false);
      setConfig(null);
      return;
    }

    // If we have a tenant (or tenant is not required), load config
    if (tenant || !isTenantRequired) {
      // Clear cache and reload when tenant changes (not on first load)
      const reloadForTenant = async () => {
        if (previousTenantSlug !== undefined && previousTenantSlug !== currentTenantSlug) {
          await clearConfigCache();
        }
        await loadConfig();
        setPreviousTenantSlug(currentTenantSlug);
      };
      reloadForTenant();
    }
  }, [tenant?.slug, isTenantRequired]);

  const refreshConfig = async () => {
    await loadConfig();
  };

  const value: AppConfigContextType = {
    config,
    membership: config?.membership || defaultConfig.membership!,
    billing: config?.billing || defaultConfig.billing!,
    features: config?.features || defaultConfig.features!,
    loading,
    error,
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
