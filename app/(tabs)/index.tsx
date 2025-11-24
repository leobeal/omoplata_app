import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Pressable, RefreshControl } from 'react-native';

import { getUpcomingClasses, confirmAttendance, denyAttendance, Class } from '@/api/classes';
import Avatar from '@/components/Avatar';
import ClassCard from '@/components/ClassCard';
import Header, { HeaderIcon } from '@/components/Header';
import Icon from '@/components/Icon';
import Section from '@/components/Section';
import { SmallChartCard } from '@/components/SmallChartCard';
import { SmallCircleCard } from '@/components/SmallCircleCard';
import { SmallProgressBarCard } from '@/components/SmallProgressBarCard';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function HomeScreen() {
  const t = useT();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      setClassesError(null);
      const data = await getUpcomingClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load classes. Please check your connection and try again.';
      setClassesError(errorMessage);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleConfirm = async (classId: string) => {
    try {
      await confirmAttendance(classId);
      // Update local state
      setClasses((prev) =>
        prev.map((cls) => (cls.id === classId ? { ...cls, status: 'confirmed' as const } : cls))
      );
    } catch (error) {
      console.error('Error confirming attendance:', error);
    }
  };

  const handleDeny = async (classId: string) => {
    try {
      await denyAttendance(classId);
      // Update local state
      setClasses((prev) =>
        prev.map((cls) => (cls.id === classId ? { ...cls, status: 'denied' as const } : cls))
      );
    } catch (error) {
      console.error('Error denying attendance:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadClasses();
      // TODO: Reload other data like analytics, membership info, etc.
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <Header
        className="bg-secondary"
        leftComponent={
          <Avatar name={userName} size="sm" link="/settings" src={user?.profilePicture} />
        }
        rightComponents={[<HeaderIcon icon="Bell" hasBadge href="/screens/notifications" />]}
      />
      <ThemedScroller
        className="flex-1 bg-background !px-0"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF', colors.highlight]}
            progressBackgroundColor={colors.bg}
          />
        }>
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
        <View className="bg-background px-5 pb-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Section title="Upcoming Classes" className="flex-1" />
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => router.push('/screens/calendar')}>
                <View className="flex-row items-center">
                  <Icon name="Calendar" size={20} color={colors.highlight} />
                  <ThemedText className="ml-1 text-sm font-semibold text-highlight">
                    Calendar
                  </ThemedText>
                </View>
              </Pressable>
              {classes.length > 3 && (
                <Pressable onPress={() => router.push('/screens/next-classes')}>
                  <View className="flex-row items-center">
                    <ThemedText className="mr-1 text-sm font-semibold text-highlight">
                      View All
                    </ThemedText>
                    <Icon name="ChevronRight" size={16} color={colors.highlight} />
                  </View>
                </Pressable>
              )}
            </View>
          </View>
          {loadingClasses ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" testID="activity-indicator" />
            </View>
          ) : classesError ? (
            <View className="items-center justify-center rounded-2xl bg-secondary py-12">
              <View
                className="mb-4 h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.error + '20' }}>
                <Icon name="AlertCircle" size={32} color={colors.error} />
              </View>
              <ThemedText className="mb-2 text-center font-semibold">
                Unable to load classes
              </ThemedText>
              <ThemedText className="mb-6 text-center text-sm opacity-70">
                {classesError}
              </ThemedText>
              <Pressable
                onPress={loadClasses}
                className="rounded-full px-6 py-3"
                style={{ backgroundColor: colors.highlight }}>
                <View className="flex-row items-center">
                  <Icon name="RefreshCw" size={16} color="#FFFFFF" />
                  <ThemedText className="ml-2 font-semibold" style={{ color: '#FFFFFF' }}>
                    Try Again
                  </ThemedText>
                </View>
              </Pressable>
            </View>
          ) : classes.length > 0 ? (
            classes
              .slice(0, 3)
              .map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classData={classItem}
                  onConfirm={handleConfirm}
                  onDeny={handleDeny}
                />
              ))
          ) : (
            <View className="items-center justify-center rounded-2xl bg-secondary py-12">
              <Icon name="Calendar" size={48} className="mb-4 opacity-30" />
              <ThemedText className="text-center opacity-70">
                No upcoming classes scheduled
              </ThemedText>
            </View>
          )}
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
