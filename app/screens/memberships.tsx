import React from 'react';
import { View, Pressable } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import Section from '@/components/Section';
import ListLink from '@/components/ListLink';
import { useT } from '@/contexts/LocalizationContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function MembershipScreen() {
  const t = useT();

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title={t('settings.membership')} />
      <ThemedScroller>
        {/* Current Plan Card */}
        <View className="mb-6 rounded-2xl bg-secondary p-6">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <ThemedText className="text-sm opacity-50">{t('settings.currentPlan')}</ThemedText>
              <ThemedText className="text-3xl font-bold">Premium</ThemedText>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-highlight">
              <Icon name="Award" size={32} color="white" />
            </View>
          </View>

          <View className="mb-4 border-t border-border pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <ThemedText className="opacity-70">{t('memberships.unlimitedGymAccess')}</ThemedText>
              <Icon name="Check" size={20} color="#10B981" />
            </View>
            <View className="mb-3 flex-row items-center justify-between">
              <ThemedText className="opacity-70">
                {t('memberships.unlimitedGroupClasses')}
              </ThemedText>
              <Icon name="Check" size={20} color="#10B981" />
            </View>
            <View className="mb-3 flex-row items-center justify-between">
              <ThemedText className="opacity-70">
                {t('memberships.personalTrainingSession')}
              </ThemedText>
              <Icon name="Check" size={20} color="#10B981" />
            </View>
            <View className="flex-row items-center justify-between">
              <ThemedText className="opacity-70">{t('memberships.premiumLocker')}</ThemedText>
              <Icon name="Check" size={20} color="#10B981" />
            </View>
          </View>
        </View>

        {/* Billing Information */}
        <Section title="Billing Information" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary">
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <View className="flex-row items-center">
              <Icon name="CreditCard" size={20} className="mr-3" />
              <View>
                <ThemedText className="font-semibold">Payment Method</ThemedText>
                <ThemedText className="text-sm opacity-50">•••• 4242</ThemedText>
              </View>
            </View>
            <Icon name="ChevronRight" size={20} className="opacity-30" />
          </View>

          <View className="flex-row items-center justify-between border-b border-border p-5">
            <View className="flex-row items-center">
              <Icon name="Calendar" size={20} className="mr-3" />
              <View>
                <ThemedText className="font-semibold">{t('home.nextBilling')}</ThemedText>
                <ThemedText className="text-sm opacity-50">December 25, 2024</ThemedText>
              </View>
            </View>
            <ThemedText className="text-lg font-bold">$79.99</ThemedText>
          </View>

          <View className="flex-row items-center justify-between p-5">
            <View className="flex-row items-center">
              <Icon name="RotateCcw" size={20} className="mr-3" />
              <View>
                <ThemedText className="font-semibold">Auto-Renew</ThemedText>
                <ThemedText className="text-sm opacity-50">Enabled</ThemedText>
              </View>
            </View>
            <View className="h-6 w-6 items-center justify-center rounded-full bg-green-500">
              <Icon name="Check" size={16} color="white" />
            </View>
          </View>
        </View>

        {/* Usage This Month */}
        <Section title="Usage This Month" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary">
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <View className="flex-row items-center">
              <Icon name="Dumbbell" size={20} className="mr-3" />
              <ThemedText className="font-semibold">{t('home.classes')}</ThemedText>
            </View>
            <ThemedText className="text-lg font-bold">24</ThemedText>
          </View>

          <View className="flex-row items-center justify-between border-b border-border p-5">
            <View className="flex-row items-center">
              <Icon name="QrCode" size={20} className="mr-3" />
              <ThemedText className="font-semibold">{t('home.checkins')}</ThemedText>
            </View>
            <ThemedText className="text-lg font-bold">18</ThemedText>
          </View>

          <View className="flex-row items-center justify-between p-5">
            <View className="flex-row items-center">
              <Icon name="Users" size={20} className="mr-3" />
              <ThemedText className="font-semibold">Guest Passes Used</ThemedText>
            </View>
            <ThemedText className="text-lg font-bold">2 / 5</ThemedText>
          </View>
        </View>

        {/* Upgrade Options */}
        <UpgradeBanner />

        {/* Actions */}
        <Section title="Manage Membership" className="mb-4 mt-6" />
        <View className="mb-6 rounded-2xl bg-secondary">
          <ListLink
            className="px-5"
            hasBorder
            title="View All Plans"
            description="Compare and switch plans"
            icon="List"
            href="/screens/plans"
            showChevron
          />
          <ListLink
            className="px-5"
            hasBorder
            title="Payment History"
            description="View past invoices"
            icon="Receipt"
            href="/screens/payment-history"
            showChevron
          />
          <ListLink
            className="px-5"
            hasBorder
            title="Pause Membership"
            description="Temporarily pause your plan"
            icon="Pause"
            href="/screens/pause-membership"
            showChevron
          />
          <ListLink
            className="px-5"
            title="Cancel Membership"
            description="We're sorry to see you go"
            icon="XCircle"
            href="/screens/cancel-membership"
            showChevron
          />
        </View>

        <View className="mb-8">
          <ThemedText className="text-center text-sm opacity-50">
            {t('home.memberSince')} 2023
          </ThemedText>
        </View>
      </ThemedScroller>
    </View>
  );
}

const UpgradeBanner = () => {
  const t = useT();

  return (
    <LinearGradient
      colors={['#6366F1', '#8B5CF6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 16, marginBottom: 24 }}>
      <Pressable className="flex-row items-center justify-between p-6">
        <View className="flex-1">
          <ThemedText className="text-xl font-bold text-white">Upgrade to Annual</ThemedText>
          <ThemedText className="mt-1 text-sm text-white opacity-90">
            Save 50% with annual billing
          </ThemedText>
        </View>
        <Button
          variant="outline"
          href="/screens/plans"
          rounded="xl"
          title="View Plans"
          textClassName="text-white"
          className="border-white"
        />
      </Pressable>
    </LinearGradient>
  );
};
