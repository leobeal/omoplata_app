import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  ImageBackground,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import NfcManagerModule, {
  NfcTech as NfcTechType,
  Ndef as NdefType,
} from 'react-native-nfc-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// NFC module - always import, check support at runtime

import api from '@/api/client';
import { ENDPOINTS, setTenant as setApiTenant } from '@/api/config';
import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import Icon, { IconName } from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useT } from '@/contexts/LocalizationContext';
import { useTenant } from '@/contexts/TenantContext';
import { useThemeColors } from '@/contexts/ThemeColors';

const NfcManager = NfcManagerModule;
const NfcTech = NfcTechType;
const Ndef = NdefType;

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
    icon: 'CalendarDays',
  },
  {
    id: '2',
    titleKey: 'onboarding.slide2.title',
    image: require('@/assets/_global/img/2.jpg'),
    descriptionKey: 'onboarding.slide2.description',
    icon: 'Wallet',
  },
  {
    id: '3',
    titleKey: 'onboarding.slide3.title',
    image: require('@/assets/_global/img/3.jpg'),
    descriptionKey: 'onboarding.slide3.description',
    icon: 'Users',
  },
  {
    id: '4',
    titleKey: 'onboarding.slide4.title',
    image: require('@/assets/_global/img/6.jpg'),
    descriptionKey: 'onboarding.slide4.description',
    icon: 'Trophy',
  },
];

type ViewMode = 'slider' | 'scanner' | 'manual';

