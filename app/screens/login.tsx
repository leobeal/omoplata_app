import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/contexts/ThemeColors';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { login } = useAuth();
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
      } catch (error) {
        setGeneralError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="w-full flex-row items-center justify-between px-global"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Icon name="ArrowLeft" onPress={() => router.back()} size={24} color={colors.text} />
          <Link href="/screens/signup" className="text-text border border-border px-3 rounded-xl py-2">
            Sign Up
          </Link>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Login Form */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <AnimatedView duration={500} delay={200} animation="slideInBottom" className="p-4">
            <View className="p-6 bg-secondary border border-border rounded-3xl">
              <View className="items-center justify-center mb-6">
                <ThemedText className="text-3xl font-outfit-bold">Login</ThemedText>
                <ThemedText className="text-sm opacity-60">Sign in to your account</ThemedText>
              </View>

              {generalError ? (
                <View className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-4">
                  <ThemedText className="text-red-500 text-center">{generalError}</ThemedText>
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
                isPassword={true}
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

              <Link className="underline text-center text-text text-sm mb-4" href="/screens/forgot-password">
                Forgot Password?
              </Link>
            </View>
          </AnimatedView>
        </KeyboardAvoidingView>

        {/* Bottom Spacer for safe area */}
        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}
