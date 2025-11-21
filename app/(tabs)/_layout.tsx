import { useThemeColors } from '@/contexts/ThemeColors';
import { TabButton } from '@/components/TabButton';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { View } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CheckInButton from '@/components/CheckInButton';

export default function TabsLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={{
          alignItems: 'center',
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
        }}>
        {/* Dashboard Tab */}
        <TabTrigger name="index" href="/" asChild>
          <TabButton labelAnimated={true} icon="Home">
            Dashboard
          </TabButton>
        </TabTrigger>

        {/* Check-in Button (middle) */}
        <View className="w-1/5 items-center justify-center">
          <CheckInButton />
        </View>

        {/* Settings Tab */}
        <TabTrigger name="settings" href="/settings" asChild>
          <TabButton labelAnimated={true} icon="Settings">
            Settings
          </TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
