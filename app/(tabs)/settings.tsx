import { View } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Avatar from '@/components/Avatar';
import ListLink from '@/components/ListLink';
import ThemedScroller from '@/components/ThemedScroller';
import React from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { useT } from '@/contexts/LocalizationContext';

export default function SettingsScreen() {
  const t = useT();

  return (
    <>
      <Header title={t('settings.title')} rightComponents={[<ThemeToggle />]} />
      <ThemedScroller className="px-6 pt-4">
        <View className="mb-4 w-full flex-row rounded-2xl bg-secondary pb-10 pt-10">
          <View className="w-1/2 flex-col items-center">
            <Avatar name="John Doe" size="xl" />
            <View className="mt-4 flex-1 items-center">
              <ThemedText className="text-2xl font-bold">John Doe</ThemedText>
              <View className="flex flex-row items-center">
                <ThemedText className="text-light-subtext dark:text-dark-subtext text-sm">
                  johndoe@example.com
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
            href="/screens/login"
          />
        </View>
      </ThemedScroller>
    </>
  );
}
