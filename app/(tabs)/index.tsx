import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Pressable,
  RefreshControl,
  useWindowDimensions,
  Alert,
  ImageBackground,
  Animated,
  Platform,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';

import { confirmAttendance, denyAttendance, ChildWithClasses } from '@/api/classes';
import { Graduation, ChildWithGraduations } from '@/api/graduations';
import { getStatusTranslationKey, Membership } from '@/api/membership';
import { getTodayMood, submitMood, MoodLevel } from '@/api/mood';
import { isSepaAvailable, PaymentMethod } from '@/api/payment-methods';
import Avatar from '@/components/Avatar';
import ClassCard from '@/components/ClassCard';
import GraduationSection, { ChildrenGraduationsSection } from '@/components/GraduationSection';
import Header, { HeaderIcon } from '@/components/Header';
import Icon from '@/components/Icon';
import Section from '@/components/Section';
import SepaForm from '@/components/SepaForm';
import { SmallChartCard } from '@/components/SmallChartCard';
import { SmallDonutCard } from '@/components/SmallDonutCard';
import { SmallStreakCard } from '@/components/SmallStreakCard';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/DashboardReadyContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useScrollToTop } from '@/contexts/ScrollToTopContext';
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
    graduations,
    childrenWithGraduations,
    refreshData,
    setClasses,
    setPaymentMethods,
  } = useAppData();
  const [refreshing, setRefreshing] = useState(false);

  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';

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

  // Scroll-to-top functionality
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const { registerScrollHandler, unregisterScrollHandler } = useScrollToTop();

  useEffect(() => {
    const handleScrollToTop = () => {
      // On iOS, account for contentInset when scrolling to top
      const topOffset = Platform.OS === 'ios' ? -100 : 0;
      scrollViewRef.current?.scrollTo({ y: topOffset, animated: true });
    };

    registerScrollHandler('/', handleScrollToTop);
    registerScrollHandler('/index', handleScrollToTop);

    return () => {
      unregisterScrollHandler('/');
      unregisterScrollHandler('/index');
    };
  }, [registerScrollHandler, unregisterScrollHandler]);

  // Animated scroll tracking for header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 500],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1 bg-background">
      {/* Fixed Background Image - Dark mode only */}
      {colors.isDark && (
        <ImageBackground
          source={require('@/assets/_global/img/2.jpg')}
          className="absolute left-0 right-0 top-0 h-[700px]"
          resizeMode="cover">
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(20,20,20,0.85)', colors.bg]}
            locations={[0, 0.35, 0.7, 1]}
            style={{ flex: 1 }}
          />
        </ImageBackground>
      )}

      {/* Animated Header with background transition */}
      <Header
        transparent
        leftComponent={
          <HeaderIcon icon="Bell" hasBadge href="/screens/notifications" isWhite={colors.isDark} />
        }
        rightComponents={[
          <Avatar name={userName} size="sm" link="/screens/settings" src={user?.profilePicture} />,
        ]}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.bg,
            opacity: headerOpacity,
            zIndex: -1,
          }}
        />
      </Header>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        contentInset={Platform.OS === 'ios' ? { top: 100 } : undefined}
        contentOffset={Platform.OS === 'ios' ? { x: 0, y: -100 } : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF', colors.highlight]}
            progressViewOffset={Platform.OS === 'android' ? 100 : 0}
          />
        }>
        {/* Spacer for fixed header - smaller on iOS due to contentInset */}
        <View style={{ height: Platform.OS === 'ios' ? 12 : 112 }} />

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

        {/* Hero Content */}
        <View className="px-6 pb-6">
          <Section
            title={`${t('home.welcomeBack')}, ${user?.nickname || user?.firstName || ''}!`}
            titleSize="4xl"
            subtitle={today}
            className="mb-8 mt-4"
          />
          <MoodCheck />
          <DailyMotivation />
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
      </Animated.ScrollView>
    </View>
  );
}

