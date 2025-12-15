import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import ViewShot from 'react-native-view-shot';

import { getWalletPassData } from '@/api/wallet';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import LargeTitle from '@/components/LargeTitle';
import MembershipCard from '@/components/MembershipCard';
import ThemedScroller from '@/components/ThemedScroller';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/DashboardReadyContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useTenant } from '@/contexts/TenantContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function MembershipCardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { membership } = useAppData();
  const { tenant } = useTenant();
  const colors = useThemeColors();

  const [savingToPhotos, setSavingToPhotos] = useState(false);
  const [addingToWallet, setAddingToWallet] = useState(false);

  const cardRef = useRef<ViewShot>(null);

  // Scroll state for collapsible title
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const LARGE_TITLE_HEIGHT = 44;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowHeaderTitle(offsetY > LARGE_TITLE_HEIGHT);
  }, []);

  // Get wallet pass data
  const gymName = tenant?.name || 'Gym';
  const walletData = user ? getWalletPassData(user, membership || null, gymName) : null;

  const captureCard = async (): Promise<string | null> => {
    try {
      if (!cardRef.current?.capture) {
        console.error('ViewShot ref not available');
        return null;
      }
      const uri = await cardRef.current.capture();
      return uri;
    } catch (error) {
      console.error('Failed to capture card:', error);
      return null;
    }
  };

  const handleAddToWallet = async () => {
    setAddingToWallet(true);
    try {
      // For now, show coming soon message and save to photos as alternative
      Alert.alert(t('wallet.comingSoon'), t('wallet.comingSoonMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('wallet.saveToPhotos'),
          onPress: () => handleSaveToPhotos(),
        },
      ]);
    } finally {
      setAddingToWallet(false);
    }
  };

  const handleSaveToPhotos = async () => {
    setSavingToPhotos(true);
    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('wallet.permissionDenied'));
        return;
      }

      // Capture the card
      const uri = await captureCard();
      if (!uri) {
        Alert.alert(t('common.error'), t('wallet.saveFailed'));
        return;
      }

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert(t('common.success'), t('wallet.savedToPhotos'));
    } catch (error) {
      console.error('Failed to save to photos:', error);
      Alert.alert(t('common.error'), t('wallet.saveFailed'));
    } finally {
      setSavingToPhotos(false);
    }
  };

  const handleShare = async () => {
    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t('common.error'), t('wallet.sharingNotAvailable'));
        return;
      }

      // Capture the card
      const uri = await captureCard();
      if (!uri) {
        Alert.alert(t('common.error'), t('wallet.saveFailed'));
        return;
      }

      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('wallet.shareCard'),
      });
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert(t('common.error'), t('wallet.shareFailed'));
    }
  };

  const ShareButton = (
    <TouchableOpacity onPress={handleShare} hitSlop={8}>
      <Icon name="Share2" size={22} color={colors.text} />
    </TouchableOpacity>
  );

  if (!user || !walletData) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header
        title={showHeaderTitle ? t('wallet.membershipCard') : undefined}
        showBackButton
        rightComponents={[ShareButton]}
      />
      <ThemedScroller
        className="flex-1 px-6"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 40 }}>
        <LargeTitle title={t('wallet.membershipCard')} className="pt-2" />

        {/* Membership Card */}
        <View className="mb-6 items-center">
          <ViewShot ref={cardRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
            <MembershipCard data={walletData} showQR />
          </ViewShot>
        </View>

        {/* Add to Wallet Button */}
        <Button
          title={t('wallet.addToAppleWallet')}
          onPress={handleAddToWallet}
          loading={addingToWallet}
          variant="primary"
          size="large"
          icon="Wallet"
          className="mb-4"
        />

        {/* Save to Photos */}
        <Button
          title={t('wallet.saveToPhotos')}
          onPress={handleSaveToPhotos}
          loading={savingToPhotos}
          variant="secondary"
          size="medium"
        />
      </ThemedScroller>
    </View>
  );
}
