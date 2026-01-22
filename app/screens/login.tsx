import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { requestOtp } from '@/api/otp';
import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LocalizationContext';
import { useTenant } from '@/contexts/TenantContext';
import { useThemeColors } from '@/contexts/ThemeColors';
import { getCachedImage } from '@/utils/image-cache';

// Default background image
const DEFAULT_LOGO = require('@/assets/_global/icon.png');
const DEFAULT_BACKGROUND = require('@/assets/_global/img/2.jpg');

// Tenant icon (generated at build time by scripts/generate-tenant-assets.js)
const { TENANT_ICON } = require('@/generated/tenant-icon');

type LoginStep = 'email' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { loginWithOtp } = useAuth();
  const { tenant, isTenantRequired } = useTenant();
  const t = useT();

  // Step state
  const [step, setStep] = useState<LoginStep>('email');

  // Email step state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // OTP step state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);

  // UI state
  const [backgroundSource, setBackgroundSource] = useState<
    { uri: string } | ReturnType<typeof require> | null
  >(null);
  const [logoSource, setLogoSource] = useState<{ uri: string } | ReturnType<typeof require>>(
    DEFAULT_LOGO
  );
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [signupLink, setSignupLink] = useState<string | undefined>(tenant?.signup_link);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (retryAfter <= 0) return;

    const timer = setInterval(() => {
      setRetryAfter((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryAfter]);

  // Load cached background image
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
      const buildConfig = Constants.expoConfig?.extra;
      const backgroundUrl = tenant?.loginBackground || buildConfig?.loginBackground;

      if (!backgroundUrl) {
        setBackgroundSource(DEFAULT_BACKGROUND);
        return;
      }

      const cachedUri = await getCachedImage(backgroundUrl);
      if (cachedUri) {
        setBackgroundSource({ uri: cachedUri });
      } else {
        setBackgroundSource(DEFAULT_BACKGROUND);
      }
    } catch (error) {
      console.error('Failed to load cached background:', error);
      setBackgroundSource(DEFAULT_BACKGROUND);
    }
  };

  const loadLogo = async () => {
    try {
      if (TENANT_ICON) {
        setLogoSource(TENANT_ICON);
        return;
      }

      const buildConfig = Constants.expoConfig?.extra;
      const logoUrl = tenant?.logo || buildConfig?.logo;

      if (!logoUrl) {
        setLogoSource(DEFAULT_LOGO);
        return;
      }

      const cachedUri = await getCachedImage(logoUrl);
      if (cachedUri) {
        setLogoSource({ uri: cachedUri });
      } else {
        setLogoSource(DEFAULT_LOGO);
      }
    } catch (error) {
      console.error('Failed to load logo:', error);
      setLogoSource(DEFAULT_LOGO);
    }
  };

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError(t('login.emailRequired'));
      return false;
    } else if (!emailRegex.test(emailValue)) {
      setEmailError(t('login.invalidEmail'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleBack = () => {
    if (step === 'otp') {
      // Go back to email step
      setStep('email');
      setOtpCode(['', '', '', '', '', '']);
      setGeneralError('');
    } else if (isTenantRequired) {
      router.push('/screens/tenant-selection');
    }
  };

  const handleRequestOtp = async () => {
    if (!validateEmail(email)) return;
    if (retryAfter > 0) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const result = await requestOtp(email);

      if (result.success) {
        // Move to OTP step
        setStep('otp');
        // Focus first OTP input after a short delay
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      } else {
        if (result.retryAfter) {
          setRetryAfter(result.retryAfter);
        }
        // Show rate limit message with time if applicable
        if ('isRateLimited' in result && result.isRateLimited && result.retryAfter) {
          const seconds = result.retryAfter;
          if (seconds >= 60) {
            const minutes = Math.ceil(seconds / 60);
            setGeneralError(t('login.otpRateLimited', { minutes }));
          } else {
            setGeneralError(t('login.otpRateLimitedSeconds', { seconds }));
          }
        } else {
          setGeneralError(result.error || t('login.otpRequestFailed'));
        }
      }
    } catch (error) {
      setGeneralError(t('login.otpRequestFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (retryAfter > 0) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const result = await requestOtp(email);

      if (result.success) {
        // Clear OTP inputs
        setOtpCode(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        if (result.retryAfter) {
          setRetryAfter(result.retryAfter);
        }
        // Show rate limit message with time if applicable
        if ('isRateLimited' in result && result.isRateLimited && result.retryAfter) {
          const seconds = result.retryAfter;
          if (seconds >= 60) {
            const minutes = Math.ceil(seconds / 60);
            setGeneralError(t('login.otpRateLimited', { minutes }));
          } else {
            setGeneralError(t('login.otpRateLimitedSeconds', { seconds }));
          }
        } else {
          setGeneralError(result.error || t('login.otpRequestFailed'));
        }
      }
    } catch (error) {
      setGeneralError(t('login.otpRequestFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      const digits = value.replace(/[^0-9]/g, '');

      // Handle paste: if multiple digits, fill all inputs
      if (digits.length > 1) {
        const pastedCode = digits.slice(0, 6).split('');
        const newOtp = [...otpCode];
        pastedCode.forEach((digit, i) => {
          newOtp[i] = digit;
        });
        setOtpCode(newOtp);

        // Focus last filled input or last input
        const lastFilledIndex = Math.min(pastedCode.length - 1, 5);
        otpInputRefs.current[lastFilledIndex]?.focus();

        // Auto-submit if 6 digits pasted (defer to avoid race condition with state)
        if (pastedCode.length === 6) {
          setTimeout(() => {
            handleVerifyOtp(newOtp.join(''));
          }, 50);
        }
        return;
      }

      // Single digit input
      const digit = digits.slice(-1);
      const newOtp = [...otpCode];
      newOtp[index] = digit;
      setOtpCode(newOtp);

      // Auto-advance to next input
      if (digit && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 6 digits are entered
      if (digit && index === 5) {
        const fullCode = newOtp.join('');
        if (fullCode.length === 6) {
          handleVerifyOtp(fullCode);
        }
      }
    },
    [otpCode]
  );

  const handleOtpKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace' && !otpCode[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        otpInputRefs.current[index - 1]?.focus();
        const newOtp = [...otpCode];
        newOtp[index - 1] = '';
        setOtpCode(newOtp);
      }
    },
    [otpCode]
  );

  const handleVerifyOtp = async (code?: string) => {
    const otpString = code || otpCode.join('');

    if (otpString.length !== 6) {
      setGeneralError(t('login.otpIncomplete'));
      return;
    }

    setIsLoading(true);
    setGeneralError('');

    try {
      const result = await loginWithOtp(email, otpString);

      if (result.success) {
        // Don't navigate - AuthGate handles redirect
      } else {
        setGeneralError(result.error || t('login.otpVerifyFailed'));
        // Clear OTP on error
        setOtpCode(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
        setIsLoading(false);
      }
    } catch (error) {
      setGeneralError(t('login.otpVerifyFailed'));
      setOtpCode(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      setIsLoading(false);
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
          {/* Back button - show for tenant selection OR when on OTP step */}
          {isTenantRequired || step === 'otp' ? (
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
            <AnimatedView duration={500} delay={200} animation="slideInBottom" className="px-5">
              <View className="px-2">
                {/* Header */}
                <View className="mb-8 items-center justify-center">
                  {!isKeyboardVisible && (
                    <Image
                      source={logoSource}
                      className="mb-6 h-24 w-24 rounded-2xl"
                      resizeMode="contain"
                      fadeDuration={0}
                      resizeMethod="resize"
                    />
                  )}
                  <ThemedText
                    className="text-center font-outfit-bold"
                    style={{ fontSize: 32, lineHeight: 38 }}>
                    {step === 'email'
                      ? t('login.titleWithTenant', { tenant: tenant?.name })
                      : t('login.otpTitle')}
                  </ThemedText>
                  <ThemedText
                    className="mt-2 text-center opacity-60"
                    style={{ fontSize: 16, lineHeight: 22 }}>
                    {step === 'email' ? t('login.otpSubtitle') : t('login.otpEnterCode', { email })}
                  </ThemedText>
                </View>

                {/* Error message */}
                {generalError ? (
                  <View className="mb-5 rounded-xl border border-red-500 bg-red-500/10 p-4">
                    <ThemedText className="text-center text-base text-red-500">
                      {generalError}
                    </ThemedText>
                  </View>
                ) : null}

                {step === 'email' ? (
                  <>
                    {/* Email Input */}
                    <View className="mb-5">
                      <ThemedText className="mb-2 text-base font-medium opacity-70">
                        {t('login.email')}
                      </ThemedText>
                      <TextInput
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (emailError) validateEmail(text);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        onSubmitEditing={handleRequestOtp}
                        placeholder="you@example.com"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        style={{
                          height: 60,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: emailError ? '#EF4444' : 'rgba(255,255,255,0.2)',
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          paddingHorizontal: 18,
                          fontSize: 18,
                          color: '#fff',
                        }}
                      />
                      {emailError ? (
                        <ThemedText className="mt-2 text-sm text-red-500">{emailError}</ThemedText>
                      ) : null}
                    </View>

                    <Button
                      title={
                        retryAfter > 0
                          ? t('login.otpRetryIn', { seconds: retryAfter })
                          : t('login.sendCode')
                      }
                      onPress={handleRequestOtp}
                      loading={isLoading}
                      disabled={retryAfter > 0}
                      size="large"
                    />
                  </>
                ) : (
                  <>
                    {/* OTP Input */}
                    <View className="mb-6 flex-row justify-between" style={{ gap: 10 }}>
                      {otpCode.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => {
                            otpInputRefs.current[index] = ref;
                          }}
                          value={digit.slice(0, 1)}
                          onChangeText={(value) => handleOtpChange(index, value)}
                          onKeyPress={({ nativeEvent }) =>
                            handleOtpKeyPress(index, nativeEvent.key)
                          }
                          keyboardType="number-pad"
                          selectTextOnFocus
                          style={{
                            height: 52,
                            flex: 1,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: digit ? colors.highlight : 'rgba(255,255,255,0.2)',
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            textAlign: 'center',
                            fontSize: 24,
                            fontWeight: 'bold',
                            color: '#fff',
                          }}
                        />
                      ))}
                    </View>

                    <Button
                      title={t('login.verify')}
                      onPress={() => handleVerifyOtp()}
                      loading={isLoading}
                      size="large"
                      className="mb-5"
                    />

                    {/* Resend code */}
                    <Pressable
                      onPress={handleResendOtp}
                      disabled={retryAfter > 0 || isLoading}
                      className="py-3">
                      <ThemedText
                        className={`text-center ${retryAfter > 0 ? 'opacity-50' : ''}`}
                        style={{ fontSize: 15 }}>
                        {retryAfter > 0
                          ? t('login.otpRetryIn', { seconds: retryAfter })
                          : t('login.resendCode')}
                      </ThemedText>
                    </Pressable>
                  </>
                )}
              </View>
            </AnimatedView>

            {/* Not a member link - hidden when keyboard is open or on OTP step */}
            {signupLink && !isKeyboardVisible && step === 'email' && (
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
