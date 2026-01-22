import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';

import { api } from '@/api/client';
import {
  getLeaderboard,
  Leaderboard,
  LeaderboardFilters,
  LeaderboardParams,
} from '@/api/leaderboard';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import {
  FilterBottomSheet,
  FilterBottomSheetRef,
  FilterButton,
} from '@/components/FilterBottomSheet';
import FilterTabs from '@/components/FilterTabs';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import LargeTitle from '@/components/LargeTitle';
import { LeaderboardEntryCard, Podium } from '@/components/LeaderboardCard';
import Section from '@/components/Section';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';
import {
  CACHE_DURATIONS,
  CACHE_KEYS,
  clearLeaderboardCache,
  getFromCache,
  saveToCache,
} from '@/utils/local-cache';

// Cache key generator for leaderboard data (uses CACHE_KEYS.LEADERBOARD prefix for clearLeaderboardCache())
const getStorageCacheKey = (discipline: string, timePeriod: string, demographic: string) =>
  `${CACHE_KEYS.LEADERBOARD}_${discipline}|${timePeriod}|${demographic}`;

// In-memory cache key (for instant switching within session)
const getMemoryCacheKey = (discipline: string, timePeriod: string, demographic: string) =>
  `${discipline}|${timePeriod}|${demographic}`;

