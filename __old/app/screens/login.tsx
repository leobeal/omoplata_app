import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Text, ScrollView, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { Stack, Link, router } from 'expo-router';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeColors from '@/app/contexts/ThemeColors';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
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

  const handleLogin = () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // Navigate to home screen after successful login
        router.replace('/(drawer)/(tabs)/');
      }, 1500);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    // Implement social login logic here
  };

  return (
    <ImageBackground source={require('@/assets/_global/img/onboarding-1.jpg')} style={{ flex: 1 }}>
    <LinearGradient colors={['transparent', 'transparent']} style={{ flex: 1 }}>
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
            <Link href="/screens/signup" className='text-white border border-white/60 px-3 rounded-xl py-2'>Sign Up</Link>
          </View>
          
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          
        >
          <AnimatedView duration={500} delay={200} animation='slideInBottom' className='p-4'>
            <View className="p-6 bg-background border border-border rounded-3xl">
              <View className='items-center justify-center mb-6'>
                <ThemedText className="text-3xl font-outfit-bold">Login</ThemedText>
                <ThemedText className="text-sm">Sign in to your account</ThemedText>
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
                variant='inline'
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
              />
              <Button 
                title="Login" 
                onPress={handleLogin} 
                loading={isLoading}
                size="large"
                className="mb-4"
              />
              <Link className='underline text-center text-text text-sm mb-4' href="/screens/forgot-password">
                  Forgot Password?
              </Link>
              
             
            </View>
          </AnimatedView>
        </KeyboardAvoidingView>
      </ScrollView>
    </LinearGradient>
    </ImageBackground>
  );
}