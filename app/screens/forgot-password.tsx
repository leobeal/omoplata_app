import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, ImageBackground, Alert } from 'react-native';
import { router } from 'expo-router';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        Alert.alert(
          'Password Reset Link Sent',
          "We've sent a password reset link to your email address. Please check your inbox.",
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } catch (error) {
        setIsLoading(false);
        Alert.alert(
          'Error',
          'Failed to send password reset link. Please try again.',
          [{ text: 'OK' }]
        );
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
          bounces={true}
          alwaysBounceVertical={true}
          className="flex-1"
        >
          <StatusBar style="light" />

          {/* Header */}
          <View
            className="w-full flex-row items-center justify-between px-global"
            style={{ paddingTop: insets.top + 16 }}
          >
            <Icon name="ArrowLeft" onPress={() => router.back()} size={24} color="white" />
            <View style={{ width: 24 }} />
          </View>

          {/* Spacer */}
          <View className="flex-1" />

          {/* Reset Password Form */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <AnimatedView duration={500} delay={200} animation="slideInBottom" className="p-4">
              <View className="p-6 bg-background border border-border rounded-3xl">
                <View className="items-center justify-center mb-6">
                  <ThemedText className="text-3xl font-outfit-bold">Reset Password</ThemedText>
                  <ThemedText className="text-sm opacity-60 text-center">
                    Enter your email address to recover password
                  </ThemedText>
                </View>

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

                <Button
                  title="Send Reset Link"
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