// Type for cached leaderboard data
interface CachedLeaderboardData {
  leaderboard: Leaderboard;
  filters: LeaderboardFilters;
}

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { user, showInLeaderboard, refreshProfile } = useAuth();
  const isFocused = useIsFocused();
  const filterSheetRef = useRef<FilterBottomSheetRef>(null);
  const wasFocusedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [filters, setFilters] = useState<LeaderboardFilters | null>(null);

  // Cache for leaderboard data by filter combination
  const cacheRef = useRef<Map<string, CachedLeaderboardData>>(new Map());

  // Filter state
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('month');
  const [selectedDemographic, setSelectedDemographic] = useState('all');

  // Scroll state for collapsible title
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const LARGE_TITLE_HEIGHT = 44; // Approximate height of large title

  // Privacy opt-in state
  const [isOptingIn, setIsOptingIn] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bannerPermanentlyDismissed, setBannerPermanentlyDismissed] = useState(false);

  // Load permanent dismissal state from AsyncStorage
  useEffect(() => {
    const loadDismissalState = async () => {
      try {
        const dismissed = await AsyncStorage.getItem('@omoplata/leaderboard_banner_dismissed');
        if (dismissed === 'true') {
          setBannerPermanentlyDismissed(true);
        }
      } catch (error) {
        console.error('Failed to load banner dismissal state:', error);
      }
    };
    loadDismissalState();
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowHeaderTitle(offsetY > LARGE_TITLE_HEIGHT);
  }, []);

  // Translate time period filter options
  const translatedTimePeriods = useMemo(() => {
    if (!filters?.timePeriods) return [];
    return filters.timePeriods.map((option) => ({
      ...option,
      name: t(`leaderboard.timePeriods.${option.id}`) || option.name,
    }));
  }, [filters?.timePeriods, t]);

  // Count active secondary filters (non-default values)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedDiscipline !== 'all') count++;
    if (selectedDemographic !== 'all') count++;
    return count;
  }, [selectedDiscipline, selectedDemographic]);

  // Check if we should show the filter button (only if multiple options exist)
  const showFilterButton = useMemo(() => {
    if (!filters) return false;
    const hasMultipleDisciplines = filters.disciplines.length > 1;
    const hasMultipleDemographics = filters.demographics.length > 1;
    return hasMultipleDisciplines || hasMultipleDemographics;
  }, [filters]);

  const handleApplyFilters = useCallback((values: { discipline: string; demographic: string }) => {
    setSelectedDiscipline(values.discipline);
    setSelectedDemographic(values.demographic);
  }, []);

  const loadLeaderboard = useCallback(
    async (forceRefresh = false) => {
      const memoryCacheKey = getMemoryCacheKey(
        selectedDiscipline,
        selectedTimePeriod,
        selectedDemographic
      );
      const storageCacheKey = getStorageCacheKey(
        selectedDiscipline,
        selectedTimePeriod,
        selectedDemographic
      );

      // Check in-memory cache first (fastest, for instant filter switching)
      if (!forceRefresh) {
        const memoryCached = cacheRef.current.get(memoryCacheKey);
        if (memoryCached) {
          setLeaderboard(memoryCached.leaderboard);
          setFilters(memoryCached.filters);
          setError(null);
          setLoading(false);
          return;
        }

        // Check AsyncStorage cache (persists across sessions)
        const storageCached = await getFromCache<CachedLeaderboardData>(
          storageCacheKey,
          CACHE_DURATIONS.MEDIUM // 1 hour cache
        );
        if (storageCached) {
          // Populate in-memory cache and use cached data
          cacheRef.current.set(memoryCacheKey, storageCached);
          setLeaderboard(storageCached.leaderboard);
          setFilters(storageCached.filters);
          setError(null);
          setLoading(false);
          return;
        }
      }

      // Show loader when fetching from API (keep filters visible)
      setLoading(true);
      setError(null);
      try {
        const params: LeaderboardParams = {
          discipline: selectedDiscipline,
          timePeriod: selectedTimePeriod,
          demographic: selectedDemographic,
        };
        const { data } = await getLeaderboard(params);

        const cachedData: CachedLeaderboardData = {
          leaderboard: data.leaderboard,
          filters: data.filters,
        };

        // Store in both in-memory and AsyncStorage cache
        cacheRef.current.set(memoryCacheKey, cachedData);
        await saveToCache(storageCacheKey, cachedData);

        setLeaderboard(data.leaderboard);
        setFilters(data.filters);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    },
    [selectedDiscipline, selectedTimePeriod, selectedDemographic]
  );

  const handleGoPublic = useCallback(async () => {
    if (!user?.prefixedId) return;

    setIsOptingIn(true);
    try {
      const response = await api.patch(`/users/${user.prefixedId}/profile`, {
        show_in_leaderboard: true,
      });

      if (!response.error) {
        // Refresh profile to update showInLeaderboard in context and clear both caches
        await refreshProfile();
        cacheRef.current.clear();
        await clearLeaderboardCache();
        await loadLeaderboard(true);
      }
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
    } finally {
      setIsOptingIn(false);
    }
  }, [user?.prefixedId, loadLeaderboard, refreshProfile]);

  const handleRemindLater = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  const handleDontShowAgain = useCallback(async () => {
    setBannerPermanentlyDismissed(true);
    try {
      await AsyncStorage.setItem('@omoplata/leaderboard_banner_dismissed', 'true');
    } catch (error) {
      console.error('Failed to save banner dismissal state:', error);
    }
  }, []);

  // Track previous user ID to detect profile switches
  const previousUserIdRef = useRef<string | undefined>(user?.id);

  // Reload when filters change or user changes (profile switch)
  useEffect(() => {
    // Clear cache and reset dismissal state when user changes
    if (previousUserIdRef.current !== user?.id) {
      cacheRef.current.clear();
      clearLeaderboardCache(); // Also clear AsyncStorage cache on user switch
      previousUserIdRef.current = user?.id;
      setBannerDismissed(false);
      // Reload permanent dismissal state for new user
      AsyncStorage.getItem('@omoplata/leaderboard_banner_dismissed').then((dismissed) => {
        setBannerPermanentlyDismissed(dismissed === 'true');
      });
    }

    loadLeaderboard();
  }, [loadLeaderboard, user?.id]);

  // When screen comes back into focus, clear in-memory cache and reload
  // This ensures privacy changes are reflected (AsyncStorage cache is cleared by privacy screen)
  useEffect(() => {
    if (isFocused && !wasFocusedRef.current) {
      // Clear in-memory cache so we fall back to AsyncStorage cache
      // If privacy changed, AsyncStorage cache was cleared and we'll fetch fresh data
      // If privacy didn't change, we'll use the AsyncStorage cached data (no API call)
      cacheRef.current.clear();
      loadLeaderboard(); // Will use AsyncStorage cache if available
    }
    wasFocusedRef.current = isFocused;
  }, [isFocused, loadLeaderboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Force refresh bypasses cache and fetches fresh data
    await loadLeaderboard(true);
    setRefreshing(false);
  }, [loadLeaderboard]);

  // Show full-screen loader only on initial load (no filters yet)
  if (loading && !filters) {
    return (
      <View className="flex-1 bg-background">
        <Header
          rightComponents={[
            <Avatar
              key="avatar"
              name={user ? `${user.firstName} ${user.lastName}` : ''}
              size="sm"
              link="/screens/settings"
              src={user?.profilePicture}
            />,
          ]}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.highlight} />
        </View>
      </View>
    );
  }

  if (error && !leaderboard) {
    return (
      <View className="flex-1 bg-background">
        <Header
          rightComponents={[
            <Avatar
              key="avatar"
              name={user ? `${user.firstName} ${user.lastName}` : ''}
              size="sm"
              link="/screens/settings"
              src={user?.profilePicture}
            />,
          ]}
        />
        <View className="flex-1 items-center justify-center px-6">
          <ErrorState onRetry={() => loadLeaderboard(true)} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header
        title={showHeaderTitle ? t('leaderboard.title') : undefined}
        rightComponents={[
          <Avatar
            key="avatar"
            name={user ? `${user.firstName} ${user.lastName}` : ''}
            size="sm"
            link="/screens/settings"
            src={user?.profilePicture}
          />,
        ]}
      />
      <ThemedScroller
        className="flex-1 px-6"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF', colors.highlight]}
            progressBackgroundColor={colors.bg}
          />
        }>
        {/* Large Title */}
        <LargeTitle title={t('leaderboard.title')} className="pt-2" />

        {/* Filters - Compact Layout */}
        {filters && (
          <View className="mb-4 flex-row items-center justify-between">
            <View style={{ flex: showFilterButton ? 0.85 : 1 }}>
              <FilterTabs
                options={translatedTimePeriods}
                selectedId={selectedTimePeriod}
                onSelect={setSelectedTimePeriod}
              />
            </View>
            {showFilterButton && (
              <FilterButton
                onPress={() => filterSheetRef.current?.open()}
                activeCount={activeFilterCount}
              />
            )}
          </View>
        )}

        {/* Privacy Banner - show when user is not opted in and hasn't dismissed */}
        {!showInLeaderboard && !bannerDismissed && !bannerPermanentlyDismissed && (
          <PrivacyBanner
            onGoPublic={handleGoPublic}
            onRemindLater={handleRemindLater}
            onDontShowAgain={handleDontShowAgain}
            isLoading={isOptingIn}
          />
        )}

        {/* Content area - show loader or leaderboard */}
        {loading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator size="large" color={colors.highlight} />
          </View>
        ) : leaderboard?.entries.length === 0 ? (
          <EmptyState hasFilters={activeFilterCount > 0} />
        ) : (
          <>
            {/* Podium - Top 3 (or fewer) */}
            {leaderboard && leaderboard.entries.length > 0 && (
              <Podium entries={leaderboard.entries} currentUserId="current-user" />
            )}

            {/* Leaderboard List - Remaining entries */}
            <Section title={t('leaderboard.rankings')} titleSize="lg" noTopMargin>
              <View className="rounded-2xl bg-secondary">
                {leaderboard?.entries.slice(3).map((entry, index, arr) => (
                  <LeaderboardEntryCard
                    key={entry.id && entry.id !== 'null' ? entry.id : `entry-${index}`}
                    entry={entry}
                    isCurrentUser={entry.id === 'current-user'}
                    isLast={index === arr.length - 1}
                  />
                ))}
              </View>
            </Section>
          </>
        )}
      </ThemedScroller>

      {/* Filter Bottom Sheet - only render if there are filters to show */}
      {filters && showFilterButton && (
        <FilterBottomSheet
          ref={filterSheetRef}
          filters={{
            discipline: filters.disciplines,
            demographic: filters.demographics,
          }}
          values={{
            discipline: selectedDiscipline,
            demographic: selectedDemographic,
          }}
          onApply={handleApplyFilters}
        />
      )}
    </View>
  );
}

