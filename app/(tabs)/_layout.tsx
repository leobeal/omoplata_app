import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CheckInButton from '@/components/CheckInButton';
import { TabButton } from '@/components/TabButton';
import { defaultNavigation, NavigationConfig as FullNavigationConfig } from '@/configs/navigation';
import { useAppConfig, useFeatureFlags } from '@/contexts/AppConfigContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function TabsLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();

  // Use config from context (already loaded before app shows)
  const { config } = useAppConfig();
  const featureFlags = useFeatureFlags();

  // Get navigation config with priority:
  // 1. API config specifies which tabs to show (if loaded)
  // 2. All default tabs (fallback)
  const navConfig: FullNavigationConfig = useMemo(() => {
    if (!config?.navigation) {
      // No API config, use all default tabs
      return defaultNavigation;
    }

    // Filter default tabs based on API response (which only contains tab names)
    const filteredTabs = defaultNavigation.tabs.filter((tab) =>
      config.navigation.tabs.includes(tab.name)
    );

    return {
      tabs: filteredTabs,
      showCheckInButton: featureFlags.checkInEnabled,
    };
  }, [config, featureFlags]);

  const tabs = navConfig.tabs || [];
  const showCheckInButton = featureFlags.checkInEnabled;

  // Calculate tab width based on number of tabs
  const hasCheckIn = showCheckInButton;
  const totalTabs = tabs.length + (hasCheckIn ? 1 : 0);
  const tabWidth = totalTabs > 0 ? `${100 / totalTabs}%` : '33.33%';

  // Insert check-in button in the middle if enabled
  const renderTabs = () => {
    if (!hasCheckIn) {
      // No check-in button, render all tabs
      return tabs.map((tab) => (
        <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
          <TabButton labelAnimated icon={tab.icon}>
            {t(tab.label)}
          </TabButton>
        </TabTrigger>
      ));
    }

    // With check-in button, split tabs around it
    const midPoint = Math.floor(tabs.length / 2);
    const leftTabs = tabs.slice(0, midPoint);
    const rightTabs = tabs.slice(midPoint);

    return (
      <>
        {leftTabs.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton labelAnimated icon={tab.icon}>
              {t(tab.label)}
            </TabButton>
          </TabTrigger>
        ))}

        {/* Check-in Button (middle) */}
        <View style={{ width: tabWidth }} className="items-center justify-center">
          <CheckInButton />
        </View>

        {rightTabs.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton labelAnimated icon={tab.icon}>
              {t(tab.label)}
            </TabButton>
          </TabTrigger>
        ))}
      </>
    );
  };

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
        {renderTabs()}
      </TabList>
    </Tabs>
  );
}
