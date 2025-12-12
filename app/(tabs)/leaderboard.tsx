import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  View,
} from 'react-native';

import {
  getLeaderboard,
  Leaderboard,
  LeaderboardFilters,
  LeaderboardParams,
} from '@/api/leaderboard';
import Avatar from '@/components/Avatar';
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
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function LeaderboardScreen() {
  const t = useT();
  const colors = useThemeColors();
  const { user } = useAuth();
  const filterSheetRef = useRef<FilterBottomSheetRef>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [filters, setFilters] = useState<LeaderboardFilters | null>(null);

  // Filter state
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('month');
  const [selectedDemographic, setSelectedDemographic] = useState('all');

  // Scroll state for collapsible title
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const LARGE_TITLE_HEIGHT = 44; // Approximate height of large title

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowHeaderTitle(offsetY > LARGE_TITLE_HEIGHT);
  }, []);

  // Count active secondary filters (non-default values)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedDiscipline !== 'all') count++;
    if (selectedDemographic !== 'all') count++;
    return count;
  }, [selectedDiscipline, selectedDemographic]);

  const handleApplyFilters = useCallback((values: { discipline: string; demographic: string }) => {
    setSelectedDiscipline(values.discipline);
    setSelectedDemographic(values.demographic);
  }, []);

  const loadLeaderboard = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const params: LeaderboardParams = {
          discipline: selectedDiscipline,
          timePeriod: selectedTimePeriod,
          demographic: selectedDemographic,
        };
        const response = await getLeaderboard(params);
        setLeaderboard(response.leaderboard);
        setFilters(response.filters);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setLoading(false);
      }
    },
    [selectedDiscipline, selectedTimePeriod, selectedDemographic]
  );

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeaderboard(false);
    setRefreshing(false);
  }, [loadLeaderboard]);

  // When filters change, reload
  useEffect(() => {
    if (!loading) {
      loadLeaderboard(false);
    }
  }, [selectedDiscipline, selectedTimePeriod, selectedDemographic]);

  if (loading && !leaderboard) {
    return (
      <View className="flex-1 bg-background">
        <Header
          title={t('leaderboard.title')}
          rightComponents={[
            <Avatar
              key="avatar"
              name={user ? `${user.firstName} ${user.lastName}` : ''}
              size="xs"
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

  return (
    <View className="flex-1 bg-background">
      <Header
        title={t('leaderboard.title')}
        showTitle={showHeaderTitle}
        rightComponents={[
          <Avatar
            key="avatar"
            name={user ? `${user.firstName} ${user.lastName}` : ''}
            size="xs"
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
            <View style={{ flex: 0.85 }}>
              <FilterTabs
                options={filters.timePeriods}
                selectedId={selectedTimePeriod}
                onSelect={setSelectedTimePeriod}
              />
            </View>
            <FilterButton
              onPress={() => filterSheetRef.current?.open()}
              activeCount={activeFilterCount}
            />
          </View>
        )}

        {/* Podium - Top 3 */}
        {leaderboard && leaderboard.entries.length >= 3 && (
          <Podium entries={leaderboard.entries} currentUserId="current-user" />
        )}

        {/* Leaderboard List - Remaining entries */}
        <Section title={t('leaderboard.rankings')} titleSize="lg" noTopMargin>
          {leaderboard?.entries.length === 0 ? (
            <EmptyState />
          ) : (
            <View className="rounded-2xl bg-secondary">
              {leaderboard?.entries.slice(3).map((entry, index, arr) => (
                <LeaderboardEntryCard
                  key={entry.id}
                  entry={entry}
                  isCurrentUser={entry.id === 'current-user'}
                  isLast={index === arr.length - 1}
                />
              ))}
            </View>
          )}
        </Section>
      </ThemedScroller>

      {/* Filter Bottom Sheet */}
      {filters && (
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

const EmptyState = memo(() => {
  const t = useT();
  const colors = useThemeColors();

  return (
    <View className="mb-4 items-center justify-center rounded-2xl bg-secondary py-12">
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.highlight + '20' }}>
        <Icon name="Trophy" size={32} color={colors.highlight} />
      </View>
      <ThemedText className="mb-2 text-center font-semibold">
        {t('leaderboard.noResults')}
      </ThemedText>
      <ThemedText className="text-center text-sm opacity-70">
        {t('leaderboard.tryDifferentFilters')}
      </ThemedText>
    </View>
  );
});
