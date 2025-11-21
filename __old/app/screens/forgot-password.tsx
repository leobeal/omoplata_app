import React, { useState } from 'react';
import { View, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import LottieView from 'lottie-react-native';

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

  const handleResetPassword = () => {
    const isEmailValid = validateEmail(email);

    if (isEmailValid) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // Show success message
        Alert.alert(
          "Password Reset Link Sent",
          "We've sent a password reset link to your email address. Please check your inbox.",
          [
            { text: "OK", onPress: () => router.back() }
          ]
        );
      }, 1500);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#101010']} locations={[0, 0.5]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        className="flex-1">
        <StatusBar style='light' />
        <View className='flex-1' style={{ paddingTop: insets.top, }}>
          <View className="w-full flex-row items-center justify-between px-global">
            <Icon name="ArrowLeft" onPress={() => router.back()} size={24} color="white" />
            <Link href="/screens/login" className='text-white border border-white/60 px-3 rounded-xl py-2'>Login</Link>
          </View>
          <View className='flex-1 w-full items-center justify-center pb-10'>
          
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          
        >
          <AnimatedView duration={500} delay={200} animation='slideInBottom' className='p-4'>
            <View className="p-6 bg-background border-border border rounded-3xl">
              <View className='items-center justify-center mb-6'>
                <ThemedText className="text-3xl font-outfit-bold">Reset Password</ThemedText>
                <ThemedText className="text-sm">
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
              />
              
              <Button 
                title="Send Reset Link" 
                onPress={handleResetPassword} 
                loading={isLoading}
                size="large"
                className="mb-4 mt-4"
              />
              
            </View>
          </AnimatedView>
        </KeyboardAvoidingView>
      </ScrollView>
    </LinearGradient>
  );
}