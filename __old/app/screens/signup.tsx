import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Text, KeyboardAvoidingView, ScrollView, Platform, ImageBackground } from 'react-native';
import { Link, router } from 'expo-router';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthText, setStrengthText] = useState('');

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

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) {
      strength += 25;
    } else {
      feedback.push('At least 8 characters');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('Add uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('Add lowercase letter');
    }

    // Numbers or special characters check
    if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('Add number or special character');
    }

    setPasswordStrength(strength);
    setStrengthText(feedback.join(' • ') || 'Strong password!');
    return strength >= 75;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    const isStrong = checkPasswordStrength(password);
    if (!isStrong) {
      setPasswordError('Please create a stronger password');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Confirm password is required');
      return false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSignup = () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // Navigate to home screen after successful login
        router.replace('/screens/login-flow/welcome');
      }, 1500);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    // Implement social login logic here
  };

  return (
    <ImageBackground source={require('@/assets/_global/img/wallpaper-3.jpg')} style={{ flex: 1 }}>
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
              <Link href="/screens/login-flow/login" className='text-white border border-white/60 px-3 rounded-xl py-2'>Login</Link>
            </View>
            {/*<View className='flex-1 w-full items-center justify-center pb-10'>
              <LottieView
                autoPlay
                style={{
                  width: 250,
                  height: 250,
                }}
                source={require('@/assets/lottie/lottie.json')}
              />
            </View>*/}
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}

          >
            <AnimatedView duration={500} delay={200} animation='slideInBottom' className='p-4'>

                <View className="p-6 bg-background rounded-3xl border border-border">
                  <View className='items-center justify-center mb-6'>
                    <ThemedText className="text-3xl font-outfit-bold">Sign up</ThemedText>
                    <ThemedText className="text-sm ">Enter your details below</ThemedText>
                  </View>

                  <Input
                    label="Email"
                    //leftIcon="mail"
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

                  <Input
                    label="Password"
                    //leftIcon="lock"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      checkPasswordStrength(text);
                      if (passwordError) validatePassword(text);
                    }}
                    error={passwordError}
                    isPassword={true}
                    autoCapitalize="none"
                  />

                  <Input
                    label="Confirm password"
                    //leftIcon="lock"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (confirmPasswordError) validateConfirmPassword(text);
                    }}
                    error={confirmPasswordError}
                    isPassword={true}
                    autoCapitalize="none"
                  />
                  {password.length > 0 && (
                    <View className="mb-4">
                      <View className="w-full h-1 bg-secondary  dark:bg-dark-secondary rounded-full overflow-hidden">
                        <View
                          className={`h-full rounded-full ${passwordStrength >= 75 ? 'bg-green-500' : passwordStrength >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </View>
                      <ThemedText className="text-xs mt-1 text-light-subtext dark:text-dark-subtext">
                        {strengthText}
                      </ThemedText>
                    </View>
                  )}

                  <Button
                    title="Sign up"
                    onPress={handleSignup}
                    loading={isLoading}
                    size="large"
                    className="mb-4"
                    textClassName='text-invert'
                  />

                  <View className="flex-row justify-center">
                    <ThemedText className="text-sm opacity-50">By signing up you agree to our Terms & Conditions </ThemedText>

                  </View>
                </View>
            </AnimatedView>
          </KeyboardAvoidingView>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  googleIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#4285F4',
    borderRadius: 2,
  },
});