const EmptyState = memo(({ hasFilters }: { hasFilters: boolean }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center py-16">
      <View className="mb-4 rounded-full p-6" style={{ backgroundColor: colors.skeleton }}>
        <Icon name="Trophy" size={48} color={colors.text} className="opacity-30" />
      </View>
      <ThemedText className="text-center text-xl font-bold opacity-80">
        {t('leaderboard.noResults')}
      </ThemedText>
      <ThemedText className="mt-2 px-8 text-center opacity-50">
        {hasFilters ? t('leaderboard.tryDifferentFilters') : t('leaderboard.beTheFirst')}
      </ThemedText>
    </View>
  );
});

const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View className="w-full items-center justify-center rounded-2xl bg-secondary px-6 py-12">
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.error + '20' }}>
        <Icon name="WifiOff" size={32} color={colors.error} />
      </View>
      <ThemedText className="mb-2 text-center text-lg font-semibold">
        {t('leaderboard.errorTitle')}
      </ThemedText>
      <ThemedText className="mb-6 text-center text-sm opacity-70">
        {t('leaderboard.errorMessage')}
      </ThemedText>
      <Pressable
        onPress={onRetry}
        className="flex-row items-center rounded-full px-6 py-3"
        style={{ backgroundColor: colors.highlight }}>
        <Icon name="RefreshCw" size={18} color="#FFFFFF" />
        <ThemedText className="ml-2 font-semibold text-white">{t('common.retry')}</ThemedText>
      </Pressable>
    </View>
  );
});