const ActivityStats = memo(() => {
  const { t } = useTranslation();
  const { analytics } = useAppData();

  // Extract graphs by type using helper
  const disciplineBreakdown = analytics.graphs.find((g) => g.type === 'discipline_breakdown');
  const weeklyAttendance = analytics.graphs.find((g) => g.type === 'weekly_attendance');
  const trainingStreak = analytics.graphs.find((g) => g.type === 'training_streak');

  // Transform discipline breakdown to donut segments format
  const donutSegments =
    disciplineBreakdown && disciplineBreakdown.type === 'discipline_breakdown'
      ? disciplineBreakdown.labels.map((label, i) => ({
          label,
          value: disciplineBreakdown.data[i],
          color:
            disciplineBreakdown.colors?.[i] || ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'][i % 4],
        }))
      : [];

  const totalClasses = donutSegments.reduce((sum, s) => sum + s.value, 0);

  // Get weekly attendance data for chart
  const weeklyData =
    weeklyAttendance && weeklyAttendance.type === 'weekly_attendance' ? weeklyAttendance.data : [];

  // Get streak data
  const currentStreak =
    trainingStreak && trainingStreak.type === 'training_streak' ? trainingStreak.current_streak : 0;
  const longestStreak =
    trainingStreak && trainingStreak.type === 'training_streak'
      ? trainingStreak.longest_streak
      : 12;

  return (
    <View className="mb-6">
      <View className="mb-4 flex-row items-stretch gap-4">
        <View className="flex-1">
          <SmallDonutCard
            title={t('home.classes')}
            animate
            subtitle={t('home.thisMonth')}
            segments={donutSegments}
            centerValue={totalClasses.toString()}
            centerLabel={t('home.total')}
            size={90}
          />
        </View>
        <View className="flex-1">
          <SmallChartCard
            title={t('home.checkins')}
            value={weeklyData.reduce((a, b) => a + b, 0).toString()}
            unit={t('home.thisMonth')}
            subtitle={t('home.last6Weeks')}
            data={weeklyData}
            lineColor="#10b981"
          />
        </View>
      </View>
      <View className="flex-row items-stretch gap-4">
        <View className="flex-1">
          <SmallStreakCard
            title={t('home.weeklyStreak')}
            currentLabel={t('home.current')}
            bestLabel={t('home.best')}
            streakWeeks={currentStreak}
            goalWeeks={longestStreak}
          />
        </View>
      </View>
    </View>
  );
});

