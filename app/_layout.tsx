import '../global.css';
import Constants from 'expo-constants';
import { Stack, Redirect, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import { Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppConfigProvider, useAppConfig } from '@/contexts/AppConfigContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
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

  // Determine when we're fully ready to show content
  const isFullyReady = (() => {
    // Still loading core data
    if (isCoreLoading) return false;

    // Need tenant selection - ready to show that screen
    if (needsTenantSelection) return true;

    // Config still loading
    if (isConfigLoading) return false;

    // If authenticated, we're ready
    if (isAuthenticated) return true;

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

  // Hide splash screen when fully ready
  useEffect(() => {
    if (isFullyReady && !splashHidden) {
      SplashScreen.hideAsync();
      setSplashHidden(true);
    }
  }, [isFullyReady, splashHidden]);

  // Keep splash visible while not ready
  if (!isFullyReady) {
    return null;
  }

  // Priority 0: If config failed to load and we're on main context, redirect to tenant selection
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

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider>
        <ThemeProvider>
          <TenantProvider>
            <AppConfigProvider>
              <AuthProvider>
                <ScrollToTopProvider>
                  <AuthGate>
                    <Stack screenOptions={{ headerShown: false }} />
                  </AuthGate>
                </ScrollToTopProvider>
              </AuthProvider>
            </AppConfigProvider>
          </TenantProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
}
