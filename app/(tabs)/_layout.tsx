import { useThemeColors } from '@/contexts/ThemeColors';
import { TabButton } from '@/components/TabButton';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { View } from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CheckInButton from '@/components/CheckInButton';
import { useT } from '@/contexts/LocalizationContext';
import { defaultNavigation, NavigationConfig as FullNavigationConfig } from '@/configs/navigation';
import { getNavigationConfig, NavigationConfig as ApiNavigationConfig } from '@/api/app-config';

export default function TabsLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();

  const [apiConfig, setApiConfig] = useState<ApiNavigationConfig | null>(null);

  // Fetch navigation config from API on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getNavigationConfig();
        if (config) {
          console.log('Loaded navigation config from API');
          setApiConfig(config);
        }
      } catch (error) {
        console.error('Failed to load navigation config from API:', error);
        // Will fall back to local config
      }
    };

    loadConfig();
  }, []);

  // Get navigation config with priority:
  // 1. API config specifies which tabs to show (if loaded)
  // 2. All default tabs (fallback)
  const navConfig: FullNavigationConfig = useMemo(() => {
    if (!apiConfig) {
      // No API config, use all default tabs
      return defaultNavigation;
    }

    // Filter default tabs based on API response (which only contains tab names)
    const filteredTabs = defaultNavigation.tabs.filter((tab) =>
      apiConfig.tabs.includes(tab.name)
    );

    return {
      tabs: filteredTabs,
      showCheckInButton: apiConfig.showCheckInButton ?? true,
    };
  }, [apiConfig]);

  const tabs = navConfig.tabs || [];
  const showCheckInButton = navConfig.showCheckInButton ?? true;

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
          <TabButton labelAnimated={true} icon={tab.icon}>
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
            <TabButton labelAnimated={true} icon={tab.icon}>
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
            <TabButton labelAnimated={true} icon={tab.icon}>
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
