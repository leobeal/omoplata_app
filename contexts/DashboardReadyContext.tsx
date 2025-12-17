import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';

import { getMyClassesWithChildren, Class, ChildWithClasses } from '@/api/classes';
import { getGraduationsWithChildren, Graduation, ChildWithGraduations } from '@/api/graduations';
import { getMembership, Membership } from '@/api/membership';
import {
  getPaymentMethods,
  getAvailablePaymentMethods,
  PaymentMethod,
  AvailablePaymentMethod,
} from '@/api/payment-methods';
import { getAnalytics, AnalyticsData, DEFAULT_ANALYTICS_DATA } from '@/api/statistics';

interface AppDataContextType {
  // Loading state
  isAppDataReady: boolean;

  // Data
  classes: Class[];
  childrenWithClasses: ChildWithClasses[];
  classesError: string | null;
  classesFromCache: boolean;
  membership: Membership | null;
  paymentMethods: PaymentMethod[];
  availablePaymentMethods: AvailablePaymentMethod[];
  analytics: AnalyticsData;
  analyticsFromCache: boolean;
  graduations: Graduation[];
  childrenWithGraduations: ChildWithGraduations[];

  // Actions
  refreshData: () => Promise<void>;
  resetAndRefreshData: () => Promise<void>;
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
}

const AppDataContext = createContext<AppDataContextType>({
  isAppDataReady: false,
  classes: [],
  childrenWithClasses: [],
  classesError: null,
  classesFromCache: false,
  membership: null,
  paymentMethods: [],
  availablePaymentMethods: [],
  analytics: DEFAULT_ANALYTICS_DATA,
  analyticsFromCache: false,
  graduations: [],
  childrenWithGraduations: [],
  refreshData: async () => {},
  resetAndRefreshData: async () => {},
  setClasses: () => {},
  setPaymentMethods: () => {},
});

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { tenant, isLoading: isTenantLoading, isTenantRequired } = useTenant();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [isAppDataReady, setIsAppDataReady] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [childrenWithClasses, setChildrenWithClasses] = useState<ChildWithClasses[]>([]);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [classesFromCache, setClassesFromCache] = useState(false);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<AvailablePaymentMethod[]>(
    []
  );
  const [analytics, setAnalytics] = useState<AnalyticsData>(DEFAULT_ANALYTICS_DATA);
  const [analyticsFromCache, setAnalyticsFromCache] = useState(false);
  const [graduations, setGraduations] = useState<Graduation[]>([]);
  const [childrenWithGraduations, setChildrenWithGraduations] = useState<ChildWithGraduations[]>(
    []
  );
  const hasLoadedData = useRef(false);

  // Check if user has responsible role (for loading children's data)
  const isResponsible = user?.roles?.includes('responsible') ?? false;

  const loadAllData = useCallback(async () => {
    setClassesError(null);

    const [
      classesResult,
      membershipData,
      paymentMethodsData,
      availablePaymentMethodsData,
      statisticsResult,
      graduationsResult,
    ] = await Promise.all([
      getMyClassesWithChildren().catch((error) => {
        console.error('Error loading classes:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to load classes. Please check your connection and try again.';
        setClassesError(errorMessage);
        return { classes: [], children: [], fromCache: false };
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
      getAnalytics().catch((error) => {
        console.error('Error loading analytics:', error);
        return { data: DEFAULT_ANALYTICS_DATA, fromCache: false };
      }),
      getGraduationsWithChildren({ includeChildren: isResponsible }).catch((error) => {
        console.error('Error loading graduations:', error);
        return { graduations: [], children: [] };
      }),
    ]);

    // If statisticsResult is null, it means we got a 401 and logout was triggered
    // Don't update state - the logout flow will reset everything
    // well well, that's an opinion here.
    if (!statisticsResult) {
      return;
    }

    setClasses(classesResult.classes);
    setChildrenWithClasses(classesResult.children);
    setClassesFromCache(classesResult.fromCache ?? false);
    setMembership(membershipData);
    setPaymentMethods(paymentMethodsData);
    setAvailablePaymentMethods(availablePaymentMethodsData);
    setAnalytics(statisticsResult.data);
    setAnalyticsFromCache(statisticsResult.fromCache ?? false);
    setGraduations(graduationsResult.graduations);
    setChildrenWithGraduations(graduationsResult.children || []);
    setIsAppDataReady(true);
    hasLoadedData.current = true;
  }, [isResponsible]);

  // Track user ID to detect profile switches
  const previousUserIdRef = useRef<string | null>(null);

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

    const currentUserId = user?.id || null;

    // Check if user changed (profile switch)
    if (previousUserIdRef.current !== null && previousUserIdRef.current !== currentUserId) {
      console.log('[AppData] User changed, reloading data');
      hasLoadedData.current = false;
    }
    previousUserIdRef.current = currentUserId;

    // Don't reload if already loaded
    if (hasLoadedData.current) return;

    loadAllData();
  }, [
    isTenantLoading,
    isAuthLoading,
    isTenantRequired,
    tenant,
    isAuthenticated,
    user?.id,
    loadAllData,
  ]);

  const refreshData = useCallback(async () => {
    hasLoadedData.current = false;
    await loadAllData();
  }, [loadAllData]);

  // Reset all data immediately then refresh - use when switching profiles
  const resetAndRefreshData = useCallback(async () => {
    // Immediately clear old data so UI doesn't show stale info
    setIsAppDataReady(false);
    setClasses([]);
    setChildrenWithClasses([]);
    setClassesError(null);
    setClassesFromCache(false);
    setMembership(null);
    setPaymentMethods([]);
    setAvailablePaymentMethods([]);
    setAnalytics(DEFAULT_ANALYTICS_DATA);
    setAnalyticsFromCache(false);
    setGraduations([]);
    setChildrenWithGraduations([]);
    hasLoadedData.current = false;

    // Now load fresh data for the new profile
    await loadAllData();
  }, [loadAllData]);

  // Reset when user logs out
  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      hasLoadedData.current = false;
      setIsAppDataReady(false);
      setClasses([]);
      setChildrenWithClasses([]);
      setMembership(null);
      setPaymentMethods([]);
      setAvailablePaymentMethods([]);
      setAnalytics(DEFAULT_ANALYTICS_DATA);
      setAnalyticsFromCache(false);
      setGraduations([]);
      setChildrenWithGraduations([]);
    }
  }, [isAuthenticated, isAuthLoading]);

  const contextValue = useMemo(
    () => ({
      isAppDataReady,
      classes,
      childrenWithClasses,
      classesError,
      classesFromCache,
      membership,
      paymentMethods,
      availablePaymentMethods,
      analytics,
      analyticsFromCache,
      graduations,
      childrenWithGraduations,
      refreshData,
      resetAndRefreshData,
      setClasses,
      setPaymentMethods,
    }),
    [
      isAppDataReady,
      classes,
      childrenWithClasses,
      classesError,
      classesFromCache,
      membership,
      paymentMethods,
      availablePaymentMethods,
      analytics,
      analyticsFromCache,
      graduations,
      childrenWithGraduations,
      refreshData,
      resetAndRefreshData,
      setClasses,
      setPaymentMethods,
    ]
  );

  return <AppDataContext.Provider value={contextValue}>{children}</AppDataContext.Provider>;
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
