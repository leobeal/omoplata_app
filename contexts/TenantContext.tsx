import Constants from 'expo-constants';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { setTenant as setApiTenant } from '@/api/config';
import { saveTenant, loadTenant, clearTenant, TenantInfo } from '@/utils/tenant-storage';

interface TenantContextType {
  tenant: TenantInfo | null;
  isLoading: boolean;
  isTenantRequired: boolean;
  setTenant: (tenant: TenantInfo) => Promise<void>;
  clearTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenantState] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if tenant is configured in app.config (tenant-specific build)
  const configuredTenant = Constants.expoConfig?.extra?.tenant;
  const isTenantRequired = !configuredTenant;

  useEffect(() => {
    initializeTenant();
  }, []);

  const initializeTenant = async () => {
    try {
      setIsLoading(true);

      // If tenant is configured in build, use it
      if (configuredTenant) {
        const tenantInfo: TenantInfo = {
          slug: configuredTenant,
          name: configuredTenant.charAt(0).toUpperCase() + configuredTenant.slice(1),
          domain: getDomainForTenant(configuredTenant),
        };
        setTenantState(tenantInfo);
        setApiTenant(configuredTenant);
      } else {
        // Otherwise, load from storage
        const savedTenant = await loadTenant();
        if (savedTenant) {
          setTenantState(savedTenant);
          setApiTenant(savedTenant.slug);
        }
      }
    } catch (error) {
      console.error('Failed to initialize tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDomainForTenant = (slug: string): string => {
    const env = Constants.expoConfig?.extra?.env || 'development';
    switch (env) {
      case 'development':
        return `${slug}.sportsmanager.test`;
      case 'staging':
        return `${slug}.omoplata.eu`;
      case 'production':
        return `${slug}.omoplata.de`;
      default:
        return `${slug}.sportsmanager.test`;
    }
  };

  const setTenant = async (newTenant: TenantInfo) => {
    try {
      await saveTenant(newTenant);
      setTenantState(newTenant);
      setApiTenant(newTenant.slug);
    } catch (error) {
      console.error('Failed to set tenant:', error);
      throw error;
    }
  };

  const clearTenantHandler = async () => {
    try {
      await clearTenant();
      setTenantState(null);
    } catch (error) {
      console.error('Failed to clear tenant:', error);
      throw error;
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isLoading,
        isTenantRequired,
        setTenant,
        clearTenant: clearTenantHandler,
      }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
