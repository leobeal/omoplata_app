import '../global.css';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Stack, Redirect, useSegments, usePathname, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Image, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import OfflineBanner from '@/components/OfflineBanner';
import ViewingAsChildBanner from '@/components/ViewingAsChildBanner';
import { AppConfigProvider, useAppConfig } from '@/contexts/AppConfigContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DashboardReadyProvider, useDashboardReady } from '@/contexts/DashboardReadyContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ScrollToTopProvider } from '@/contexts/ScrollToTopContext';
import { TenantProvider, useTenant } from '@/contexts/TenantContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import {
  savePendingCheckin,
  getPendingCheckin,
  clearPendingCheckin,
  extractTenantFromHost,
} from '@/utils/deep-link-storage';
import { cacheImage, getCachedImage } from '@/utils/image-cache';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const LAST_ROUTE_KEY = '@omoplata:lastRoute';

// Routes that should not be persisted
const EXCLUDED_ROUTES = ['/screens/login', '/screens/tenant-selection', '/screens/forgot-password'];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const pathname = usePathname();
  const {
    tenant,
    isLoading: isTenantLoading,
    isTenantRequired,
    clearTenant,
    selectTenantBySlug,
  } = useTenant();
  const { loading: isConfigLoading, error: configError } = useAppConfig();
  const { isDashboardReady } = useDashboardReady();
  const segments = useSegments();
  const [isLoginBackgroundReady, setIsLoginBackgroundReady] = useState(false);
  const [isPreloadingBackground, setIsPreloadingBackground] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);
  const [hasRestoredRoute, setHasRestoredRoute] = useState(false);
  const previousAuthState = useRef<boolean | null>(null);
  const hasHandledDeepLink = useRef(false);
  const url = Linking.useURL();

  const isOnLoginScreen = segments.join('/').includes('login');
  const isOnTenantScreen = segments.join('/').includes('tenant-selection');
  const isOnForgotPasswordScreen = segments.join('/').includes('forgot-password');

  // Core loading states
  const isCoreLoading = isAuthLoading || isTenantLoading;

  // Check if we need tenant selection (only for generic builds without a tenant)
  const needsTenantSelection = isTenantRequired && !tenant && !isOnTenantScreen;

  // Check if we should redirect to login (tenant loaded but not authenticated)
  const shouldRedirectToLogin =
    !isCoreLoading &&
    !isConfigLoading &&
    !isAuthenticated &&
    !isOnLoginScreen &&
    !isOnTenantScreen &&
    !isOnForgotPasswordScreen &&
    (!isTenantRequired || tenant);

  // Route persistence: Save current route when it changes
  useEffect(() => {
    if (!isAuthenticated || !pathname) return;
    if (EXCLUDED_ROUTES.some((route) => pathname.startsWith(route))) return;

    AsyncStorage.setItem(LAST_ROUTE_KEY, pathname);
  }, [pathname, isAuthenticated]);

  // Route persistence: Restore last route on app launch
  useEffect(() => {
    if (hasRestoredRoute || !isAuthenticated || !isDashboardReady) return;

    const restoreRoute = async () => {
      try {
        const lastRoute = await AsyncStorage.getItem(LAST_ROUTE_KEY);
        if (lastRoute && lastRoute !== '/' && lastRoute !== pathname) {
          router.replace(lastRoute);
        }
      } catch (error) {
        console.error('Failed to restore route:', error);
      } finally {
        setHasRestoredRoute(true);
      }
    };

    restoreRoute();
  }, [isAuthenticated, isDashboardReady, hasRestoredRoute, pathname]);

  // Route persistence: Clear saved route on logout
  useEffect(() => {
    const wasAuthenticated = previousAuthState.current;
    const isNowAuthenticated = isAuthenticated;

    if (wasAuthenticated === true && isNowAuthenticated === false) {
      AsyncStorage.removeItem(LAST_ROUTE_KEY);
      setHasRestoredRoute(false);
    }

    previousAuthState.current = isAuthenticated;
  }, [isAuthenticated]);

  // Deep link handling: Handle check-in URLs from QR code scans
  useEffect(() => {
    if (!url || hasHandledDeepLink.current) return;
    if (isCoreLoading) return; // Wait for auth/tenant to load

    const handleDeepLink = async () => {
      try {
        const parsed = Linking.parse(url);
        const path = parsed.path?.replace(/^\//, ''); // Remove leading slash

        // Only handle checkin path
        if (path !== 'checkin') return;

        hasHandledDeepLink.current = true;

        const location = parsed.queryParams?.location as string | undefined;
        const code = parsed.queryParams?.code as string | undefined;
        const tenantSlug = extractTenantFromHost(parsed.hostname);

        // If multi-tenant app and no tenant selected, auto-select from URL
        if (isTenantRequired && !tenant && tenantSlug) {
          await selectTenantBySlug(tenantSlug);
          // After tenant selection, we need to wait for re-render
          // The auth check will happen on next cycle
        }

        if (isAuthenticated) {
          // User is logged in, go directly to check-in
          router.push({
            pathname: '/screens/checkin',
            params: { location, code, direct: 'true' },
          });
        } else if (location) {
          // User needs to log in first, save pending check-in
          await savePendingCheckin({ location, code, tenantSlug: tenantSlug || undefined });
          // Auth redirect will happen naturally via shouldRedirectToLogin
        }
      } catch (error) {
        console.error('Failed to handle deep link:', error);
      }
    };

    handleDeepLink();
  }, [url, isCoreLoading, isAuthenticated, tenant, isTenantRequired, selectTenantBySlug]);

  // Handle pending check-in after login
  useEffect(() => {
    if (!isAuthenticated || !isDashboardReady) return;

    const handlePendingCheckin = async () => {
      const pending = await getPendingCheckin();
      if (pending) {
        await clearPendingCheckin();
        router.push({
          pathname: '/screens/checkin',
          params: { location: pending.location, code: pending.code, direct: 'true' },
        });
      }
    };

    handlePendingCheckin();
  }, [isAuthenticated, isDashboardReady]);

  // Preload login background when tenant is available and user is not authenticated
  const preloadLoginBackground = useCallback(async () => {
    if (isPreloadingBackground || isLoginBackgroundReady) return;

    setIsPreloadingBackground(true);
    try {
      const buildConfig = Constants.expoConfig?.extra;
      const backgroundUrl = tenant?.loginBackground || buildConfig?.loginBackground;

      if (!backgroundUrl) {
        // No remote background, default is bundled and ready
        setIsLoginBackgroundReady(true);
        return;
      }

      // Check cache first
      const cachedUri = await getCachedImage(backgroundUrl);
      if (cachedUri) {
        await Image.prefetch(cachedUri);
        setIsLoginBackgroundReady(true);
        return;
      }

      // Download and cache
      const uri = await cacheImage(backgroundUrl);
      await Image.prefetch(uri);
      setIsLoginBackgroundReady(true);
    } catch (error) {
      console.error('Failed to preload login background:', error);
      // Continue anyway on error
      setIsLoginBackgroundReady(true);
    } finally {
      setIsPreloadingBackground(false);
    }
  }, [tenant?.loginBackground, isPreloadingBackground, isLoginBackgroundReady]);

  // Start preloading login background when we know we'll need it
  useEffect(() => {
    // Only preload if:
    // 1. Tenant and auth loading is done
    // 2. User is not authenticated
    // 3. We have a tenant (or tenant is not required)
    // 4. Config is loaded (so we know the full tenant info)
    if (
      !isCoreLoading &&
      !isConfigLoading &&
      !isAuthenticated &&
      (!isTenantRequired || tenant) &&
      !isLoginBackgroundReady
    ) {
      preloadLoginBackground();
    }
  }, [
    isCoreLoading,
    isConfigLoading,
    isAuthenticated,
    isTenantRequired,
    tenant,
    isLoginBackgroundReady,
    preloadLoginBackground,
  ]);

  // Determine when we can render children (auth/config ready)
  const canRenderChildren = (() => {
    // Still loading core data
    if (isCoreLoading) return false;

    // Need tenant selection - ready to show that screen
    if (needsTenantSelection) return true;

    // Config still loading
    if (isConfigLoading) return false;

    // If not authenticated, wait for login background to be ready
    if (shouldRedirectToLogin) {
      return isLoginBackgroundReady;
    }

    // On login/forgot-password screen, wait for background
    if (isOnLoginScreen || isOnForgotPasswordScreen) {
      return isLoginBackgroundReady;
    }

    return true;
  })();

  // Determine when to hide splash (children rendered + dashboard ready if authenticated)
  const canHideSplash = (() => {
    if (!canRenderChildren) return false;

    // If authenticated, also wait for dashboard data
    if (isAuthenticated && !isOnLoginScreen && !isOnTenantScreen) {
      return isDashboardReady;
    }

    return true;
  })();

  // Hide splash screen when fully ready
  useEffect(() => {
    if (canHideSplash && !splashHidden) {
      SplashScreen.hideAsync();
      setSplashHidden(true);
    }
  }, [canHideSplash, splashHidden]);

  // Keep children hidden while not ready to render - show dark background instead of white flash
  if (!canRenderChildren) {
    return <View style={{ flex: 1, backgroundColor: '#141414' }} />;
  }

  // Priority 0: If config error (including club not found) and tenant is required, redirect to tenant selection
  // The tenant-selection screen will show the appropriate error message
  if (configError && isTenantRequired && tenant && !isOnTenantScreen) {
    // Clear the invalid tenant and redirect to tenant selection
    clearTenant();
    return <Redirect href="/screens/tenant-selection" />;
  }

  // Priority 1: Check if tenant selection is needed first
  if (needsTenantSelection) {
    return <Redirect href="/screens/tenant-selection" />;
  }

  // Priority 2: Check authentication after tenant is selected
  if (shouldRedirectToLogin) {
    return <Redirect href="/screens/login" />;
  }

  // Priority 3: If authenticated but on login/tenant screen, go to home
  if (isAuthenticated && (isOnLoginScreen || isOnTenantScreen)) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#141414' }}>
      <OfflineBanner />
      <ViewingAsChildBanner />
      {children}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#141414' }}>
      <NetworkProvider>
        <LocalizationProvider>
          <ThemeProvider>
            <TenantProvider>
              <AuthProvider>
                <NotificationProvider>
                  <AppConfigProvider>
                    <DashboardReadyProvider>
                      <ScrollToTopProvider>
                        <AuthGate>
                          <Stack screenOptions={{ headerShown: false }} />
                        </AuthGate>
                      </ScrollToTopProvider>
                    </DashboardReadyProvider>
                  </AppConfigProvider>
                </NotificationProvider>
              </AuthProvider>
            </TenantProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </NetworkProvider>
    </GestureHandlerRootView>
  );
}
