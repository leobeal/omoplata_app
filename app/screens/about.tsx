import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import * as WebBrowser from 'expo-web-browser';
import React, { useState, useCallback } from 'react';
import { View, Image, Alert, Linking, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { clearConfigCache } from '@/api/app-config';
import Header from '@/components/Header';
import LargeTitle from '@/components/LargeTitle';
import ListLink from '@/components/ListLink';
import Section from '@/components/Section';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { useAppData } from '@/contexts/DashboardReadyContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useTenant } from '@/contexts/TenantContext';

const omoplataLogo = require('@/assets/_global/icon.png');
const PRIVACY_POLICY_URL = 'https://omoplata.de/datenschutz';
const INSTAGRAM_URL = 'https://instagram.com/omoplatadeutschland';

export default function AboutScreen() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const { refreshConfig } = useAppConfig();
  const { refreshData } = useAppData();
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [ratingApp, setRatingApp] = useState(false);
  const [openingInstagram, setOpeningInstagram] = useState(false);

  // Scroll state for collapsible title
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const LARGE_TITLE_HEIGHT = 44;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowHeaderTitle(offsetY > LARGE_TITLE_HEIGHT);
  }, []);

  const handleRateApp = async () => {
    setRatingApp(true);
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      } else {
        // Fallback to store URL
        const storeUrl = await StoreReview.storeUrl();
        if (storeUrl) {
          await Linking.openURL(storeUrl);
        }
      }
    } catch (error) {
      console.error('Error requesting review:', error);
      // Try fallback to store URL on error
      try {
        const storeUrl = await StoreReview.storeUrl();
        if (storeUrl) {
          await Linking.openURL(storeUrl);
        } else {
          Alert.alert(t('common.error'), t('settings.rateAppError'));
        }
      } catch {
        Alert.alert(t('common.error'), t('settings.rateAppError'));
      }
    } finally {
      setRatingApp(false);
    }
  };

  const handleOpenInstagram = async () => {
    setOpeningInstagram(true);
    try {
      await Linking.openURL(INSTAGRAM_URL);
    } catch (error) {
      console.error('Error opening Instagram:', error);
    } finally {
      setOpeningInstagram(false);
    }
  };

  const handleRefreshCache = async () => {
    setRefreshingCache(true);
    try {
      // Clear config cache and refresh all data
      await clearConfigCache();
      await Promise.all([refreshConfig(), refreshData()]);
      Alert.alert(t('settings.cacheRefreshed'), t('settings.cacheRefreshedMessage'));
    } catch (error) {
      console.error('Failed to refresh cache:', error);
      Alert.alert(t('common.error'), t('settings.cacheRefreshError'));
    } finally {
      setRefreshingCache(false);
    }
  };

  // Check if this is a tenant-specific build (not the main Omoplata app)
  const configuredTenant = Constants.expoConfig?.extra?.tenant;
  const isTenantBuild = !!configuredTenant;
  const appName = tenant?.name || configuredTenant || 'Omoplata';

  return (
    <View className="flex-1 bg-background">
      <Header title={showHeaderTitle ? t('about.title') : undefined} showBackButton />
      <ThemedScroller className="flex-1 px-6" onScroll={handleScroll} scrollEventThrottle={16}>
        <LargeTitle title={t('about.title')} className="pt-2" />

        {/* Logo and Powered By */}
        <View className="items-center py-8">
          <Image
            source={omoplataLogo}
            style={{ width: 100, height: 100, borderRadius: 20 }}
            resizeMode="contain"
          />
          {isTenantBuild && (
            <ThemedText className="mt-4 text-center text-sm opacity-60">
              {t('about.poweredBy', { appName })}
            </ThemedText>
          )}
        </View>

        {/* Links Section */}
        <View className="rounded-2xl bg-secondary">
          <ListLink
            className="px-5"
            hasBorder
            title={t('settings.rateApp')}
            description={t('settings.rateAppDescription')}
            icon="Star"
            onPress={handleRateApp}
            isLoading={ratingApp}
          />
          <ListLink
            className="px-5"
            hasBorder
            title={t('about.followInstagram')}
            description={t('about.followInstagramDescription')}
            icon="Instagram"
            onPress={handleOpenInstagram}
            isLoading={openingInstagram}
          />
          <ListLink
            className="px-5"
            hasBorder
            title={t('about.privacyPolicy')}
            description={t('about.privacyPolicyDescription')}
            icon="FileText"
            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          />
          <ListLink
            className="px-5"
            title={t('settings.refreshCache')}
            description={t('settings.refreshCacheDescription')}
            icon="RefreshCw"
            onPress={handleRefreshCache}
            isLoading={refreshingCache}
          />
        </View>

        {/* Version Info */}
        <Section title={t('settings.version')} titleSize="lg">
          <View className="rounded-2xl bg-secondary">
            <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
              <ThemedText className="opacity-70">{t('settings.appVersion')}</ThemedText>
              <ThemedText className="font-semibold">
                {Application.nativeApplicationVersion || Constants.expoConfig?.version || '1.0.0'}
              </ThemedText>
            </View>
            <View className="flex-row items-center justify-between px-5 py-4">
              <ThemedText className="opacity-70">{t('settings.buildNumber')}</ThemedText>
              <ThemedText className="font-semibold">
                {Application.nativeBuildVersion || '1'}
              </ThemedText>
            </View>
          </View>
        </Section>
      </ThemedScroller>
    </View>
  );
}