const MOTIVATIONAL_QUOTES = [
  // Keep strong impact in English
  { text: 'A black belt is a white belt who never quit.', author: 'Unknown' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
  { text: 'Discipline beats motivation when motivation fades.', author: 'Unknown' },
  { text: 'Technique conquers strength.', author: 'Helio Gracie' },
  { text: 'Position before submission.', author: 'Jiu-Jitsu Principle' },
  { text: 'Your toughest opponent is the one in the mirror.', author: 'Unknown' },
  { text: 'You don’t win fights in the ring. You win them in the gym.', author: 'Unknown' },
  { text: 'Pain is temporary. Skill is forever.', author: 'Unknown' },

  // Translated to German
  {
    text: 'Ein Schwarzgurt ist nur ein Weißgurt, der niemals aufgegeben hat.',
    author: 'Unbekannt',
  },
  { text: 'Der wahre Kampf beginnt lange vor dem ersten Schlag.', author: 'Unbekannt' },
  { text: 'Trainiere hart, kämpfe leicht.', author: 'Traditionelles Sprichwort' },
  { text: 'Technik schlägt Kraft.', author: 'Helio Gracie' },
  { text: 'Stärke kommt nicht aus dem Körper, sondern aus dem Willen.', author: 'Mahatma Gandhi' },
  { text: 'Der härteste Gegner ist der, den du im Spiegel siehst.', author: 'Unbekannt' },
  { text: 'Jede Einheit auf der Matte macht dich besser.', author: 'Unbekannt' },
  { text: 'Respektiere den Weg, nicht nur den Gürtel.', author: 'Unbekannt' },
  {
    text: 'Disziplin bedeutet, das zu tun, was schwer ist – auch wenn niemand zusieht.',
    author: 'Unbekannt',
  },
  { text: 'Erfolg wird auf der Matte aufgebaut, nicht am Wettkampftag.', author: 'Unbekannt' },
  { text: 'Der Schmerz vergeht. Die Technik bleibt.', author: 'Unbekannt' },
  { text: 'Selbstvertrauen entsteht durch Stunden auf der Matte.', author: 'Unbekannt' },
  { text: 'Du verdienst deinen Gürtel an jedem einzelnen Trainingstag.', author: 'Unbekannt' },
];

const MOODS = [
  { icon: 'Rocket', labelKey: 'home.moodMega', color: '#ef4444' },
  { icon: 'Zap', labelKey: 'home.moodMotivated', color: '#22c55e' },
  { icon: 'Meh', labelKey: 'home.moodOkay', color: '#f59e0b' },
  { icon: 'TrendingDown', labelKey: 'home.moodLow', color: '#8b5cf6' },
  { icon: 'BatteryLow', labelKey: 'home.moodNone', color: '#6b7280' },
] as const;

const MoodCheck = memo(() => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  // Load saved mood on mount or when user changes (resets daily, isolated per user)
  useEffect(() => {
    const loadSavedMood = async () => {
      const savedMood = await getTodayMood(user?.id);
      if (savedMood !== null) {
        setSelectedMood(savedMood);
      } else {
        setSelectedMood(null);
      }
    };
    loadSavedMood();
  }, [user?.id]);

  // Handle mood selection with debounced API call
  const handleMoodSelect = useCallback(
    (index: number) => {
      setSelectedMood(index);
      submitMood(index as MoodLevel, user?.id);
    },
    [user?.id]
  );

  return (
    <View className="mb-6 rounded-xl pb-6 pt-6">
      {/* Title */}
      <View className="mb-4 items-center justify-center">
        <ThemedText className="text-2xl font-bold">{t('home.moodQuestion')}</ThemedText>
      </View>

      {/* Mood selector row */}
      <View className="flex-row justify-between px-4">
        {MOODS.map((mood, index) => (
          <Pressable
            key={index}
            onPress={() => handleMoodSelect(index)}
            className="flex-1 items-center">
            <View
              className="mb-1 h-14 w-14 items-center justify-center overflow-hidden rounded-full"
              style={{
                backgroundColor: selectedMood === index ? mood.color + '30' : 'transparent',
              }}>
              <Icon
                name={mood.icon}
                size={28}
                color={selectedMood === index ? mood.color : colors.text}
                style={{ opacity: selectedMood === index ? 1 : 0.5 }}
              />
            </View>
            <ThemedText
              className="text-center text-xs"
              style={{
                opacity: selectedMood === index ? 1 : 0.5,
                color: selectedMood === index ? mood.color : colors.text,
              }}>
              {t(mood.labelKey)}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

const DailyMotivation = memo(() => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  // Get a quote based on the day of the year (changes daily)
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const quote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];

  return (
    <View
      className="mb-6 rounded-2xl p-6"
      style={{
        backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
      }}>
      <ThemedText className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-60">
        {t('home.dailyMotivation')}
      </ThemedText>
      <ThemedText className="mb-3 text-xl font-semibold italic leading-7">
        "{quote.text}"
      </ThemedText>
      <ThemedText className="text-sm opacity-50">— {quote.author}</ThemedText>
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
    <View className="mb-6 rounded-xl pb-6 pt-14">
      <View className="mb-12 items-center">
        <View className="relative h-32 w-32 items-center justify-center rounded-full bg-white/20">
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

      <View className="mt-4 flex-row justify-between gap-4 rounded-2xl border-t border-white/20 px-6 pt-4">
        <View className="flex-1 items-center">
          <ThemedText className="text-center text-sm opacity-70">
            {t('home.classesLeft')}
          </ThemedText>
          <View className="flex-row items-center">
            <Icon name="Calendar" size={14} className="mr-2" />
            <ThemedText className="text-center text-lg font-bold">{t('home.unlimited')}</ThemedText>
          </View>
        </View>
        <View className="flex-1 items-center">
          <ThemedText className="text-center text-sm opacity-70">
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
          <ThemedText className="text-center text-sm opacity-70">
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
  const gap = 12;
  const horizontalPadding = 20;

  // Calculate snap offsets for each card
  const classesToShow = child.classes.slice(0, 3);
  const snapOffsets = classesToShow.map((_, index) => index * (cardWidth + gap));

  return (
    <GHScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToOffsets={snapOffsets}
      snapToEnd={false}
      contentContainerStyle={{ paddingHorizontal: horizontalPadding, gap }}>
      {classesToShow.map((classItem) => (
        <View key={classItem.id} style={{ width: cardWidth }}>
          <ClassCard
            classData={classItem}
            childId={child.id}
            onConfirm={onConfirm}
            onDeny={onDeny}
          />
        </View>
      ))}
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

  // Use slider only when more than 1 child has classes
  const useSlider = childrenWithClassesFiltered.length > 1;

  return (
    <>
      {childrenWithClassesFiltered.map((child) => (
        <View key={child.id} className="bg-background pb-5">
          {/* Child header with avatar and name */}
          <View className="mb-2 flex-row items-center px-5">
            <Avatar name={child.fullName} size="sm" />
            <Section
              title={t('home.childClasses', { name: child.firstName })}
              className="ml-3"
              noTopMargin
            />
          </View>

          {/* Child's classes - slider if multiple children, vertical list if single child */}
          {useSlider ? (
            <ChildClassesScroll child={child} onConfirm={onConfirm} onDeny={onDeny} />
          ) : (
            <View className="px-5">
              {child.classes.slice(0, 3).map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classData={classItem}
                  childId={child.id}
                  onConfirm={onConfirm}
                  onDeny={onDeny}
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </>
  );
});
