import { BlurView } from 'expo-blur';
import React, { memo } from 'react';
import { View } from 'react-native';

import Avatar from './Avatar';
import Icon from './Icon';
import ThemedText from './ThemedText';

import { LeaderboardEntry, UserRank } from '@/api/leaderboard';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

// Medal colors for top 3 - using transparent versions that work in both light and dark modes
const MEDAL_COLORS = {
  1: { bg: 'rgba(245, 158, 11, 0.25)', border: '#F59E0B', text: '#F59E0B' }, // Gold
  2: { bg: 'rgba(156, 163, 175, 0.25)', border: '#9CA3AF', text: '#9CA3AF' }, // Silver
  3: { bg: 'rgba(234, 88, 12, 0.25)', border: '#EA580C', text: '#EA580C' }, // Bronze
};

// Podium heights (relative)
const PODIUM_HEIGHTS = {
  1: 100,
  2: 75,
  3: 60,
};

interface LeaderboardEntryCardProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  isLast?: boolean;
}

export const LeaderboardEntryCard = memo(
  ({ entry, isCurrentUser = false, isLast = false }: LeaderboardEntryCardProps) => {
    const colors = useThemeColors();
    const t = useT();

    const isAnonymous = !entry.isOptedIn;
    const displayName = isAnonymous ? t('leaderboard.anonymous') : entry.fullName;

    const getTrendIcon = () => {
      switch (entry.trend) {
        case 'up':
          return <Icon name="TrendingUp" size={14} color="#10B981" />;
        case 'down':
          return <Icon name="TrendingDown" size={14} color="#EF4444" />;
        default:
          return <Icon name="Minus" size={14} color={colors.subtext} />;
      }
    };

    const getTrendText = () => {
      if (entry.rankChange === 0) return null;
      const prefix = entry.trend === 'up' ? '+' : '-';
      return (
        <ThemedText
          className="ml-0.5 text-xs"
          style={{ color: entry.trend === 'up' ? '#10B981' : '#EF4444' }}>
          {prefix}
          {Math.abs(entry.rankChange)}
        </ThemedText>
      );
    };

    return (
      <View
        className={`flex-row items-center p-4 ${!isLast ? 'border-b border-border' : ''}`}
        style={
          isCurrentUser
            ? {
                backgroundColor: colors.highlight + '10',
              }
            : undefined
        }>
        {/* Rank */}
        <View className="mr-3 w-8 items-center">
          <ThemedText className="text-base font-semibold opacity-50">#{entry.rank}</ThemedText>
        </View>

        {/* Avatar */}
        <View className="mr-3 h-12 w-12">
          <Avatar name={entry.fullName} size="md" src={entry.avatarUrl} />
          {isAnonymous && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 999,
                overflow: 'hidden',
              }}>
              <BlurView
                intensity={80}
                tint="dark"
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}>
                <Icon name="UserRound" size={24} color="#999" />
              </BlurView>
            </View>
          )}
        </View>

        {/* User Info */}
        <View className="flex-1">
          <View className="flex-row items-center">
            <ThemedText className="font-semibold" numberOfLines={1}>
              {displayName}
            </ThemedText>
            {isCurrentUser && (
              <View
                className="ml-2 rounded-full px-2 py-0.5"
                style={{ backgroundColor: colors.highlight }}>
                <ThemedText className="text-xs font-medium" style={{ color: '#FFFFFF' }}>
                  {t('leaderboard.you')}
                </ThemedText>
              </View>
            )}
          </View>
          <View className="mt-0.5 flex-row items-center">
            <ThemedText className="text-sm opacity-50">{entry.topDiscipline}</ThemedText>
            {entry.streakWeeks > 0 && (
              <>
                <ThemedText className="mx-1 text-sm opacity-30">•</ThemedText>
                <Icon name="Flame" size={12} color="#F59E0B" />
                <ThemedText className="ml-0.5 text-sm opacity-50">{entry.streakWeeks}w</ThemedText>
              </>
            )}
          </View>
        </View>

        {/* Classes & Trend */}
        <View className="items-end">
          <ThemedText className="font-bold">{entry.classesAttended}</ThemedText>
          <View className="mt-0.5 flex-row items-center">
            {getTrendIcon()}
            {getTrendText()}
          </View>
        </View>
      </View>
    );
  }
);

interface UserRankCardProps {
  userRank: UserRank;
}

// Podium Component for Top 3
interface PodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

