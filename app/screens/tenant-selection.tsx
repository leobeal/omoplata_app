import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useTenant } from '@/contexts/TenantContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function TenantSelectionScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { setTenant } = useTenant();
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateTenantSlug = (slug: string): boolean => {
    // Tenant slug should be alphanumeric and lowercase, may contain hyphens
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slug) {
      setError('Please enter your gym identifier');
      return false;
    }
    if (!slugRegex.test(slug)) {
      setError('Gym identifier can only contain lowercase letters, numbers, and hyphens');
      return false;
    }
    if (slug.length < 2) {
      setError('Gym identifier must be at least 2 characters');
      return false;
    }
    setError('');
    return true;
  };

  const getDomainForTenant = (slug: string): string => {
    const env = Constants.expoConfig?.extra?.env || 'development';
    switch (env) {
      case 'development':
        return `${slug}.sportsmanager.test`;
      case 'staging':
        return `${slug}.omoplata.eu`;
      case 'production':
        return `${slug}.omoplata.de`;
      default:
        return `${slug}.sportsmanager.test`;
    }
  };

  const handleContinue = async () => {
    const slug = tenantSlug.toLowerCase().trim();
    if (!validateTenantSlug(slug)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const tenantInfo = {
        slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
        domain: getDomainForTenant(slug),
      };

      await setTenant(tenantInfo);

      // Navigate to login screen
      router.replace('/screens/login');
    } catch (err) {
      setError('Failed to save gym selection. Please try again.');
      console.error('Failed to set tenant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        className="flex-1">
        {/* Header */}
        <View
          className="w-full flex-row items-center justify-between px-global"
          style={{ paddingTop: insets.top + 16 }}>
          <View style={{ width: 24 }} />
          <ThemedText className="text-lg font-semibold">Omoplata</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Spacer */}
        <View style={{ flex: 0.2 }} />

        {/* Content */}
        <AnimatedView className="flex-1 px-global">
          {/* Logo/Icon Area */}
          <View className="mb-8 items-center">
            <View
              className="h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primary + '20' }}>
              <Icon name="Building2" size={40} color={colors.primary} />
            </View>
          </View>

          {/* Title */}
          <ThemedText className="mb-2 text-3xl font-bold">Welcome to Omoplata</ThemedText>
          <ThemedText className="text-text-muted mb-8 text-base">
            Enter your gym identifier to get started
          </ThemedText>

          {/* Input */}
          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-medium">Gym Identifier</ThemedText>
            <View
              className="flex-row items-center rounded-xl px-4 py-3"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: error ? colors.error : colors.border,
              }}>
              <TextInput
                value={tenantSlug}
                onChangeText={(text) => {
                  setTenantSlug(text.toLowerCase());
                  setError('');
                }}
                placeholder="e.g., evolve"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 16,
                }}
              />
            </View>
            {error ? <ThemedText className="text-error mt-1 text-sm">{error}</ThemedText> : null}
          </View>

          {/* Info Box */}
          <View className="mb-6 rounded-xl p-4" style={{ backgroundColor: colors.primary + '10' }}>
            <View className="flex-row items-start">
              <Icon
                name="Info"
                size={20}
                color={colors.primary}
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <View className="flex-1">
                <ThemedText className="text-text-muted text-sm">
                  Not sure what your gym identifier is? Contact your gym or check the welcome email
                  you received.
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <Button
            onPress={handleContinue}
            disabled={isLoading || !tenantSlug.trim()}
            className="mb-4">
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <ThemedText className="text-base font-semibold text-white">Continue</ThemedText>
            )}
          </Button>

          {/* Bottom Spacer */}
          <View style={{ flex: 0.3 }} />
        </AnimatedView>
      </ScrollView>
    </View>
  );
}
