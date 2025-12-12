import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { View, Image, Linking } from 'react-native';

import Header from '@/components/Header';
import ListLink from '@/components/ListLink';
import Section from '@/components/Section';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useTenant } from '@/contexts/TenantContext';

const omoplataLogo = require('@/assets/_global/icon.png');
const PRIVACY_POLICY_URL = 'https://omoplata.de/datenschutz';

export default function AboutScreen() {
  const { t } = useTranslation();
  const { tenant } = useTenant();

  // Check if this is a tenant-specific build (not the main Omoplata app)
  const configuredTenant = Constants.expoConfig?.extra?.tenant;
  const isTenantBuild = !!configuredTenant;
  const appName = tenant?.name || configuredTenant || 'Omoplata';

  return (
    <View className="flex-1 bg-background">
      <Header title={t('about.title')} showBackButton />
      <ThemedScroller className="flex-1 px-6">
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
            title={t('about.privacyPolicy')}
            description={t('about.privacyPolicyDescription')}
            icon="FileText"
            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          />
          <ListLink
            className="px-5"
            title={t('about.versionHistory')}
            description={t('about.versionHistoryDescription')}
            icon="History"
            onPress={() => Linking.openURL('https://omoplata.com/changelog')}
          />
        </View>

        {/* Version Info */}
        <Section title={t('settings.version')} titleSize="lg">
          <View className="rounded-2xl bg-secondary">
            <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
              <ThemedText className="opacity-70">{t('settings.appVersion')}</ThemedText>
              <ThemedText className="font-semibold">
                {Constants.expoConfig?.version || '1.0.0'}
              </ThemedText>
            </View>
            <View className="flex-row items-center justify-between px-5 py-4">
              <ThemedText className="opacity-70">{t('settings.buildNumber')}</ThemedText>
              <ThemedText className="font-semibold">
                {Constants.expoConfig?.ios?.buildNumber ||
                  Constants.expoConfig?.android?.versionCode ||
                  '1'}
              </ThemedText>
            </View>
          </View>
        </Section>
      </ThemedScroller>
    </View>
  );
}
