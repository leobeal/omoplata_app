import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import { useT } from '@/contexts/LocalizationContext';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleResetPassword = async () => {
    const isEmailValid = validateEmail(email);

    if (isEmailValid) {
      setIsLoading(true);

      try {
        // TODO: Replace with actual API call when password reset endpoint is available
        // const response = await api.post('/auth/forgot-password', { email });

        // Simulate API call for now
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsLoading(false);

        // Show success message
        Alert.alert(t('forgotPassword.successTitle'), t('forgotPassword.successMessage'), [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } catch {
        setIsLoading(false);
        Alert.alert(t('forgotPassword.errorTitle'), t('forgotPassword.errorMessage'), [
          { text: 'OK' },
        ]);
      }
    }
  };

  return (
    <ImageBackground source={require('@/assets/_global/img/1.jpg')} style={{ flex: 1 }}>
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
            <Icon name="ArrowLeft" onPress={() => router.back()} size={24} color="white" />
            <View style={{ width: 24 }} />
          </View>

          {/* Spacer */}
          <View className="flex-1" />

          {/* Reset Password Form */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            <AnimatedView duration={500} delay={200} animation="slideInBottom" className="p-4">
              <View className="rounded-3xl border border-border bg-background p-6">
                <View className="mb-6 items-center justify-center">
                  <ThemedText className="font-outfit-bold text-3xl">
                    {t('forgotPassword.title')}
                  </ThemedText>
                  <ThemedText className="text-center text-sm opacity-60">
                    {t('forgotPassword.subtitle')}
                  </ThemedText>
                </View>

                <Input
                  label={t('forgotPassword.email')}
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

                <Button
                  title={t('forgotPassword.sendResetLink')}
                  onPress={handleResetPassword}
                  loading={isLoading}
                  size="large"
                  className="mb-4"
                />
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
