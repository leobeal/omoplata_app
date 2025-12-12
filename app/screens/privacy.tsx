import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Switch, View } from 'react-native';

import { api } from '@/api/client';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

interface PrivacySetting {
  id: string;
  titleKey: string;
  descriptionKey: string;
  apiField: string;
}

const PRIVACY_SETTINGS: PrivacySetting[] = [
  {
    id: 'attendance_public',
    titleKey: 'privacy.attendancePublic',
    descriptionKey: 'privacy.attendancePublicDescription',
    apiField: 'attendance_public',
  },
  {
    id: 'show_in_leaderboard',
    titleKey: 'privacy.showInLeaderboard',
    descriptionKey: 'privacy.showInLeaderboardDescription',
    apiField: 'show_in_leaderboard',
  },
];

interface ProfileResponse {
  data: {
    attendance_public: boolean;
    show_in_leaderboard: boolean;
  };
}

export default function PrivacyScreen() {
  const t = useT();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, boolean>>({
    attendance_public: false,
    show_in_leaderboard: false,
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      if (!user?.prefixedId) {
        setLoading(false);
        return;
      }

      const response = await api.get<ProfileResponse>(`/users/${user.prefixedId}/profile`);

      if (response.data?.data) {
        setValues({
          attendance_public: response.data.data.attendance_public ?? false,
          show_in_leaderboard: response.data.data.show_in_leaderboard ?? false,
        });
      }

      setLoading(false);
    };

    fetchPrivacySettings();
  }, [user?.prefixedId]);

  const handleToggle = useCallback(
    async (setting: PrivacySetting, newValue: boolean) => {
      if (!user?.prefixedId) return;

      setUpdatingId(setting.id);

      // Optimistic update
      setValues((prev) => ({ ...prev, [setting.id]: newValue }));

      const response = await api.patch(`/users/${user.prefixedId}/profile`, {
        [setting.apiField]: newValue,
      });

      if (response.error) {
        // Revert on failure
        setValues((prev) => ({ ...prev, [setting.id]: !newValue }));
        console.error('Failed to update privacy setting:', response.error);
      }

      setUpdatingId(null);
    },
    [user?.prefixedId]
  );

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
          {PRIVACY_SETTINGS.map((setting, index) => (
            <View
              key={setting.id}
              className={`flex-row items-center justify-between px-5 py-4 ${
                index < PRIVACY_SETTINGS.length - 1 ? 'border-b border-border' : ''
              }`}>
              <View className="mr-4 flex-1">
                <ThemedText className="text-base font-medium">{t(setting.titleKey)}</ThemedText>
                <ThemedText className="mt-1 text-sm opacity-50">
                  {t(setting.descriptionKey)}
                </ThemedText>
              </View>
              <Switch
                value={values[setting.id]}
                onValueChange={(value) => handleToggle(setting, value)}
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
