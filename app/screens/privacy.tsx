import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Switch, View } from 'react-native';

import { getPrivacySettings, PrivacySetting, updatePrivacySetting } from '@/api/privacy-settings';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function PrivacyScreen() {
  const t = useT();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PrivacySetting[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getPrivacySettings();
      setSettings(response.settings);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = useCallback(async (settingId: string, newValue: boolean) => {
    setUpdatingId(settingId);

    // Optimistic update
    setSettings((prev) => prev.map((s) => (s.id === settingId ? { ...s, enabled: newValue } : s)));

    const result = await updatePrivacySetting(settingId, newValue);

    if (!result.success) {
      // Revert on failure
      setSettings((prev) =>
        prev.map((s) => (s.id === settingId ? { ...s, enabled: !newValue } : s))
      );
    }

    setUpdatingId(null);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header title={t('privacy.title')} showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.highlight} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header title={t('privacy.title')} showBackButton />
      <ThemedScroller className="flex-1 px-6">
        <View className="mt-4 rounded-2xl bg-secondary">
          {settings.map((setting, index) => (
            <View
              key={setting.id}
              className={`flex-row items-center justify-between px-5 py-4 ${
                index < settings.length - 1 ? 'border-b border-border' : ''
              }`}>
              <View className="mr-4 flex-1">
                <ThemedText className="text-base font-medium">{setting.title}</ThemedText>
                <ThemedText className="mt-1 text-sm opacity-50">{setting.description}</ThemedText>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={(value) => handleToggle(setting.id, value)}
                disabled={updatingId === setting.id}
                trackColor={{ false: colors.border, true: colors.highlight }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>
      </ThemedScroller>
    </View>
  );
}
