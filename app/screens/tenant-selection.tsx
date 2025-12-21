import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Text,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import api from '@/api/client';
import { ENDPOINTS, setTenant as setApiTenant } from '@/api/config';
import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import Icon, { IconName } from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import { getTenantConfig } from '@/configs/tenant-registry';
import { useT } from '@/contexts/LocalizationContext';
import { useTenant } from '@/contexts/TenantContext';
import { useThemeColors } from '@/contexts/ThemeColors';

const { width } = Dimensions.get('window');

interface SlideData {
  id: string;
  titleKey: string;
  image: ReturnType<typeof require>;
  descriptionKey: string;
  icon: IconName;
}

const slides: SlideData[] = [
  {
    id: '1',
    titleKey: 'onboarding.slide1.title',
    image: require('@/assets/_global/img/1.jpg'),
    descriptionKey: 'onboarding.slide1.description',
    icon: 'Calendar',
  },
  {
    id: '2',
    titleKey: 'onboarding.slide2.title',
    image: require('@/assets/_global/img/2.jpg'),
    descriptionKey: 'onboarding.slide2.description',
    icon: 'CreditCard',
  },
  {
    id: '3',
    titleKey: 'onboarding.slide3.title',
    image: require('@/assets/_global/img/3.jpg'),
    descriptionKey: 'onboarding.slide3.description',
    icon: 'MessageCircle',
  },
  {
    id: '4',
    titleKey: 'onboarding.slide4.title',
    image: require('@/assets/_global/img/1.jpg'),
    descriptionKey: 'onboarding.slide4.description',
    icon: 'Trophy',
  },
];

export default function TenantSelectionScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const t = useT();
  const { setTenant } = useTenant();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState('');
  const [clubNotFound, setClubNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const validateTenantSlug = (slug: string): boolean => {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slug) {
      setError(t('tenantSelection.errors.required'));
      return false;
    }
    if (!slugRegex.test(slug)) {
      setError(t('tenantSelection.errors.invalid'));
      return false;
    }
    if (slug.length < 2) {
      setError(t('tenantSelection.errors.tooShort'));
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
    setClubNotFound(false);

    try {
      setApiTenant(slug);
      const checkResponse = await api.get(ENDPOINTS.TENANT.CHECK);

      if (checkResponse.status === 404) {
        setClubNotFound(true);
        setIsLoading(false);
        return;
      }

      if (checkResponse.error) {
        setError(t('common.error'));
        setIsLoading(false);
        return;
      }

      const tenantConfig = getTenantConfig(slug);

      const tenantInfo = {
        slug,
        name: tenantConfig?.name || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
        domain: getDomainForTenant(slug),
        loginBackground: tenantConfig?.loginBackground,
      };

      await setTenant(tenantInfo);
      router.replace('/screens/login');
    } catch (err) {
      setError(t('tenantSelection.errors.failed'));
      console.error('Failed to set tenant:', err);
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Full-screen Slider */}
      <FlatList
        className="flex-1"
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={width}
        renderItem={({ item }) => (
          <View style={{ width, flex: 1 }}>
            <ImageBackground source={item.image} style={{ flex: 1 }}>
              <LinearGradient colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']} style={{ flex: 1 }}>
                {/* Slide Content */}
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 32,
                    paddingBottom: 380,
                    paddingTop: 60,
                  }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}>
                    <Icon name={item.icon} size={28} strokeWidth={1.5} color="white" />
                  </View>
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 30,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      marginBottom: 12,
                    }}>
                    {t(item.titleKey)}
                  </Text>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 16,
                      textAlign: 'center',
                    }}>
                    {t(item.descriptionKey)}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Pagination Dots - Fixed at top */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 16,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              marginHorizontal: 4,
              backgroundColor: index === currentIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </View>

      {/* Bottom Form - Fixed at bottom with ScrollView for bounce */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="absolute bottom-0 left-0 right-0">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces>
          <AnimatedView animation="bounceIn" duration={600} delay={200} className="p-4">
            <View
              className="rounded-3xl border border-border bg-background p-6"
              style={{ marginBottom: insets.bottom }}>
              <ThemedText className="mb-2 text-center text-xl font-bold">
                {t('tenantSelection.title')}
              </ThemedText>
              <ThemedText className="mb-6 text-center text-sm opacity-60">
                {t('tenantSelection.subtitle')}
              </ThemedText>

              {/* Input */}
              <Input
                label={t('tenantSelection.label')}
                value={tenantSlug}
                onChangeText={(text) => {
                  setTenantSlug(text.toLowerCase());
                  setError('');
                  setClubNotFound(false);
                }}
                placeholder={t('tenantSelection.placeholder')}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                error={error || (clubNotFound ? ' ' : undefined)}
                variant="inline"
                containerClassName="mb-6"
              />

              {/* Club Not Found Error */}
              {clubNotFound ? (
                <View
                  className="mb-3 rounded-xl p-3"
                  style={{ backgroundColor: colors.error + '15' }}>
                  <View className="flex-row items-center justify-center">
                    <Icon
                      name="AlertCircle"
                      size={16}
                      color={colors.error}
                      style={{ marginRight: 6 }}
                    />
                    <ThemedText className="text-sm font-medium" style={{ color: colors.error }}>
                      {t('clubNotFound.title')}
                    </ThemedText>
                  </View>
                  <ThemedText className="mt-1 text-center text-xs opacity-70">
                    {t('clubNotFound.message')}
                  </ThemedText>
                </View>
              ) : null}

              {/* Continue Button */}
              <Button
                title={t('common.continue')}
                onPress={handleContinue}
                disabled={isLoading || !tenantSlug.trim()}
                loading={isLoading}
                className="mb-4"
              />

              {/* Help Text */}
              <View className="flex-row items-center justify-center">
                <Icon
                  name="HelpCircle"
                  size={14}
                  color={colors.textMuted}
                  style={{ marginRight: 6 }}
                />
                <ThemedText className="text-center text-xs opacity-50">
                  {t('tenantSelection.help')}
                </ThemedText>
              </View>
            </View>
          </AnimatedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