const PrivacyBanner = memo(
  ({
    onGoPublic,
    onRemindLater,
    onDontShowAgain,
    isLoading,
  }: {
    onGoPublic: () => void;
    onRemindLater: () => void;
    onDontShowAgain: () => void;
    isLoading: boolean;
  }) => {
    const { t } = useTranslation();
    const colors = useThemeColors();

    const handleClose = useCallback(() => {
      Alert.alert(t('leaderboard.privacy.dismissTitle'), t('leaderboard.privacy.dismissMessage'), [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('leaderboard.privacy.remindLater'),
          onPress: onRemindLater,
        },
        {
          text: t('leaderboard.privacy.dontShowAgain'),
          onPress: onDontShowAgain,
          style: 'destructive',
        },
      ]);
    }, [t, onDontShowAgain, onRemindLater]);

    return (
      <View className="mb-4 rounded-2xl bg-secondary p-5">
        {/* Close button */}
        <Pressable
          onPress={handleClose}
          className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.text + '10' }}>
          <Icon name="X" size={18} color={colors.text} style={{ opacity: 0.5 }} />
        </Pressable>

        <View className="mb-4 items-center">
          <ThemedText className="mb-1 text-center text-lg font-bold">
            {t('leaderboard.privacy.title')}
          </ThemedText>
          <ThemedText className="text-center text-sm opacity-70">
            {t('leaderboard.privacy.description')}
          </ThemedText>
        </View>
        <ThemedText className="mb-4 text-center text-xs opacity-50">
          {t('leaderboard.privacy.canChangeInSettings')}
        </ThemedText>
        <View className="gap-2">
          <Button
            title={t('leaderboard.privacy.goPublic')}
            onPress={onGoPublic}
            loading={isLoading}
          />
          <Button
            title={t('leaderboard.privacy.remindLater')}
            onPress={onRemindLater}
            variant="secondary"
          />
        </View>
      </View>
    );
  }
);
