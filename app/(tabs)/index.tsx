import React, { useState } from 'react';
import { View, Pressable, RefreshControl, useWindowDimensions } from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';

import { confirmAttendance, denyAttendance, ChildWithClasses } from '@/api/classes';
import { getStatusTranslationKey, Membership } from '@/api/membership';
import { isSepaAvailable, PaymentMethod } from '@/api/payment-methods';
import Avatar from '@/components/Avatar';
import ClassCard from '@/components/ClassCard';
import Header, { HeaderIcon } from '@/components/Header';
import Icon from '@/components/Icon';
import Section from '@/components/Section';
import SepaForm from '@/components/SepaForm';
import { SmallChartCard } from '@/components/SmallChartCard';
import { SmallCircleCard } from '@/components/SmallCircleCard';
import { SmallProgressBarCard } from '@/components/SmallProgressBarCard';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/DashboardReadyContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function HomeScreen() {
  const t = useT();
  const colors = useThemeColors();
  const { user, isMember } = useAuth();
  const {
    classes,
    childrenWithClasses,
    classesError,
    membership,
    paymentMethods,
    availablePaymentMethods,
    refreshData,
    setClasses,
    setPaymentMethods,
  } = useAppData();
  const [refreshing, setRefreshing] = useState(false);

  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Show SEPA form if no payment methods exist and SEPA is available
  const showSepaForm = paymentMethods.length === 0 && isSepaAvailable(availablePaymentMethods);

  const handleSepaSuccess = (newPaymentMethod: PaymentMethod) => {
    setPaymentMethods((prev) => [...prev, newPaymentMethod]);
  };

  const handleConfirm = async (classId: string, childId?: string) => {
    try {
      await confirmAttendance(classId, childId ? { childId } : undefined);
      // Update local state
      setClasses((prev) =>
        prev.map((cls) => (cls.id === classId ? { ...cls, status: 'confirmed' as const } : cls))
      );
    } catch (error) {
      console.error('Error confirming attendance:', error);
    }
  };

  const handleDeny = async (classId: string, childId?: string) => {
    try {
      await denyAttendance(classId, childId ? { childId } : undefined);
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
      await refreshData();
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
          <MembershipOverview membership={membership} />
        </View>
        {showSepaForm && (
          <View className="bg-background p-5">
            <SepaForm onSuccess={handleSepaSuccess} />
          </View>
        )}
        {/* Only show activity stats for members */}
        {isMember && (
          <View className="bg-background p-5">
            <ActivityStats />
          </View>
        )}
        {/* Only show user's classes section if they have classes or there's an error */}
        {(classes.length > 0 || classesError) && (
          <View className="bg-background px-5 pb-5">
            <Section title={t('home.upcomingClasses')} className="mb-4" />
            {classesError ? (
              <View className="items-center justify-center rounded-2xl bg-secondary py-12">
                <View
                  className="mb-4 h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.error + '20' }}>
                  <Icon name="AlertCircle" size={32} color={colors.error} />
                </View>
                <ThemedText className="mb-2 text-center font-semibold">
                  {t('home.unableToLoadClasses')}
                </ThemedText>
                <ThemedText className="mb-6 text-center text-sm opacity-70">
                  {classesError}
                </ThemedText>
                <Pressable
                  onPress={refreshData}
                  className="rounded-full px-6 py-3"
                  style={{ backgroundColor: colors.highlight }}>
                  <View className="flex-row items-center">
                    <Icon name="RefreshCw" size={16} color="#FFFFFF" />
                    <ThemedText className="ml-2 font-semibold" style={{ color: '#FFFFFF' }}>
                      {t('common.tryAgain')}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            ) : (
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
            )}
          </View>
        )}

        {/* Children's Classes Section with Tabs */}
        {childrenWithClasses.length > 0 && (
          <ChildrenClassesTabs
            children={childrenWithClasses}
            onConfirm={handleConfirm}
            onDeny={handleDeny}
          />
        )}
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

interface MembershipOverviewProps {
  membership: Membership | null;
}

const MembershipOverview = ({ membership }: MembershipOverviewProps) => {
  const t = useT();

  // Format the next billing date
  const formatNextBilling = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get the year from starts_at
  const getMemberSinceYear = (dateString: string) => {
    return new Date(dateString).getFullYear().toString();
  };

  // Get status translation key
  const getStatusLabel = (status: string) => {
    const key = getStatusTranslationKey(status as Membership['status']);
    return t(`membership.${key}`);
  };

  if (!membership) {
    return null;
  }

  return (
    <View className="dark:bg-dark-secondary mb-6 rounded-xl bg-secondary pt-14">
      <View className="mb-12 items-center">
        <View className="relative h-32 w-32 items-center justify-center rounded-full bg-background">
          <View className="items-center">
            <ThemedText className="text-3xl font-bold">{membership.plan.name}</ThemedText>
            <ThemedText className="text-sm opacity-50">
              {getStatusLabel(membership.status)}
            </ThemedText>
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
            <ThemedText className="text-lg font-bold">
              {formatNextBilling(membership.chargeStartsAt)}
            </ThemedText>
          </View>
        </View>
        <View className="items-center">
          <ThemedText className="text-light-subtext dark:text-dark-subtext text-sm">
            {t('home.memberSince')}
          </ThemedText>
          <View className="flex-row items-center">
            <Icon name="Award" size={14} className="mr-2" />
            <ThemedText className="text-lg font-bold">
              {getMemberSinceYear(membership.startsAt)}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
};

interface ChildrenClassesTabsProps {
  children: ChildWithClasses[];
  onConfirm: (classId: string, childId?: string) => Promise<void>;
  onDeny: (classId: string, childId?: string) => Promise<void>;
}

interface ChildClassesScrollProps {
  child: ChildWithClasses;
  onConfirm: (classId: string, childId?: string) => Promise<void>;
  onDeny: (classId: string, childId?: string) => Promise<void>;
}

const ChildClassesScroll = ({ child, onConfirm, onDeny }: ChildClassesScrollProps) => {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40; // Full width minus padding (20 on each side)

  return (
    <GHScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={cardWidth + 12}
      snapToAlignment="start"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
      {child.classes.slice(0, 3).map((classItem) => (
        <View key={classItem.id} style={{ width: cardWidth }}>
          <ClassCard
            classData={classItem}
            childId={child.id}
            onConfirm={onConfirm}
            onDeny={onDeny}
          />
        </View>
      ))}
      <View style={{ width: 8 }} />
    </GHScrollView>
  );
};

const ChildrenClassesTabs = ({ children, onConfirm, onDeny }: ChildrenClassesTabsProps) => {
  const t = useT();

  // Filter children with classes
  const childrenWithClassesFiltered = children.filter((child) => child.classes.length > 0);

  if (childrenWithClassesFiltered.length === 0) {
    return null;
  }

  return (
    <>
      {childrenWithClassesFiltered.map((child) => (
        <View key={child.id} className="bg-background pb-5">
          {/* Child header with avatar and name */}
          <View className="mb-4 flex-row items-center px-5">
            <Avatar name={child.fullName} size="sm" />
            <Section title={t('home.childClasses', { name: child.firstName })} className="ml-3" />
          </View>

          {/* Child's classes in horizontal scroll */}
          <ChildClassesScroll child={child} onConfirm={onConfirm} onDeny={onDeny} />
        </View>
      ))}
    </>
  );
};
