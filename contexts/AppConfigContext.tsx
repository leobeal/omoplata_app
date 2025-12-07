import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

import {
  AppConfig,
  AppConfigErrorType,
  MembershipSettings,
  BillingSettings,
  FeatureFlags,
  getAppConfig,
  defaultConfig,
  clearConfigCache,
} from '@/api/app-config';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

interface AppConfigContextType {
  config: AppConfig | null;
  membership: MembershipSettings;
  billing: BillingSettings;
  features: FeatureFlags;
  loading: boolean;
  error: boolean;
  errorType: AppConfigErrorType;
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { tenant, isTenantRequired } = useTenant();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorType, setErrorType] = useState<AppConfigErrorType>(null);
  const previousTenantSlugRef = useRef<string | null | undefined>(undefined);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(false);
      setErrorType(null);
      const result = await getAppConfig();

      if (result.config) {
        setConfig(result.config);
      } else {
        // No config returned - set error with type
        setError(true);
        setErrorType(result.error);
      }
    } catch (err) {
      console.error('Error loading app config:', err);
      setError(true);
      setErrorType('network_error');
    } finally {
      setLoading(false);
    }
  };

  // Handle config loading based on tenant, auth state, and authentication
  useEffect(() => {
    const currentTenantSlug = tenant?.slug || null;

    // Wait for auth to finish loading before deciding
    if (isAuthLoading) {
      return;
    }

    // If not authenticated, don't fetch config (it requires auth)
    // Just mark as not loading so the app can proceed to login
    if (!isAuthenticated) {
      setLoading(false);
      setConfig(null);
      setError(false);
      setErrorType(null);
      return;
    }

    // If tenant is required but not selected, mark as not loading (waiting for tenant)
    if (isTenantRequired && !tenant) {
      setLoading(false);
      setConfig(null);
      return;
    }

    // If authenticated and we have a tenant (or tenant is not required), load config
    if (tenant || !isTenantRequired) {
      // Clear cache and reload when tenant changes (not on first load)
      const reloadForTenant = async () => {
        if (
          previousTenantSlugRef.current !== undefined &&
          previousTenantSlugRef.current !== currentTenantSlug
        ) {
          await clearConfigCache();
        }
        await loadConfig();
        previousTenantSlugRef.current = currentTenantSlug;
      };
      reloadForTenant();
    }
  }, [tenant?.slug, isTenantRequired, isAuthLoading, isAuthenticated]);

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
    errorType,
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
