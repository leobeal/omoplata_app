import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { checkinApi, transformNoClassesData } from '@/api';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useCheckinResult } from '@/contexts/CheckinSuccessContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';
import { parseQRCode, validateQRData, formatCheckinRequest } from '@/utils/qr-validator';

// NFC module - conditionally loaded to support Expo Go
let NfcManager: any = null;
let NfcTech: any = null;
let Ndef: any = null;

try {
  const NfcModule = require('react-native-nfc-manager');
  NfcManager = NfcModule.default;
  NfcTech = NfcModule.NfcTech;
  Ndef = NfcModule.Ndef;
} catch {
  console.log('NFC module not available (running in Expo Go)');
}

const SCAN_METHOD_KEY = '@checkin_scan_method';

type ScanState = 'idle' | 'scanning';
type ScanMethod = 'qr' | 'nfc';

export default function CheckInScreen() {
  const colors = useThemeColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { showSuccess, showNoClasses, showError } = useCheckinResult();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanned, setScanned] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);
  const hasHandledDirectCheckin = useRef(false);
  const isProcessingRef = useRef(false);

  // NFC state
  const [scanMethod, setScanMethod] = useState<ScanMethod>('qr');
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [methodLoaded, setMethodLoaded] = useState(false);

  // Route params for direct check-in (from deep link)
  const { location, code, direct } = useLocalSearchParams<{
    location?: string;
    code?: string;
    direct?: string;
  }>();
  const isDirectMode = direct === 'true' && !!location;

  // Load saved scan method and check NFC support on mount
  useEffect(() => {
    const initialize = async () => {
      // Check NFC support
      if (NfcManager) {
        try {
          const supported = await NfcManager.isSupported();
          setNfcSupported(supported);

          if (supported) {
            await NfcManager.start();

            // Load saved method only if NFC is supported
            const savedMethod = await AsyncStorage.getItem(SCAN_METHOD_KEY);
            if (savedMethod === 'nfc') {
              setScanMethod('nfc');
            }
          }
        } catch (err) {
          console.log('NFC setup error:', err);
          setNfcSupported(false);
        }
      } else {
        setNfcSupported(false);
      }
      setMethodLoaded(true);
    };

    initialize();

    return () => {
      NfcManager?.cancelTechnologyRequest?.().catch(() => {});
    };
  }, []);

  // Start NFC scan when method changes to NFC (after initial load)
  useEffect(() => {
    if (methodLoaded && scanMethod === 'nfc' && nfcSupported && !isNfcScanning) {
      startNfcScan();
    }
  }, [scanMethod, methodLoaded]);

  // Save scan method preference
  const saveScanMethod = async (method: ScanMethod) => {
    try {
      await AsyncStorage.setItem(SCAN_METHOD_KEY, method);
    } catch (err) {
      console.log('Error saving scan method:', err);
    }
  };

  const handleClose = () => {
    NfcManager?.cancelTechnologyRequest?.().catch(() => {});
    router.back();
  };

  const switchToQr = () => {
    NfcManager?.cancelTechnologyRequest?.().catch(() => {});
    setIsNfcScanning(false);
    setScanMethod('qr');
    saveScanMethod('qr');
    setScanned(false);
    isProcessingRef.current = false;
  };

  const switchToNfc = () => {
    setScanMethod('nfc');
    saveScanMethod('nfc');
    startNfcScan();
  };

  const startNfcScan = async () => {
    if (isProcessingRef.current || !NfcManager) return;

    try {
      setIsNfcScanning(true);

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
          isProcessingRef.current = true;
          await processScannedData(url);
        } else {
          // Invalid NFC data - keep scanning
          setIsNfcScanning(false);
          NfcManager.cancelTechnologyRequest().catch(() => {});
          // Restart scan after brief delay
          setTimeout(() => {
            if (scanMethod === 'nfc') startNfcScan();
          }, 500);
        }
      }
    } catch (ex: any) {
      // User cancelled or error
      console.log('NFC Error:', ex);
      setIsNfcScanning(false);

      // If user cancelled (dismissed the sheet), switch back to QR
      if (ex?.message?.includes('cancelled') || ex?.code === 'NfcUserCancelled') {
        switchToQr();
      }
    } finally {
      NfcManager?.cancelTechnologyRequest?.().catch(() => {});
    }
  };

  const cancelNfcScan = () => {
    NfcManager?.cancelTechnologyRequest?.().catch(() => {});
    setIsNfcScanning(false);
    switchToQr();
  };

  // Process scanned data (shared by QR and NFC)
  const processScannedData = async (data: string) => {
    setScanState('scanning');

    try {
      // Parse QR/NFC code
      const parseResult = parseQRCode(data);

      if (!parseResult.valid || !parseResult.data) {
        throw new Error(parseResult.error || t('checkin.invalidQRCode'));
      }

      // Validate QR data
      const validationResult = validateQRData(parseResult.data);

      if (!validationResult.valid) {
        throw new Error(validationResult.error || t('checkin.invalidQRCode'));
      }

      // Format request for API
      const checkinRequest = formatCheckinRequest(parseResult.data);

      // Call check-in API
      const response = await checkinApi.checkin(checkinRequest);
      console.log('[Checkin Screen] API response:', JSON.stringify(response, null, 2));

      // Handle API error (e.g., 429 rate limit, network error)
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && response.data.success) {
        // Success! Show drawer and navigate back to dashboard
        showSuccess(response.data.data);
        router.back();
      } else if (response.data && !response.data.success) {
        const responseData = response.data.data;

        // If there's an error field, show error with the API message
        if (responseData.error) {
          showError(responseData.message || t('checkin.checkInFailed'));
          router.back();
        } else {
          // No class available - show drawer and navigate back
          showNoClasses({
            venue: responseData.venue,
            alternatives: responseData.alternatives || [],
            upcomingHere: responseData.upcomingHere || [],
          });
          router.back();
        }
      } else {
        throw new Error(t('checkin.checkInFailed'));
      }
    } catch (error: any) {
      console.error('Check-in error:', error);

      // Map error messages
      let errorMsg = t('checkin.checkInFailed');

      if (error.message) {
        errorMsg = error.message;
      }

      if (error.response?.data?.error) {
        const apiError = error.response.data.error;

        switch (apiError) {
          case 'invalid_code':
            errorMsg = t('checkin.invalidQRCode');
            break;
          case 'already_checked_in':
            errorMsg = t('checkin.alreadyCheckedIn');
            break;
          case 'membership_inactive':
            errorMsg = t('checkin.membershipInactive');
            break;
          case 'no_classes_available':
          case 'no_class_scheduled':
            // Show friendly "no classes" drawer
            if (error.response.data.data) {
              showNoClasses(transformNoClassesData(error.response.data.data));
              router.back();
            }
            return;
          default:
            errorMsg = error.response.data.message || t('checkin.checkInFailed');
        }
      }

      // Show error drawer and navigate back
      showError(errorMsg);
      router.back();
    }
  };

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    // Use ref for immediate synchronous check to prevent multiple calls
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setScanned(true);
    await processScannedData(data);
  };

  // Request permissions on mount (only for camera mode)
  useEffect(() => {
    if (!isDirectMode && !permission?.granted) {
      requestPermission();
    }
  }, [permission, isDirectMode]);

  // Handle direct check-in from deep link
  useEffect(() => {
    if (!isDirectMode || hasHandledDirectCheckin.current) return;
    hasHandledDirectCheckin.current = true;
    handleDirectCheckin();
  }, [isDirectMode]);

  const handleDirectCheckin = async () => {
    setScanState('scanning');

    try {
      // Call check-in API directly with location from deep link
      const response = await checkinApi.checkin({
        method: 'manual',
        locationId: location!,
        qrCode: code || undefined,
      });

      // Handle API error (e.g., 429 rate limit, network error)
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && response.data.success) {
        // Success! Show drawer and navigate back to dashboard
        showSuccess(response.data.data);
        router.back();
      } else if (response.data && !response.data.success) {
        const responseData = response.data.data;

        // If there's an error field, show error with the API message
        if (responseData.error) {
          showError(responseData.message || t('checkin.checkInFailed'));
          router.back();
        } else {
          // No class available - show drawer and navigate back
          showNoClasses({
            venue: responseData.venue,
            alternatives: responseData.alternatives || [],
            upcomingHere: responseData.upcomingHere || [],
          });
          router.back();
        }
      } else {
        throw new Error(t('checkin.checkInFailed'));
      }
    } catch (error: any) {
      console.error('Direct check-in error:', error);

      let errorMsg = t('checkin.checkInFailed');

      if (error.message) {
        errorMsg = error.message;
      }

      if (error.response?.data?.error) {
        const apiError = error.response.data.error;

        switch (apiError) {
          case 'invalid_code':
            errorMsg = t('checkin.invalidQRCode');
            break;
          case 'already_checked_in':
            errorMsg = t('checkin.alreadyCheckedIn');
            break;
          case 'membership_inactive':
            errorMsg = t('checkin.membershipInactive');
            break;
          case 'no_classes_available':
          case 'no_class_scheduled':
            // Show friendly "no classes" drawer
            if (error.response.data.data) {
              showNoClasses(transformNoClassesData(error.response.data.data));
              router.back();
            }
            return;
          default:
            errorMsg = error.response.data.message || t('checkin.checkInFailed');
        }
      }

      // Show error drawer and navigate back
      showError(errorMsg);
      router.back();
    }
  };

  // Render scan method toggle (iOS camera-style pills)
  const renderScanMethodToggle = () => {
    if (!nfcSupported) return null;

    return (
      <View style={styles.toggleContainer}>
        <View style={styles.togglePills}>
          <Pressable
            onPress={switchToQr}
            style={[
              styles.togglePill,
              scanMethod === 'qr' && { backgroundColor: 'rgba(255,255,255,0.3)' },
            ]}>
            <Icon
              name="QrCode"
              size={18}
              color="white"
              style={{ marginRight: 6, opacity: scanMethod === 'qr' ? 1 : 0.6 }}
            />
            <Text
              style={[
                styles.toggleText,
                {
                  opacity: scanMethod === 'qr' ? 1 : 0.6,
                  fontWeight: scanMethod === 'qr' ? '600' : '400',
                },
              ]}>
              {t('checkin.scanMethodQr')}
            </Text>
          </Pressable>
          <Pressable
            onPress={switchToNfc}
            style={[
              styles.togglePill,
              scanMethod === 'nfc' && { backgroundColor: 'rgba(255,255,255,0.3)' },
            ]}>
            <Icon
              name="Nfc"
              size={18}
              color="white"
              style={{ marginRight: 6, opacity: scanMethod === 'nfc' ? 1 : 0.6 }}
            />
            <Text
              style={[
                styles.toggleText,
                {
                  opacity: scanMethod === 'nfc' ? 1 : 0.6,
                  fontWeight: scanMethod === 'nfc' ? '600' : '400',
                },
              ]}>
              {t('checkin.scanMethodNfc')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // Render NFC Modal (for Android - iOS uses native sheet)
  const renderNfcModal = () => {
    if (Platform.OS !== 'android') return null;

    return (
      <Modal
        visible={isNfcScanning && scanMethod === 'nfc'}
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
                {t('checkin.nfcTitle')}
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 13,
                  textAlign: 'center',
                  marginBottom: 24,
                }}>
                {t('checkin.nfcSubtitle')}
              </Text>

              <Pressable
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
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Direct mode: Show loading UI without camera
  if (isDirectMode) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.directModeContainer]}>
          {/* Top bar */}
          <View style={[styles.directModeTopBar]}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Icon name="X" size={24} color={colors.text} />
            </Pressable>
            <ThemedText className="text-lg font-bold">{t('checkin.title')}</ThemedText>
            <View style={styles.closeButton} />
          </View>

          {/* Content */}
          <View style={styles.directModeContent}>
            <ActivityIndicator size="large" color={colors.highlight} />
            <ThemedText className="mt-6 text-center text-lg">{t('checkin.checkingIn')}</ThemedText>
            {location && (
              <ThemedText className="mt-2 text-center opacity-70">
                {t('checkin.location')}: {location}
              </ThemedText>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Loading state while checking NFC support and loading saved preference
  if (!methodLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.highlight} />
      </View>
    );
  }

  // Camera mode: Permission not granted yet (only for QR mode)
  if (scanMethod === 'qr' && !permission) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.highlight} />
        <ThemedText className="mt-4">{t('checkin.requestingPermission')}</ThemedText>
      </View>
    );
  }

  // Camera mode: Permission denied (only for QR mode)
  if (scanMethod === 'qr' && !permission?.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Icon name="Camera" size={64} color={colors.text} className="mb-8" />
        <ThemedText className="mb-4 text-center text-2xl font-bold">
          {t('checkin.permissionRequired')}
        </ThemedText>
        <ThemedText className="mb-8 text-center opacity-70">
          {t('checkin.permissionMessage')}
        </ThemedText>
        <Pressable onPress={requestPermission} className="rounded-full bg-highlight px-8 py-4">
          <Text className="text-lg font-bold text-white">{t('checkin.grantPermission')}</Text>
        </Pressable>
        <Pressable onPress={handleClose} className="mt-4 px-8 py-4">
          <ThemedText className="text-center">{t('checkin.goBack')}</ThemedText>
        </Pressable>
        {/* Show NFC option if camera is denied but NFC is supported */}
        {nfcSupported && (
          <Pressable onPress={switchToNfc} className="mt-6 px-8 py-4">
            <View className="flex-row items-center">
              <Icon name="Nfc" size={20} color={colors.highlight} style={{ marginRight: 8 }} />
              <ThemedText style={{ color: colors.highlight }}>
                {t('checkin.scanMethodNfc')}
              </ThemedText>
            </View>
          </Pressable>
        )}
      </View>
    );
  }

  // NFC mode: Show NFC scanning UI
  if (scanMethod === 'nfc') {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Top bar */}
        <View style={[styles.topBar, { backgroundColor: colors.bg }]}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Icon name="X" size={24} color={colors.text} />
          </Pressable>
          <ThemedText className="text-lg font-bold">{t('checkin.nfcTitle')}</ThemedText>
          <View style={styles.closeButton} />
        </View>

        {/* NFC scanning UI */}
        <View style={styles.nfcContent}>
          <AnimatedView animation="pulse" duration={2000} iterationCount="infinite">
            <View
              style={[
                styles.nfcIconContainer,
                { backgroundColor: colors.primary + '20', borderColor: colors.primary },
              ]}>
              <Icon name="Nfc" size={64} strokeWidth={1.5} color={colors.primary} />
            </View>
          </AnimatedView>

          <ThemedText className="mb-2 mt-8 text-center text-xl font-semibold">
            {t('checkin.nfcScanning')}
          </ThemedText>
          <ThemedText className="text-center opacity-70">{t('checkin.nfcSubtitle')}</ThemedText>

          {scanState === 'scanning' && (
            <View className="mt-8">
              <ActivityIndicator size="large" color={colors.highlight} />
              <ThemedText className="mt-4 text-center">{t('checkin.checkingIn')}</ThemedText>
            </View>
          )}
        </View>

        {/* Toggle at bottom */}
        <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 20 }]}>
          {renderScanMethodToggle()}
        </View>

        {/* Android NFC Modal */}
        {renderNfcModal()}
      </View>
    );
  }

  // QR Code mode: Show camera scanner
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        enableTorch={enableTorch}
      />

      {/* Overlay - Positioned absolutely on top of camera */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={[styles.topBar, { backgroundColor: colors.bg }]}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Icon name="X" size={24} color={colors.text} />
          </Pressable>
          <ThemedText className="text-lg font-bold">{t('checkin.title')}</ThemedText>
          <Pressable onPress={() => setEnableTorch(!enableTorch)} style={styles.torchButton}>
            <Icon
              name={enableTorch ? 'Flashlight' : 'FlashlightOff'}
              size={24}
              color={enableTorch ? colors.highlight : colors.text}
            />
          </Pressable>
        </View>

        {/* Scanning area */}
        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            {/* Corners */}
            <View style={[styles.corner, styles.topLeft, { borderColor: colors.highlight }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: colors.highlight }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.highlight }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.highlight }]} />

            {/* Instructions */}
            {scanState === 'idle' && (
              <View style={styles.instructions}>
                <ThemedText className="text-center text-lg text-white">
                  {t('checkin.pointCameraAtQR')}
                </ThemedText>
              </View>
            )}

            {/* Loading */}
            {scanState === 'scanning' && (
              <View style={styles.instructions}>
                <ActivityIndicator size="large" color="#fff" />
                <ThemedText className="mt-4 text-center text-white">
                  {t('checkin.checkingIn')}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Bottom area with instructions and toggle */}
        <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 20 }]}>
          <ThemedText className="mb-4 text-center opacity-70">
            {t('checkin.alignQRCode')}
          </ThemedText>
          {renderScanMethodToggle()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  closeButton: {
    padding: 8,
    width: 40,
  },
  torchButton: {
    padding: 8,
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 20,
  },
  instructions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  directModeContainer: {
    flex: 1,
  },
  directModeTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  directModeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  // Toggle styles
  toggleContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  togglePills: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    padding: 4,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 21,
  },
  toggleText: {
    color: 'white',
    fontSize: 15,
  },
  // NFC mode styles
  nfcContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  nfcIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});
