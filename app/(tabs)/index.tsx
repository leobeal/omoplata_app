import React from 'react';
import { View } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemedScroller';
import { useThemeColors } from '@/contexts/ThemeColors';
import Icon from '@/components/Icon';
import Header, { HeaderIcon } from '@/components/Header';
import Section from '@/components/Section';
import { SmallChartCard } from '@/components/SmallChartCard';
import { SmallCircleCard } from '@/components/SmallCircleCard';
import { SmallProgressBarCard } from '@/components/SmallProgressBarCard';
import Avatar from '@/components/Avatar';
import { useT } from '@/contexts/LocalizationContext';

export default function HomeScreen() {
  const t = useT();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Header
        className="bg-secondary"
        leftComponent={<Avatar name="John Doe" size="sm" link="/settings" />}
        rightComponents={[<HeaderIcon icon="Bell" hasBadge href="/screens/notifications" />]}
      />
      <ThemedScroller className="flex-1 bg-background !px-0">
        <View className="bg-secondary px-6">
          <Section
            title={t('home.welcomeBack')}
            titleSize="4xl"
            subtitle={today}
            className="mb-8 mt-8"
          />
          <MembershipOverview />
        </View>
        <View className="bg-background p-5">
          <ActivityStats />
        </View>
      </ThemedScroller>
    </>
  );
}

const ActivityStats = () => {
  const t = useT();
  return (
    <>
      <View className="mb-6 w-full flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <SmallChartCard
            title={t('home.classes')}
            value="12"
            unit={t('home.thisMonth')}
            subtitle={t('home.lastSevenDays')}
            data={[2, 3, 1, 4, 2, 3, 4]}
            lineColor="#00A6F4"
          />
        </View>
        <View className="flex-1">
          <SmallChartCard
            title={t('home.checkins')}
            value="18"
            unit={t('home.thisMonth')}
            subtitle={t('home.thisWeek')}
            data={[3, 2, 4, 3, 5, 4, 6]}
            lineColor="#10b981"
          />
        </View>
      </View>
      <View className="mb-6 w-full flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <SmallCircleCard
            title={t('home.goalProgress')}
            subtitle={t('home.monthly')}
            percentage={75}
            value="15/20"
            unit={t('home.classes').toLowerCase()}
          />
        </View>
        <View className="flex-1">
          <SmallProgressBarCard
            title={t('home.weeklyActivity')}
            subtitle={t('home.pastThreeWeeks')}
            data={[{ percentage: 85 }, { percentage: 70 }, { percentage: 95 }]}
            barColor="#06b6d4"
            value="95%"
            unit={t('home.onTrack')}
          />
        </View>
      </View>
    </>
  );
};

const MembershipOverview = () => {
  const colors = useThemeColors();
  const t = useT();

  return (
    <View className="dark:bg-dark-secondary mb-6 rounded-xl bg-secondary pt-14">
      <View className="mb-12 items-center">
        <View className="relative h-32 w-32 items-center justify-center rounded-full bg-background">
          <View className="items-center">
            <ThemedText className="text-3xl font-bold">Premium</ThemedText>
            <ThemedText className="text-sm opacity-50">{t('home.activeMember')}</ThemedText>
          </View>
        </View>
      </View>

      <View className="items-center justify-center">
        <ThemedText className="text-lg font-bold">{t('home.membershipStatus')}</ThemedText>
      </View>

      <View className="mt-4 flex-row justify-between rounded-2xl border-t border-border px-6 pt-4">
        <View className="items-center">
          <ThemedText className="text-light-subtext dark:text-dark-subtext text-sm">
            {t('home.classesLeft')}
          </ThemedText>
          <View className="flex-row items-center">
            <Icon name="Calendar" size={14} className="mr-2" />
            <ThemedText className="text-lg font-bold">{t('home.unlimited')}</ThemedText>
          </View>
        </View>
        <View className="items-center">
          <ThemedText className="text-light-subtext dark:text-dark-subtext text-sm">
            {t('home.nextBilling')}
          </ThemedText>
          <View className="flex-row items-center">
            <Icon name="CreditCard" size={14} className="mr-2" />
            <ThemedText className="text-lg font-bold">Dec 25</ThemedText>
          </View>
        </View>
        <View className="items-center">
          <ThemedText className="text-light-subtext dark:text-dark-subtext text-sm">
            {t('home.memberSince')}
          </ThemedText>
          <View className="flex-row items-center">
            <Icon name="Award" size={14} className="mr-2" />
            <ThemedText className="text-lg font-bold">2023</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
};
