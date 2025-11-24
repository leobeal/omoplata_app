import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { isTenantRequired } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
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
          // Navigate to home screen after successful login
          router.replace('/');
        } else {
          setGeneralError(result.error || 'Login failed. Please try again.');
        }
      } catch {
        setGeneralError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <ImageBackground source={require('@/assets/_global/img/onboarding-1.jpg')} style={{ flex: 1 }}>
      <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces
          alwaysBounceVertical
          className="flex-1">
          <StatusBar style="light" />

          {/* Header */}
          <View
            className="w-full flex-row items-center justify-between px-global"
            style={{ paddingTop: insets.top + 16 }}>
            {/* Only show back button for generic builds where tenant selection is required */}
            {isTenantRequired ? (
              <Icon name="ArrowLeft" onPress={handleBack} size={24} color="white" />
            ) : (
              <View style={{ width: 24 }} />
            )}
            <View style={{ width: 24 }} />
          </View>

          {/* Spacer */}
          <View className="flex-1" />

          {/* Login Form */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            <AnimatedView duration={500} delay={200} animation="slideInBottom" className="p-4">
              <View className="rounded-3xl border border-border bg-background p-6">
                <View className="mb-6 items-center justify-center">
                  <ThemedText className="font-outfit-bold text-3xl">Login</ThemedText>
                  <ThemedText className="text-sm opacity-60">Sign in to your account</ThemedText>
                </View>

                {generalError ? (
                  <View className="mb-4 rounded-lg border border-red-500 bg-red-500/10 p-3">
                    <ThemedText className="text-center text-red-500">{generalError}</ThemedText>
                  </View>
                ) : null}

                <Input
                  label="Email"
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
                  label="Password"
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
                  title="Login"
                  onPress={handleLogin}
                  loading={isLoading}
                  size="large"
                  className="mb-4"
                />

                <Link
                  className="mb-4 text-center text-sm text-text underline"
                  href="/screens/forgot-password">
                  Forgot Password?
                </Link>
              </View>
            </AnimatedView>
          </KeyboardAvoidingView>

          {/* Bottom Spacer for safe area */}
          <View style={{ height: insets.bottom + 16 }} />
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
}
