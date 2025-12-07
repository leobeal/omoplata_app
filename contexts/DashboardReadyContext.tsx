import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';

import { getUpcomingClasses, Class } from '@/api/classes';
import { getMembership, Membership } from '@/api/membership';
import {
  getPaymentMethods,
  getAvailablePaymentMethods,
  PaymentMethod,
  AvailablePaymentMethod,
} from '@/api/payment-methods';

interface AppDataContextType {
  // Loading state
  isAppDataReady: boolean;

  // Data
  classes: Class[];
  classesError: string | null;
  membership: Membership | null;
  paymentMethods: PaymentMethod[];
  availablePaymentMethods: AvailablePaymentMethod[];

  // Actions
  refreshData: () => Promise<void>;
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
}

const AppDataContext = createContext<AppDataContextType>({
  isAppDataReady: false,
  classes: [],
  classesError: null,
  membership: null,
  paymentMethods: [],
  availablePaymentMethods: [],
  refreshData: async () => {},
  setClasses: () => {},
  setPaymentMethods: () => {},
});

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { tenant, isLoading: isTenantLoading, isTenantRequired } = useTenant();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isAppDataReady, setIsAppDataReady] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<AvailablePaymentMethod[]>(
    []
  );
  const hasLoadedData = useRef(false);

  const loadAllData = useCallback(async () => {
    setClassesError(null);

    const [classesData, membershipData, paymentMethodsData, availablePaymentMethodsData] =
      await Promise.all([
        getUpcomingClasses().catch((error) => {
          console.error('Error loading classes:', error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to load classes. Please check your connection and try again.';
          setClassesError(errorMessage);
          return [];
        }),
        getMembership().catch((error) => {
          console.error('Error loading membership:', error);
          return null;
        }),
        getPaymentMethods().catch((error) => {
          console.error('Error loading payment methods:', error);
          return [];
        }),
        getAvailablePaymentMethods().catch((error) => {
          console.error('Error loading available payment methods:', error);
          return [];
        }),
      ]);

    setClasses(classesData);
    setMembership(membershipData);
    setPaymentMethods(paymentMethodsData);
    setAvailablePaymentMethods(availablePaymentMethodsData);
    setIsAppDataReady(true);
    hasLoadedData.current = true;
  }, []);

  // Load data only when tenant and auth are ready, and user is authenticated
  useEffect(() => {
    // Don't load if still loading tenant or auth
    if (isTenantLoading || isAuthLoading) return;

    // Don't load if tenant is required but not set
    if (isTenantRequired && !tenant) return;

    // Don't load if not authenticated
    if (!isAuthenticated) {
      // Mark as ready so splash can hide for login screen
      setIsAppDataReady(true);
      return;
    }

    // Don't reload if already loaded
    if (hasLoadedData.current) return;

    loadAllData();
  }, [isTenantLoading, isAuthLoading, isTenantRequired, tenant, isAuthenticated, loadAllData]);

  const refreshData = useCallback(async () => {
    hasLoadedData.current = false;
    await loadAllData();
  }, [loadAllData]);

  // Reset when user logs out
  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      hasLoadedData.current = false;
      setIsAppDataReady(false);
      setClasses([]);
      setMembership(null);
      setPaymentMethods([]);
      setAvailablePaymentMethods([]);
    }
  }, [isAuthenticated, isAuthLoading]);

  return (
    <AppDataContext.Provider
      value={{
        isAppDataReady,
        classes,
        classesError,
        membership,
        paymentMethods,
        availablePaymentMethods,
        refreshData,
        setClasses,
        setPaymentMethods,
      }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}

// Keep old exports for backward compatibility during transition
export const DashboardReadyProvider = AppDataProvider;
export const useDashboardReady = () => {
  const { isAppDataReady } = useAppData();
  return {
    isDashboardReady: isAppDataReady,
    setDashboardReady: () => {}, // No-op, data loading is automatic now
    resetDashboardReady: () => {},
  };
};
