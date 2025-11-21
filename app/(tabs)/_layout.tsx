import { useThemeColors } from '@/contexts/ThemeColors';
import { TabButton } from '@/components/TabButton';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { View } from 'react-native';
import React, { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CheckInButton from '@/components/CheckInButton';
import { useT } from '@/contexts/LocalizationContext';
import Constants from 'expo-constants';
import { defaultNavigation, NavigationConfig } from '@/configs/navigation';

export default function TabsLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();

  // Get navigation config from tenant or use default
  const navConfig: NavigationConfig = useMemo(() => {
    const tenantNav = Constants.expoConfig?.extra?.navigation as NavigationConfig | undefined;
    return tenantNav || defaultNavigation;
  }, []);

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
