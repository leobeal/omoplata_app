import { View, Pressable, Alert } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Avatar from '@/components/Avatar';
import ListLink from '@/components/ListLink';
import ThemedScroller from '@/components/ThemedScroller';
import React, { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { useT } from '@/contexts/LocalizationContext';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import Icon from '@/components/Icon';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function SettingsScreen() {
  const t = useT();
  const colors = useThemeColors();
  const { tenant, clearTenant: clearTenantContext, isTenantRequired } = useTenant();
  const { logout, user } = useAuth();
  const [isClearing, setIsClearing] = useState(false);
  const isDevelopment = Constants.expoConfig?.extra?.env === 'development' || __DEV__;

  // Get user display name
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';
  const userEmail = user?.email || 'user@example.com';

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
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
      ]
    );
  };

  const handleClearTenant = async () => {
    Alert.alert(
      'Clear Tenant Cache',
      'This will clear the cached tenant and redirect you to the tenant selection screen. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              await clearTenantContext();
              // Redirect to tenant selection
              router.replace('/screens/tenant-selection');
            } catch (error) {
              console.error('Failed to clear tenant:', error);
              Alert.alert('Error', 'Failed to clear tenant cache');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Header title={t('settings.title')} rightComponents={[<ThemeToggle />]} />
      <ThemedScroller className="px-6 pt-4">
        <View className="mb-4 w-full flex-row rounded-2xl bg-secondary pb-10 pt-10">
          <View className="w-1/2 flex-col items-center">
            <Avatar name={userName} size="xl" src={user?.avatar} />
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

        {/* Debug Section - Only in Development Mode */}
        {isDevelopment && isTenantRequired && tenant && (
          <View className="mt-4 rounded-2xl bg-secondary p-4">
            <View className="mb-3 flex-row items-center">
              <Icon name="Code" size={16} color={colors.textMuted} />
              <ThemedText className="ml-2 text-sm font-semibold opacity-70">
                Debug Tools
              </ThemedText>
            </View>
            <View className="rounded-xl p-3" style={{ backgroundColor: colors.background }}>
              <ThemedText className="text-xs opacity-70 mb-2">
                Current Tenant: <ThemedText className="font-semibold">{tenant.slug}</ThemedText>
              </ThemedText>
              <Pressable
                onPress={handleClearTenant}
                disabled={isClearing}
                className="mt-2 rounded-lg px-4 py-2"
                style={{ backgroundColor: colors.error + '20' }}>
                <View className="flex-row items-center justify-center">
                  <Icon name="Trash2" size={16} color={colors.error} />
                  <ThemedText className="ml-2 font-semibold" style={{ color: colors.error }}>
                    {isClearing ? 'Clearing...' : 'Clear Tenant Cache'}
                  </ThemedText>
                </View>
              </Pressable>
            </View>
          </View>
        )}
      </ThemedScroller>
    </>
  );
}
