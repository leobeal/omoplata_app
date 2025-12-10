import '../global.css';
import Constants from 'expo-constants';
import { Stack, Redirect, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
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
import { cacheImage, getCachedImage } from '@/utils/image-cache';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { tenant, isLoading: isTenantLoading, isTenantRequired, clearTenant } = useTenant();
  const { loading: isConfigLoading, error: configError } = useAppConfig();
  const { isDashboardReady } = useDashboardReady();
  const segments = useSegments();
  const [isLoginBackgroundReady, setIsLoginBackgroundReady] = useState(false);
  const [isPreloadingBackground, setIsPreloadingBackground] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);

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

  // Keep children hidden while not ready to render
  if (!canRenderChildren) {
    return null;
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
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <ViewingAsChildBanner />
      {children}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
