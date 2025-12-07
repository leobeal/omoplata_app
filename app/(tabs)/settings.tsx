import React, { useState } from 'react';
import { View, Alert, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';

import Avatar from '@/components/Avatar';
import Header from '@/components/Header';
import ListLink from '@/components/ListLink';
import Section from '@/components/Section';
import ThemeToggle from '@/components/ThemeToggle';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/DashboardReadyContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function SettingsScreen() {
  const t = useT();
  const colors = useThemeColors();
  const {
    logout,
    user,
    children,
    childrenLoading,
    isViewingAsChild,
    switchToChild,
    switchBackToParent,
    parentUser,
  } = useAuth();
  const { membership } = useAppData();
  const [refreshing, setRefreshing] = useState(false);
  const [switchingChildId, setSwitchingChildId] = useState<string | null>(null);

  // Get user display name
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const userEmail = user?.email || '';

  const hasChildren = children.length > 0;

  const handleLogout = async () => {
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            // Don't navigate here - let AuthGate in _layout.tsx handle the redirect
            // This prevents race conditions where router.replace runs before
            // the auth state has fully propagated through React context
          } catch (error) {
            console.error('Failed to logout:', error);
            Alert.alert(t('common.error'), t('settings.logoutError'));
          }
        },
      },
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // TODO: Reload user profile or app config if needed
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setRefreshing(false);
    }
  };

  const handleSwitchToChild = async (childId: string) => {
    setSwitchingChildId(childId);
    try {
      const result = await switchToChild(childId);
      if (!result.success) {
        Alert.alert(t('common.error'), result.error || t('family.switchError'));
      }
    } finally {
      setSwitchingChildId(null);
    }
  };

  const handleSwitchBackToParent = async () => {
    const result = await switchBackToParent();
    if (!result.success) {
      Alert.alert(t('common.error'), result.error || t('family.switchBackError'));
    }
  };

  return (
    <>
      <Header title={t('settings.title')} rightComponents={[<ThemeToggle />]} />
      <ThemedScroller
        className="px-6 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF', colors.highlight]}
            progressBackgroundColor={colors.bg}
          />
        }>
        <View className="mb-4 w-full flex-row rounded-2xl bg-secondary pb-10 pt-10">
          <View className="w-1/2 flex-col items-center">
            <Avatar name={userName} size="xl" src={user?.profilePicture} />
            <View className="mt-4 flex-1 items-center">
              <ThemedText className="text-2xl font-bold">{userName}</ThemedText>
              <View className="flex flex-row items-center">
                <ThemedText className="text-light-subtext dark:text-dark-subtext text-sm">
                  {userEmail}
                </ThemedText>
              </View>
            </View>
          </View>
          {membership && (
            <View className="w-1/2 flex-col items-start border-l border-border pl-10">
              <View className="flex-1 flex-col justify-center">
                <ThemedText className="text-xl font-bold">{membership.plan.name}</ThemedText>
                <ThemedText className="font-xs opacity-50">{t('settings.currentPlan')}</ThemedText>
              </View>
              <View className="flex-1 flex-col justify-center">
                <ThemedText className="text-xl font-bold">-</ThemedText>
                <ThemedText className="font-xs opacity-50">
                  {t('settings.classesThisMonth')}
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Family Section - Show if parent has children */}
        {hasChildren && !isViewingAsChild && (
          <>
            <Section title={t('family.title')} className="mb-2 mt-6" />
            <View className="rounded-2xl bg-secondary">
              {childrenLoading ? (
                <View className="items-center justify-center py-6">
                  <ActivityIndicator size="small" color={colors.text} />
                </View>
              ) : (
                children.map((child, index) => (
                  <TouchableOpacity
                    key={child.id}
                    onPress={() => handleSwitchToChild(child.id)}
                    disabled={switchingChildId !== null}
                    className={`flex-row items-center px-5 py-4 ${
                      index < children.length - 1 ? 'border-b border-border' : ''
                    }`}>
                    <Avatar
                      name={child.fullName}
                      size="md"
                      src={child.profilePicture || undefined}
                    />
                    <View className="ml-3 flex-1">
                      <ThemedText className="text-base font-semibold">{child.fullName}</ThemedText>
                      <ThemedText className="text-sm opacity-50">
                        {t('family.tapToView')}
                      </ThemedText>
                    </View>
                    {switchingChildId === child.id ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <ThemedText className="text-sm text-highlight">{t('family.view')}</ThemedText>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}

        {/* Switch Back Section - Show when viewing as child */}
        {isViewingAsChild && parentUser && (
          <>
            <Section title={t('family.switchAccount')} className="mb-2 mt-6" />
            <View className="rounded-2xl bg-secondary">
              <TouchableOpacity
                onPress={handleSwitchBackToParent}
                className="flex-row items-center px-5 py-4">
                <Avatar
                  name={`${parentUser.firstName} ${parentUser.lastName}`}
                  size="md"
                  src={parentUser.profilePicture}
                />
                <View className="ml-3 flex-1">
                  <ThemedText className="text-base font-semibold">
                    {parentUser.firstName} {parentUser.lastName}
                  </ThemedText>
                  <ThemedText className="text-sm opacity-50">{t('family.switchBackTo')}</ThemedText>
                </View>
                <ThemedText className="text-sm text-highlight">{t('family.switch')}</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View className="mt-4 rounded-2xl bg-secondary">
          <ListLink
            className="px-5"
            hasBorder
            title={t('settings.editProfile')}
            description={t('settings.updatePersonalInfo')}
            icon="User"
            href="/screens/edit-profile"
          />
          <ListLink
            className="px-5"
            hasBorder
            title={t('settings.membership')}
            description={t('settings.manageSubscription')}
            icon="CreditCard"
            href="/membership"
          />
          <ListLink
            className="px-5"
            hasBorder
            title={t('settings.notifications')}
            description={t('settings.classRemindersAndUpdates')}
            icon="Bell"
            href="/screens/notifications"
          />
          <ListLink
            className="px-5"
            hasBorder
            title={t('settings.helpAndSupport')}
            description={t('settings.getHelp')}
            icon="HelpCircle"
            href="/screens/help"
          />
          <ListLink
            className="px-5"
            title={t('settings.logout')}
            description={t('settings.signOut')}
            icon="LogOut"
            onPress={handleLogout}
          />
        </View>
      </ThemedScroller>
    </>
  );
}
