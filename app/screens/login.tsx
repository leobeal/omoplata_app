import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Image,
  Keyboard,
  Pressable,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import api from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LocalizationContext';
import { useTenant } from '@/contexts/TenantContext';
import { getCachedImage } from '@/utils/image-cache';

// Default background image
const DEFAULT_BACKGROUND = require('@/assets/_global/img/2.jpg');

// Tenant icons (static requires for build-time tenant builds)
const TENANT_ICONS: Record<string, ReturnType<typeof require>> = {
  'evolve-grappling': require('@/assets/evolve-grappling/icon.png'),
  'sparta-aachen': require('@/assets/sparta-aachen/icon.png'),
  'supreme-mma': require('@/assets/supreme-mma/icon.png'),
  main: require('@/assets/_global/icon.png'),
};
const DEFAULT_LOGO = require('@/assets/_global/icon.png');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { tenant, isTenantRequired } = useTenant();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [backgroundSource, setBackgroundSource] = useState<
    { uri: string } | ReturnType<typeof require> | null
  >(null);
  const [logoSource, setLogoSource] = useState<{ uri: string } | ReturnType<typeof require>>(
    DEFAULT_LOGO
  );
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [signupLink, setSignupLink] = useState<string | undefined>(tenant?.signup_link);

  // Fetch club config for signup_link (needed for tenant builds where tenant-selection is skipped)
  useEffect(() => {
    const fetchClubConfig = async () => {
      // If we already have signup_link from tenant context, use it
      if (tenant?.signup_link) {
        setSignupLink(tenant.signup_link);
        return;
      }

      // Otherwise fetch from API (signup_link comes from /check endpoint)
      try {
        const response = await api.get(ENDPOINTS.TENANT.CHECK);
        const link = response.data?.signup_link;
        if (link) {
          setSignupLink(link);
        }
      } catch (error) {
        // Silently fail - signup link is optional
      }
    };

    fetchClubConfig();
  }, [tenant?.signup_link]);

  // Load cached background image (preloaded by _layout.tsx during splash)
  useEffect(() => {
    loadCachedBackground();
  }, [tenant?.loginBackground]);

  // Load tenant logo
  useEffect(() => {
    loadLogo();
  }, [tenant?.logo]);

  // Listen for keyboard show/hide
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const loadCachedBackground = async () => {
    try {
      // Get background URL from tenant context (runtime-selected) or build config
      const buildConfig = Constants.expoConfig?.extra;
      const backgroundUrl = tenant?.loginBackground || buildConfig?.loginBackground;

      if (!backgroundUrl) {
        // No remote background configured, use default
        setBackgroundSource(DEFAULT_BACKGROUND);
        return;
      }

      // Check cache (should be preloaded by _layout.tsx)
      const cachedUri = await getCachedImage(backgroundUrl);
      if (cachedUri) {
        setBackgroundSource({ uri: cachedUri });
      } else {
        // Fallback to default if cache miss
        setBackgroundSource(DEFAULT_BACKGROUND);
      }
    } catch (error) {
      console.error('Failed to load cached background:', error);
      // Fallback to default on error
      setBackgroundSource(DEFAULT_BACKGROUND);
    }
  };

  const loadLogo = async () => {
    try {
      const buildConfig = Constants.expoConfig?.extra;
      const configuredTenant = buildConfig?.tenant;

      // For tenant builds, use the bundled tenant icon
      if (configuredTenant && TENANT_ICONS[configuredTenant]) {
        setLogoSource(TENANT_ICONS[configuredTenant]);
        return;
      }

      // For runtime-selected tenants, check for remote logo URL
      const logoUrl = tenant?.logo || buildConfig?.logo;

      if (!logoUrl) {
        // No remote logo configured, use default
        setLogoSource(DEFAULT_LOGO);
        return;
      }

      // Check cache for remote logo
      const cachedUri = await getCachedImage(logoUrl);
      if (cachedUri) {
        setLogoSource({ uri: cachedUri });
      } else {
        // Fallback to default if cache miss
        setLogoSource(DEFAULT_LOGO);
      }
    } catch (error) {
      console.error('Failed to load logo:', error);
      // Fallback to default on error
      setLogoSource(DEFAULT_LOGO);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError(t('login.emailRequired'));
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError(t('login.invalidEmail'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError(t('login.passwordRequired'));
      return false;
    } else if (password.length < 6) {
      setPasswordError(t('login.passwordTooShort'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleBack = () => {
    // If tenant selection is required (generic build), go to tenant selection
    // Otherwise, go to tenant selection anyway as there's no other screen
    router.push('/screens/tenant-selection');
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    setGeneralError('');

    if (isEmailValid && isPasswordValid) {
      setIsLoading(true);

      try {
        const result = await login(email, password);

        if (result.success) {
          // Don't navigate here - let AuthGate in _layout.tsx handle the redirect
          // This prevents race conditions where router.replace runs before
          // the auth state has fully propagated through React context
        } else {
          setGeneralError(result.error || t('login.loginFailed'));
          setIsLoading(false);
        }
      } catch {
        setGeneralError(t('login.loginFailed'));
        setIsLoading(false);
      }
      // Note: Don't setIsLoading(false) on success - keep showing loading
      // until AuthGate redirects us away from this screen
    }
  };

  // Show dark background until we determine which image to use
  if (!backgroundSource) {
    return <View style={{ flex: 1, backgroundColor: '#141414' }} />;
  }

  return (
    <ImageBackground source={backgroundSource} style={{ flex: 1 }}>
      <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']} style={{ flex: 1 }}>
        <StatusBar style="light" />

        {/* Header */}
        <View
          className="w-full flex-row items-center justify-between px-global"
          style={{ paddingTop: isKeyboardVisible ? insets.top : insets.top + 16 }}>
          {/* Only show back button for generic builds where tenant selection is required */}
          {isTenantRequired ? (
            <Icon name="ArrowLeft" onPress={handleBack} size={24} color="white" />
          ) : (
            <View style={{ width: 24 }} />
          )}
          <View style={{ width: 24 }} />
        </View>

        {/* Login Form - positioned at bottom */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={{ flex: 1, justifyContent: 'flex-end' }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces>
            <AnimatedView duration={500} delay={200} animation="slideInBottom" className="p-4">
              <View className="rounded-3xl border border-border bg-background p-6">
                <View className="mb-6 items-center justify-center">
                  {!isKeyboardVisible && (
                    <Image
                      source={logoSource}
                      className="mb-4 h-20 w-20 rounded-2xl"
                      resizeMode="contain"
                    />
                  )}
                  <ThemedText className="font-outfit-bold text-3xl">{t('login.title')}</ThemedText>
                  <ThemedText className="text-sm opacity-60">{t('login.subtitle')}</ThemedText>
                </View>

                {generalError ? (
                  <View className="mb-4 rounded-lg border border-red-500 bg-red-500/10 p-3">
                    <ThemedText className="text-center text-red-500">{generalError}</ThemedText>
                  </View>
                ) : null}

                <Input
                  label={t('login.email')}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  error={emailError}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  variant="inline"
                />

                <Input
                  label={t('login.password')}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                  }}
                  error={passwordError}
                  isPassword
                  autoCapitalize="none"
                  variant="inline"
                />

                <Button
                  title={t('login.login')}
                  onPress={handleLogin}
                  loading={isLoading}
                  size="large"
                  className="mb-4"
                />

                <Link
                  className="text-center text-sm text-text underline"
                  href="/screens/forgot-password">
                  {t('login.forgotPassword')}
                </Link>
              </View>
            </AnimatedView>

            {/* Not a member link - hidden when keyboard is open */}
            {signupLink && !isKeyboardVisible && (
              <Pressable onPress={() => Linking.openURL(signupLink)} className="mt-4 py-2">
                <ThemedText className="text-center text-sm text-white underline">
                  {t('login.notAMember')}
                </ThemedText>
              </Pressable>
            )}

            {/* Bottom Spacer for safe area */}
            <View style={{ height: insets.bottom + 16 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}