export default function TenantSelectionScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const t = useT();
  const { setTenant } = useTenant();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [isScanning, setIsScanning] = useState(true);
  const isProcessingRef = useRef(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [manualSlug, setManualSlug] = useState('');

  const [permission, requestPermission] = useCameraPermissions();

  // Check NFC support on mount
  useEffect(() => {
    const checkNfc = async () => {
      try {
        // Check if NFC is supported on this device
        const supported = await NfcManager.isSupported();
        console.log('NFC: isSupported =', supported);
        setNfcSupported(supported);

        if (supported) {
          // Initialize NFC manager
          await NfcManager.start();
          console.log('NFC: Manager started successfully');
        }
      } catch (err) {
        console.log('NFC: Error during setup:', err);
        setNfcSupported(false);
      }
    };
    checkNfc();

    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const validateTenantSlug = (slug: string): boolean => {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slug || !slugRegex.test(slug) || slug.length < 2) {
      return false;
    }
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
      isProcessingRef.current = false;
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      setApiTenant(slug);
      const checkResponse = await api.get(ENDPOINTS.TENANT.CHECK);

      if (checkResponse.status === 404) {
        setError(t('tenantSelection.errors.invalidQr'));
        setIsLoading(false);
        setIsScanning(true);
        // Reset after delay to allow retry
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 2000);
        return;
      }

      if (checkResponse.error) {
        setError(t('common.error'));
        setIsLoading(false);
        setIsScanning(true);
        // Reset after delay to allow retry
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 2000);
        return;
      }

      const apiData = checkResponse.data;

      const tenantInfo = {
        slug,
        name:
          apiData?.tenant?.name || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
        domain: getDomainForTenant(slug),
        signup_link: apiData?.signup_link,
      };

      await setTenant(tenantInfo);
      router.replace('/screens/login');
    } catch (err) {
      setError(t('tenantSelection.errors.failed'));
      console.error('Failed to set tenant:', err);
      setIsLoading(false);
      setIsScanning(true);
      // Reset after delay to allow retry
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2000);
    }
  };

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      // Use ref for immediate synchronous check to prevent multiple calls
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      setIsScanning(false);

      const slug = extractSlugFromUrl(data);

      if (!slug) {
        setError(t('tenantSelection.errors.invalidQr'));
        // Re-enable scanning after a delay
        setTimeout(() => {
          setError('');
          setIsScanning(true);
          isProcessingRef.current = false;
        }, 2000);
        return;
      }

      handleTenantConnect(slug);
    },
    [t]
  );

  const switchToSlider = () => {
    setViewMode('slider');
    setError('');
  };

  const switchToScanner = () => {
    setViewMode('scanner');
    setError('');
    setIsScanning(true);
    isProcessingRef.current = false;
  };

  const switchToNfc = async () => {
    setError('');
    isProcessingRef.current = false;
    startNfcScan();
  };

  const startNfcScan = async () => {
    if (isProcessingRef.current) return;

    try {
      setIsNfcScanning(true);
      setError('');

      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Get the tag
      const tag = await NfcManager.getTag();

      if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
        let url: string | null = null;

        // Try to find a URL in the NFC records
        for (const record of tag.ndefMessage) {
          const payload = new Uint8Array(record.payload);

          // Check if it's a URI record (TNF=1, type='U')
          if (record.tnf === 1 && String.fromCharCode(...record.type) === 'U') {
            url = Ndef.uri.decodePayload(payload);
            break;
          }

          // Check if it's a text record that contains a URL
          if (record.tnf === 1 && String.fromCharCode(...record.type) === 'T') {
            const text = Ndef.text.decodePayload(payload);
            if (text?.startsWith('http')) {
              url = text;
              break;
            }
          }
        }

        if (url) {
          // Extract slug from URL (same as QR code)
          const slug = extractSlugFromUrl(url);

          if (slug) {
            isProcessingRef.current = true;
            await handleTenantConnect(slug);
          } else {
            setError(t('tenantSelection.errors.invalidQr'));
            setTimeout(() => {
              setError('');
              startNfcScan();
            }, 2000);
          }
        } else {
          setError(t('tenantSelection.errors.invalidQr'));
          setTimeout(() => {
            setError('');
            startNfcScan();
          }, 2000);
        }
      }
    } catch (ex) {
      // User cancelled or error
      console.log('NFC Error:', ex);
    } finally {
      setIsNfcScanning(false);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  const cancelNfcScan = () => {
    NfcManager?.cancelTechnologyRequest?.().catch(() => {});
    setIsNfcScanning(false);
  };

  const switchToManual = () => {
    setViewMode('manual');
    setError('');
    setManualSlug('');
  };

  const handleManualSubmit = async () => {
    const slug = manualSlug.trim().toLowerCase();

    if (!validateTenantSlug(slug)) {
      setError(t('tenantSelection.errors.invalid'));
      return;
    }

    await handleTenantConnect(slug);
  };

  // Render the Manual Entry view
  const renderManualEntryView = () => {
    return (
      <View className="flex-1 bg-black">
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
                <Icon name="Keyboard" size={40} strokeWidth={1.5} color="white" />
              </View>

              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 24,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 12,
                }}>
                {t('tenantSelection.manualTitle')}
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 16,
                  textAlign: 'center',
                  marginBottom: 32,
                  paddingHorizontal: 20,
                }}>
                {t('tenantSelection.manualSubtitle')}
              </Text>

              {/* Input field */}
              <View className="mb-4 w-full">
                <TextInput
                  value={manualSlug}
                  onChangeText={setManualSlug}
                  placeholder={t('tenantSelection.placeholder')}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    borderColor: error ? colors.error : 'rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: 'white',
                    fontSize: 16,
                    textAlign: 'center',
                  }}
                  onSubmitEditing={handleManualSubmit}
                />
              </View>

              {/* Error message */}
              {error && !isLoading ? (
                <View
                  style={{
                    backgroundColor: colors.error + 'E6',
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}>
                  <Icon name="AlertCircle" size={18} color="white" style={{ marginRight: 8 }} />
                  <Text style={{ color: 'white', fontSize: 14 }}>{error}</Text>
                </View>
              ) : null}

              <Button
                title={isLoading ? '' : t('tenantSelection.connect')}
                onPress={handleManualSubmit}
                loading={isLoading}
                disabled={!manualSlug.trim() || isLoading}
                className="mb-4 w-full"
              />

              <TouchableOpacity onPress={switchToSlider} className="py-3">
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  {t('common.back')}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
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
                <TouchableOpacity onPress={switchToSlider} className="py-3">
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                    {t('common.back')}
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

            {/* Bottom overlay with back button */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={{
                paddingBottom: insets.bottom + 24,
                paddingHorizontal: 24,
                paddingTop: 40,
                alignItems: 'center',
              }}>
              <TouchableOpacity onPress={switchToSlider} className="py-4">
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 16,
                    textDecorationLine: 'underline',
                  }}>
                  {t('common.back')}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </CameraView>
      </View>
    );
  };

  // Render the slider view with QR code button
  const renderSliderView = () => {
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
                      paddingBottom: 200,
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

        {/* Bottom CTA - Fixed at bottom */}
        <View
          className="absolute bottom-0 left-0 right-0"
          style={{ paddingBottom: insets.bottom + 24 }}>
          <AnimatedView
            animation="bounceIn"
            duration={600}
            delay={200}
            className="items-center px-6">
            {/* QR Code Button */}
            <Pressable onPress={switchToScanner}>
              <AnimatedView animation="pulse" duration={2000} iterationCount="infinite">
                <View
                  className="mb-5 items-center justify-center rounded-xl border border-white/20 p-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.09)' }}>
                  <View
                    className="items-center justify-center rounded-full"
                    style={{
                      backgroundColor: colors.primary,
                      width: 80,
                      height: 80,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                      elevation: 10,
                    }}>
                    <Icon name="QrCode" size={72} strokeWidth={1.5} color="white" />
                  </View>
                </View>
              </AnimatedView>
            </Pressable>

            <ThemedText className="mb-2 text-center text-base leading-6 opacity-70">
              {t('tenantSelection.scanDescription')}
            </ThemedText>

            <ThemedText
              className="text-center text-lg font-semibold"
              style={{ color: colors.primary }}>
              {t('tenantSelection.tapToScan')}
            </ThemedText>

            {/* Alternative options */}
            {(nfcSupported || Constants.expoConfig?.extra?.env === 'development') && (
              <View className="mt-5 flex-row items-center justify-center gap-3">
                {nfcSupported && (
                  <TouchableOpacity
                    onPress={switchToNfc}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                    }}>
                    <Icon name="Smartphone" size={18} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
                      {t('tenantSelection.useNfcInstead')}
                    </Text>
                  </TouchableOpacity>
                )}
                {Constants.expoConfig?.extra?.env === 'development' && (
                  <TouchableOpacity
                    onPress={switchToManual}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                    }}>
                    <Icon name="Keyboard" size={18} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
                      {t('tenantSelection.enterManually')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </AnimatedView>
        </View>

        {/* NFC Modal for Android - iOS-style bottom sheet */}
        {Platform.OS === 'android' && (
          <Modal
            visible={isNfcScanning}
            transparent
            animationType="slide"
            onRequestClose={cancelNfcScan}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              {/* Backdrop */}
              <Pressable
                onPress={cancelNfcScan}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }}
              />
              {/* Bottom sheet */}
              <View
                style={{
                  backgroundColor: '#1c1c1e',
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  paddingTop: 8,
                  paddingBottom: insets.bottom + 16,
                }}>
                {/* Handle bar */}
                <View
                  style={{
                    width: 36,
                    height: 5,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderRadius: 3,
                    alignSelf: 'center',
                    marginBottom: 20,
                  }}
                />

                {/* Content */}
                <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
                  <AnimatedView animation="pulse" duration={2000} iterationCount="infinite">
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                      }}>
                      <Icon name="Nfc" size={32} strokeWidth={1.5} color="white" />
                    </View>
                  </AnimatedView>

                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 17,
                      fontWeight: '600',
                      textAlign: 'center',
                      marginBottom: 6,
                    }}>
                    {t('tenantSelection.nfcTitle')}
                  </Text>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 13,
                      textAlign: 'center',
                      marginBottom: 24,
                    }}>
                    {t('tenantSelection.nfcSubtitle')}
                  </Text>

                  <TouchableOpacity
                    onPress={cancelNfcScan}
                    style={{
                      width: '100%',
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      alignItems: 'center',
                    }}>
                    <Text style={{ color: '#0a84ff', fontSize: 17, fontWeight: '600' }}>
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  };

  if (viewMode === 'scanner') return renderScannerView();
  if (viewMode === 'manual') return renderManualEntryView();
  return renderSliderView();
}
