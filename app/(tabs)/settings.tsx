import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Alert, RefreshControl } from 'react-native';

import Avatar from '@/components/Avatar';
import Header from '@/components/Header';
import ListLink from '@/components/ListLink';
import ThemeToggle from '@/components/ThemeToggle';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function SettingsScreen() {
  const t = useT();
  const colors = useThemeColors();
  const { logout, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Get user display name
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';
  const userEmail = user?.email || 'user@example.com';

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/screens/login');
          } catch (error) {
            console.error('Failed to logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
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
          <View className="w-1/2 flex-col items-start border-l border-border pl-10">
            <View className="flex-1 flex-col justify-center">
              <ThemedText className="text-xl font-bold">Premium</ThemedText>
              <ThemedText className="font-xs opacity-50">{t('settings.currentPlan')}</ThemedText>
            </View>
            <View className="flex-1 flex-col justify-center">
              <ThemedText className="text-xl font-bold">24</ThemedText>
              <ThemedText className="font-xs opacity-50">
                {t('settings.classesThisMonth')}
              </ThemedText>
            </View>
          </View>
        </View>

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
