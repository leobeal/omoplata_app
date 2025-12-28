import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

type ViewMode = 'scanner' | 'form';

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
  const [viewMode, setViewMode] = useState<ViewMode>('scanner');
  const [isScanning, setIsScanning] = useState(true);

  const [permission, requestPermission] = useCameraPermissions();

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

  /**
   * Extract tenant slug from a URL
   * Supports formats like:
   * - https://evolve-grappling.omoplata.de
   * - https://evolve-grappling.omoplata.eu
   * - https://evolve-grappling.sportsmanager.test
   */
  const extractSlugFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Match patterns like: slug.omoplata.de, slug.omoplata.eu, slug.sportsmanager.test
      const validDomains = ['omoplata.de', 'omoplata.eu', 'sportsmanager.test'];

      for (const domain of validDomains) {
        if (hostname.endsWith(domain)) {
          // Extract the subdomain (tenant slug)
          const slug = hostname.replace(`.${domain}`, '');
          if (slug && slug !== hostname) {
            return slug.toLowerCase();
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleTenantConnect = async (slug: string) => {
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
        setIsScanning(true);
        return;
      }

      if (checkResponse.error) {
        setError(t('common.error'));
        setIsLoading(false);
        setIsScanning(true);
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
      setIsScanning(true);
    }
  };

  const handleContinue = async () => {
    const slug = tenantSlug.toLowerCase().trim();
    await handleTenantConnect(slug);
  };

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (!isScanning || isLoading) return;

      setIsScanning(false);

      const slug = extractSlugFromUrl(data);

      if (!slug) {
        setError(t('tenantSelection.errors.invalidQr'));
        // Re-enable scanning after a delay
        setTimeout(() => {
          setError('');
          setIsScanning(true);
        }, 2000);
        return;
      }

      handleTenantConnect(slug);
    },
    [isScanning, isLoading, t]
  );

  const switchToForm = () => {
    setViewMode('form');
    setError('');
    setClubNotFound(false);
  };

  const switchToScanner = () => {
    setViewMode('scanner');
    setError('');
    setClubNotFound(false);
    setIsScanning(true);
  };

  // Render the QR Scanner view
  const renderScannerView = () => {
    if (!permission) {
      return (
        <View className="flex-1 items-center justify-center bg-black">
          <ActivityIndicator size="large" color="white" />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View className="flex-1 bg-black">
          {/* Background with slide */}
          <ImageBackground source={slides[0].image} style={{ flex: 1 }}>
            <LinearGradient colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']} style={{ flex: 1 }}>
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 32,
                }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                  }}>
                  <Icon name="Camera" size={40} strokeWidth={1.5} color="white" />
                </View>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 24,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: 12,
                  }}>
                  {t('tenantSelection.permissionRequired')}
                </Text>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 16,
                    textAlign: 'center',
                    marginBottom: 32,
                    paddingHorizontal: 20,
                  }}>
                  {t('tenantSelection.permissionMessage')}
                </Text>
                <Button
                  title={t('tenantSelection.grantPermission')}
                  onPress={requestPermission}
                  className="mb-4 w-full"
                />
                <TouchableOpacity onPress={switchToForm} className="py-3">
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                    {t('tenantSelection.noQrCode')}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
      );
    }

    return (
      <View className="flex-1 bg-black">
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}>
          {/* Overlay */}
          <View style={{ flex: 1 }}>
            {/* Top overlay with title */}
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={{
                paddingTop: insets.top + 16,
                paddingHorizontal: 24,
                paddingBottom: 40,
              }}>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 28,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 8,
                }}>
                {t('tenantSelection.scanTitle')}
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 16,
                  textAlign: 'center',
                }}>
                {t('tenantSelection.scanSubtitle')}
              </Text>
            </LinearGradient>

            {/* Center scanning area */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View
                style={{
                  width: 250,
                  height: 250,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.5)',
                  borderRadius: 24,
                  position: 'relative',
                }}>
                {/* Corner accents */}
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    width: 40,
                    height: 40,
                    borderTopWidth: 4,
                    borderLeftWidth: 4,
                    borderColor: 'white',
                    borderTopLeftRadius: 24,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 40,
                    height: 40,
                    borderTopWidth: 4,
                    borderRightWidth: 4,
                    borderColor: 'white',
                    borderTopRightRadius: 24,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: -2,
                    width: 40,
                    height: 40,
                    borderBottomWidth: 4,
                    borderLeftWidth: 4,
                    borderColor: 'white',
                    borderBottomLeftRadius: 24,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 40,
                    height: 40,
                    borderBottomWidth: 4,
                    borderRightWidth: 4,
                    borderColor: 'white',
                    borderBottomRightRadius: 24,
                  }}
                />
              </View>

              {/* Loading indicator when processing */}
              {isLoading && (
                <View
                  style={{
                    position: 'absolute',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: 16,
                    padding: 24,
                  }}>
                  <ActivityIndicator size="large" color="white" />
                </View>
              )}

              {/* Error message */}
              {error && !isLoading ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: -80,
                    backgroundColor: colors.error + 'E6',
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Icon name="AlertCircle" size={18} color="white" style={{ marginRight: 8 }} />
                  <Text style={{ color: 'white', fontSize: 14 }}>{error}</Text>
                </View>
              ) : null}
            </View>

            {/* Bottom overlay with "Don't have a QR code?" link */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={{
                paddingBottom: insets.bottom + 24,
                paddingHorizontal: 24,
                paddingTop: 40,
                alignItems: 'center',
              }}>
              <TouchableOpacity onPress={switchToForm} className="py-4">
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 16,
                    textDecorationLine: 'underline',
                  }}>
                  {t('tenantSelection.noQrCode')}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </CameraView>
      </View>
    );
  };

  // Render the manual form view
  const renderFormView = () => {
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
                <LinearGradient
                  colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
                  style={{ flex: 1 }}>
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

        {/* Back button - Fixed at top left */}
        <TouchableOpacity
          onPress={switchToScanner}
          style={{
            position: 'absolute',
            top: insets.top + 16,
            left: 16,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="ArrowLeft" size={24} color="white" />
        </TouchableOpacity>

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

                {/* Scan QR Instead Link */}
                <TouchableOpacity
                  onPress={switchToScanner}
                  className="flex-row items-center justify-center py-2">
                  <Icon name="QrCode" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <ThemedText className="text-center text-sm" style={{ color: colors.primary }}>
                    {t('tenantSelection.scanInstead')}
                  </ThemedText>
                </TouchableOpacity>

                {/* Help Text */}
                <View className="mt-2 flex-row items-center justify-center">
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
  };

  return viewMode === 'scanner' ? renderScannerView() : renderFormView();
}