const PodiumPlace = memo(
  ({
    entry,
    isCurrentUser,
    position,
  }: {
    entry: LeaderboardEntry;
    isCurrentUser: boolean;
    position: 1 | 2 | 3;
  }) => {
    const colors = useThemeColors();
    const t = useT();
    const medalColor = MEDAL_COLORS[position];
    const height = PODIUM_HEIGHTS[position];

    const avatarSize = position === 1 ? 64 : 48;
    const isAnonymous = !entry.isOptedIn;
    const displayName = isAnonymous ? t('leaderboard.anonymous') : entry.fullName.split(' ')[0];

    return (
      <View className="flex-1 items-center">
        {/* Avatar & Name */}
        <View className="items-center">
          <View
            style={{
              width: avatarSize + 8,
              height: avatarSize + 8,
              borderWidth: 3,
              borderColor: isAnonymous ? colors.border : medalColor.border,
              backgroundColor: colors.secondary,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View style={{ width: avatarSize, height: avatarSize }}>
              <Avatar
                name={entry.fullName}
                size={position === 1 ? 'lg' : 'md'}
                src={entry.avatarUrl}
              />
              {isAnonymous && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}>
                  <BlurView
                    intensity={80}
                    tint="dark"
                    style={{
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                    }}>
                    <Icon name="UserRound" size={position === 1 ? 28 : 22} color="#999" />
                  </BlurView>
                </View>
              )}
            </View>
          </View>
          <ThemedText
            className={`text-center font-semibold ${position === 1 ? 'text-sm' : 'text-xs'}`}
            numberOfLines={1}
            style={{ marginTop: 8 }}>
            {displayName}
          </ThemedText>
          {isCurrentUser && (
            <View
              className="mt-1 rounded-full px-2 py-0.5"
              style={{ backgroundColor: colors.highlight }}>
              <ThemedText className="text-xs font-medium" style={{ color: '#FFFFFF' }}>
                {t('leaderboard.you')}
              </ThemedText>
            </View>
          )}
          <ThemedText
            className={`mt-1 font-bold ${position === 1 ? 'text-base' : 'text-sm'}`}
            style={{ color: colors.highlight }}>
            {entry.classesAttended} {t('leaderboard.classes')}
          </ThemedText>
        </View>

        {/* Podium Stand */}
        <View
          className="mt-3 w-full rounded-t-xl"
          style={{
            height,
            backgroundColor: medalColor.bg,
          }}
        />
      </View>
    );
  }
);

export const Podium = memo(({ entries, currentUserId }: PodiumProps) => {
  // Need at least 3 entries for podium
  if (entries.length < 3) return null;

  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  return (
    <View className="mb-4 flex-row items-end gap-1 px-2">
      {/* 2nd Place - Left */}
      <PodiumPlace entry={second} isCurrentUser={second.id === currentUserId} position={2} />

      {/* 1st Place - Center */}
      <PodiumPlace entry={first} isCurrentUser={first.id === currentUserId} position={1} />

      {/* 3rd Place - Right */}
      <PodiumPlace entry={third} isCurrentUser={third.id === currentUserId} position={3} />
    </View>
  );
});

export const UserRankCard = memo(({ userRank }: UserRankCardProps) => {
  const colors = useThemeColors();
  const t = useT();

  const percentile = Math.round(
    ((userRank.totalUsers - userRank.rank) / userRank.totalUsers) * 100
  );

  return (
    <View className="mb-4 rounded-2xl p-5" style={{ backgroundColor: colors.highlight + '15' }}>
      <View className="flex-row items-center justify-between">
        {/* Rank */}
        <View className="items-center">
          <ThemedText className="text-4xl font-bold" style={{ color: colors.highlight }}>
            #{userRank.rank}
          </ThemedText>
          <ThemedText className="text-xs opacity-50">
            {t('leaderboard.outOf', { total: userRank.totalUsers })}
          </ThemedText>
        </View>

        {/* Divider */}
        <View className="mx-4 h-16 w-px bg-border" />

        {/* Stats */}
        <View className="flex-1 flex-row justify-around">
          <View className="items-center">
            <ThemedText className="text-2xl font-bold">{userRank.classesAttended}</ThemedText>
            <ThemedText className="text-xs opacity-50">{t('leaderboard.classes')}</ThemedText>
          </View>
          <View className="items-center">
            <View className="flex-row items-center">
              <Icon name="Flame" size={20} color="#F59E0B" />
              <ThemedText className="ml-1 text-2xl font-bold">{userRank.streakWeeks}</ThemedText>
            </View>
            <ThemedText className="text-xs opacity-50">{t('leaderboard.weeks')}</ThemedText>
          </View>
        </View>
      </View>

      {/* Percentile */}
      <View className="mt-4 items-center rounded-xl bg-background p-3">
        <ThemedText className="text-sm">
          {t('leaderboard.topPercentile', { percent: 100 - percentile })}
        </ThemedText>
      </View>
    </View>
  );
});

export default LeaderboardEntryCard;
