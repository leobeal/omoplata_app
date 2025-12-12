import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { View, Pressable, RefreshControl, useWindowDimensions, Alert } from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';

import { confirmAttendance, denyAttendance, ChildWithClasses } from '@/api/classes';
import { getGraduationsWithChildren, Graduation, ChildWithGraduations } from '@/api/graduations';
import { getStatusTranslationKey, Membership } from '@/api/membership';
import { isSepaAvailable, PaymentMethod } from '@/api/payment-methods';
import Avatar from '@/components/Avatar';
import ClassCard from '@/components/ClassCard';
import GraduationSection, { ChildrenGraduationsSection } from '@/components/GraduationSection';
import Header, { HeaderIcon } from '@/components/Header';
import Icon from '@/components/Icon';
import Section from '@/components/Section';
import SepaForm from '@/components/SepaForm';
import { SmallChartCard } from '@/components/SmallChartCard';
import { SmallCircleCard } from '@/components/SmallCircleCard';
import { SmallDonutCard } from '@/components/SmallDonutCard';
import { SmallProgressBarCard } from '@/components/SmallProgressBarCard';
import { SmallStreakCard } from '@/components/SmallStreakCard';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/DashboardReadyContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function HomeScreen() {
  const { t, locale } = useTranslation();
  const colors = useThemeColors();
  const { user, isMember } = useAuth();
  const {
    classes,
    childrenWithClasses,
    classesError,
    classesFromCache,
    membership,
    paymentMethods,
    availablePaymentMethods,
    refreshData,
    setClasses,
    setPaymentMethods,
  } = useAppData();
  const [refreshing, setRefreshing] = useState(false);
  const [graduations, setGraduations] = useState<Graduation[]>([]);
  const [childrenWithGraduations, setChildrenWithGraduations] = useState<ChildWithGraduations[]>(
    []
  );

  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';

  // Check if user has responsible role
  const isResponsible = user?.roles?.includes('responsible') ?? false;

  // Load graduations (including children's)
  useEffect(() => {
    const loadGraduations = async () => {
      try {
        const data = await getGraduationsWithChildren({
          includeChildren: isResponsible,
        });
        setGraduations(data.graduations);
        setChildrenWithGraduations(data.children || []);
      } catch (error) {
        console.error('Failed to load graduations:', error);
      }
    };
    if (isMember) {
      loadGraduations();
    }
  }, [isMember, isResponsible]);

  // Map locale to proper locale string for date formatting
  const dateLocale =
    locale === 'pt-BR' ? 'pt-BR' : locale === 'de' ? 'de-DE' : locale === 'tr' ? 'tr-TR' : 'en-US';
  const today = new Date().toLocaleDateString(dateLocale, {
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

  const handleConfirm = useCallback(
    async (classId: string, childId?: string) => {
      try {
        await confirmAttendance(classId, childId ? { childId } : undefined);
        // Update local state
        setClasses((prev) =>
          prev.map((cls) => (cls.id === classId ? { ...cls, status: 'confirmed' as const } : cls))
        );
      } catch {
        Alert.alert(t('common.error'), t('classCard.attendanceFailed'));
      }
    },
    [t, setClasses]
  );

  const handleDeny = useCallback(
    async (classId: string, childId?: string) => {
      try {
        await denyAttendance(classId, childId ? { childId } : undefined);
        // Update local state
        setClasses((prev) =>
          prev.map((cls) => (cls.id === classId ? { ...cls, status: 'denied' as const } : cls))
        );
      } catch {
        Alert.alert(t('common.error'), t('classCard.attendanceFailed'));
      }
    },
    [t, setClasses]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  return (
    <>
      <Header
        className="bg-secondary"
        leftComponent={<HeaderIcon icon="Bell" hasBadge href="/screens/notifications" />}
        rightComponents={[
          <Avatar name={userName} size="sm" link="/screens/settings" src={user?.profilePicture} />,
        ]}
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
        {/* Cached Data Banner */}
        {classesFromCache && (
          <View
            className="flex-row items-center justify-center px-4 py-2"
            style={{ backgroundColor: colors.warning + '20' }}>
            <Icon name="CloudOff" size={14} color={colors.warning} />
            <ThemedText className="ml-2 text-xs" style={{ color: colors.warning }}>
              {t('network.usingCachedData')}
            </ThemedText>
          </View>
        )}
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
        {/* Graduation Progress Section */}
        {isMember && graduations.length > 0 && <GraduationSection graduations={graduations} />}
        {/* Children's Graduation Progress Section */}
        {isMember && childrenWithGraduations.length > 0 && (
          <ChildrenGraduationsSection childrenWithGraduations={childrenWithGraduations} />
        )}
        {/* Only show user's classes section if they have classes or there's an error */}
        {(classes.length > 0 || classesError) && (
          <View className="bg-background px-5 pb-5">
            <Section title={t('home.upcomingClasses')} className="mb-2" />
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

const ActivityStats = memo(() => {
  const { t } = useTranslation();

  // Dummy data for courses attended by type
  const courseSegments = [
    { label: 'BJJ', value: 8, color: '#3b82f6' },
    { label: 'No-Gi', value: 5, color: '#8b5cf6' },
    { label: 'MMA', value: 3, color: '#ef4444' },
    { label: 'Wrestling', value: 2, color: '#f59e0b' },
  ];

  const totalClasses = courseSegments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <View className="mb-6">
      <View className="mb-4 flex-row items-stretch gap-4">
        <View className="flex-1">
          <SmallDonutCard
            title={t('home.classes')}
            animate
            subtitle={t('home.thisMonth')}
            segments={courseSegments}
            centerValue={totalClasses.toString()}
            centerLabel={t('home.total')}
            size={90}
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
      <View className="mb-4 flex-row items-stretch gap-4">
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
      <View className="flex-row items-stretch gap-4">
        <View className="flex-1">
          <SmallStreakCard
            title={t('home.streak')}
            subtitle={t('home.currentStreak')}
            streakWeeks={6}
            goalWeeks={12}
          />
        </View>
      </View>
    </View>
  );
});

interface MembershipOverviewProps {
  membership: Membership | null;
}

const MembershipOverview = memo(({ membership }: MembershipOverviewProps) => {
  const { t, locale } = useTranslation();

  // Map locale to proper locale string for date formatting
  const dateLocale =
    locale === 'pt-BR' ? 'pt-BR' : locale === 'de' ? 'de-DE' : locale === 'tr' ? 'tr-TR' : 'en-US';

  // Format the next billing date
  const formatNextBilling = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });
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

      <View className="mt-4 flex-row justify-between gap-4 rounded-2xl border-t border-border px-6 pt-4">
        <View className="flex-1 items-center">
          <ThemedText className="text-light-subtext dark:text-dark-subtext text-center text-sm">
            {t('home.classesLeft')}
          </ThemedText>
          <View className="flex-row items-center">
            <Icon name="Calendar" size={14} className="mr-2" />
            <ThemedText className="text-center text-lg font-bold">{t('home.unlimited')}</ThemedText>
          </View>
        </View>
        <View className="flex-1 items-center">
          <ThemedText className="text-light-subtext dark:text-dark-subtext text-center text-sm">
            {t('home.nextBilling')}
          </ThemedText>
          <View className="flex-row items-center">
            <Icon name="CreditCard" size={14} className="mr-2" />
            <ThemedText className="text-center text-lg font-bold">
              {formatNextBilling(membership.chargeStartsAt)}
            </ThemedText>
          </View>
        </View>
        <View className="flex-1 items-center">
          <ThemedText className="text-light-subtext dark:text-dark-subtext text-center text-sm">
            {t('home.memberSince')}
          </ThemedText>
          <View className="flex-row items-center">
            <Icon name="Award" size={14} className="mr-2" />
            <ThemedText className="text-center text-lg font-bold">
              {getMemberSinceYear(membership.startsAt)}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
});

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

const ChildClassesScroll = memo(({ child, onConfirm, onDeny }: ChildClassesScrollProps) => {
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
});

const ChildrenClassesTabs = memo(({ children, onConfirm, onDeny }: ChildrenClassesTabsProps) => {
  const { t } = useTranslation();

  // Filter children with classes
  const childrenWithClassesFiltered = useMemo(
    () => children.filter((child) => child.classes.length > 0),
    [children]
  );

  if (childrenWithClassesFiltered.length === 0) {
    return null;
  }

  return (
    <>
      {childrenWithClassesFiltered.map((child) => (
        <View key={child.id} className="bg-background pb-5">
          {/* Child header with avatar and name */}
          <View className="mb-2 flex-row items-center px-5">
            <Avatar name={child.fullName} size="sm" />
            <Section title={t('home.childClasses', { name: child.firstName })} className="ml-3" />
          </View>

          {/* Child's classes in horizontal scroll */}
          <ChildClassesScroll child={child} onConfirm={onConfirm} onDeny={onDeny} />
        </View>
      ))}
    </>
  );
});
