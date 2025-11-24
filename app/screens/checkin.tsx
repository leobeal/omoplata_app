import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Animated } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeColors';
import { useT } from '@/contexts/LocalizationContext';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { checkinApi } from '@/api';
import { parseQRCode, validateQRData, formatCheckinRequest } from '@/utils/qr-validator';

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

export default function CheckInScreen() {
  const colors = useThemeColors();
  const t = useT();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [scanned, setScanned] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);

  // Animation values
  const [successOpacity] = useState(new Animated.Value(0));
  const [successScale] = useState(new Animated.Value(0.5));

  const handleClose = () => {
    router.back();
  };

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || scanState === 'scanning') return;

    setScanned(true);
    setScanState('scanning');
    setErrorMessage('');

    try {
      // Parse QR code
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

      if (response.data && response.data.success) {
        // Success!
        const greeting = response.data.data.greeting || t('checkin.welcomeBack', { name: '' });
        const streak = response.data.data.monthlyVisits;
        setSuccessMessage(`${greeting}\n\n${t('checkin.checkInNumber', { count: streak })}`);
        setScanState('success');

        // Animate success
        Animated.parallel([
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(successScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();

        // Auto-close after 2.5 seconds
        setTimeout(() => {
          router.back();
        }, 2500);
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
          default:
            errorMsg = error.response.data.message || t('checkin.checkInFailed');
        }
      }

      setErrorMessage(errorMsg);
      setScanState('error');

      // Allow retry after 3 seconds
      setTimeout(() => {
        setScanned(false);
        setScanState('idle');
        setErrorMessage('');
      }, 3000);
    }
  };

  // Request permissions on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Permission not granted yet
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.highlight} />
        <ThemedText className="mt-4">{t('checkin.requestingPermission')}</ThemedText>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View - No children */}
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
            <View
              style={[styles.corner, styles.bottomRight, { borderColor: colors.highlight }]}
            />

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

            {/* Error */}
            {scanState === 'error' && (
              <View style={styles.instructions}>
                <Icon name="XCircle" size={48} color="#EF4444" />
                <ThemedText className="mt-4 text-center text-white">{errorMessage}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Bottom instructions */}
        <View style={styles.bottomInstructions}>
          <ThemedText className="text-center opacity-70">
            {t('checkin.alignQRCode')}
          </ThemedText>
        </View>
      </View>

      {/* Success Overlay */}
      {scanState === 'success' && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: successOpacity,
            },
          ]}>
          <Animated.View
            style={[
              styles.successContent,
              {
                transform: [{ scale: successScale }],
              },
            ]}>
            <Icon name="CheckCircle" size={80} color="#10B981" />
            <Text className="mt-6 text-center text-2xl font-bold text-white">
              {t('checkin.checkInSuccess')}
            </Text>
            <Text className="mt-4 text-center text-lg text-white">{successMessage}</Text>
          </Animated.View>
        </Animated.View>
      )}
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
  bottomInstructions: {
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  successContent: {
    alignItems: 'center',
    padding: 40,
  },
});
