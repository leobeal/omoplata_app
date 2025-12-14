import React from 'react';
import { View, Pressable } from 'react-native';

import Avatar from './Avatar';
import Icon from './Icon';
import ThemedText from './ThemedText';

import { Class } from '@/api/classes';
import { useThemeColors } from '@/contexts/ThemeColors';

interface CalendarClassCardProps {
  classData: Class;
  onPress?: () => void;
}

export default function CalendarClassCard({ classData, onPress }: CalendarClassCardProps) {
  const colors = useThemeColors();

  // Early return if classData is null/undefined
  if (!classData) {
    return null;
  }

  const getCategoryColor = (category: string | undefined) => {
    if (!category) return colors.highlight;
    const categoryColors: { [key: string]: string } = {
      BJJ: '#9333EA',
      'Muay Thai': '#DC2626',
      Boxing: '#2563EB',
      Wrestling: '#EA580C',
      MMA: '#16A34A',
      Grappling: '#7C3AED',
      'Self Defense': '#DB2777',
      Fitness: '#0891B2',
      'Open Mat': '#65A30D',
    };
    return categoryColors[category] || colors.highlight;
  };

  const categoryColor = getCategoryColor(classData.category);

  // Check for valid instructor (not null or empty)
  const instructor = typeof classData.instructor === 'string' ? classData.instructor : '';
  const hasInstructor = instructor && instructor.trim() !== '';

  // Check for valid location
  const location = typeof classData.location === 'string' ? classData.location : '';
  const hasLocation = location && location.trim() !== '';

  // Check for valid level
  const level = typeof classData.level === 'string' ? classData.level : '';
  const hasLevel = level && level.trim() !== '';

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-2xl bg-secondary"
      style={{ borderLeftWidth: 4, borderLeftColor: categoryColor }}>
      <View className="px-4 py-4">
        {/* Header: Category & Title */}
        <View className="mb-2 flex-row items-center">
          <View className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor }} />
          <ThemedText className="text-xs font-semibold opacity-60">
            {classData.category || ''}
          </ThemedText>
        </View>
        <ThemedText className="text-lg font-bold" numberOfLines={2}>
          {classData.title || ''}
        </ThemedText>

        {/* Instructor - only show if available */}
        {hasInstructor && (
          <View className="mt-3 flex-row items-center">
            <Avatar name={instructor} src={classData.instructorAvatar} size="xs" />
            <ThemedText className="ml-2 text-sm opacity-70">{instructor}</ThemedText>
          </View>
        )}

        {/* Time & Participants */}
        <View className="mt-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Icon name="Clock" size={14} color={colors.text} className="opacity-50" />
            <ThemedText className="ml-1.5 text-sm opacity-70">
              {classData.startTime || ''} - {classData.endTime || ''}
            </ThemedText>
          </View>

          {/* Participants Avatars */}
          <View className="flex-row items-center">
            {classData.participants && classData.participants.length > 0 ? (
              <View className="flex-row items-center">
                {classData.participants.map((participant, index) => {
                  if (!participant) return null;
                  const name =
                    [participant.firstName, participant.lastName].filter(Boolean).join(' ') ||
                    'Unknown';
                  return (
                    <View key={index} style={{ marginLeft: index > 0 ? -8 : 0, zIndex: 4 - index }}>
                      <Avatar name={name} src={participant.avatar} size="xs" />
                    </View>
                  );
                })}
                {classData.remainingParticipants > 0 && (
                  <View
                    className="h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      marginLeft: -8,
                      backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5',
                    }}>
                    <ThemedText className="text-[10px] font-semibold">
                      +{classData.remainingParticipants}
                    </ThemedText>
                  </View>
                )}
              </View>
            ) : classData.totalParticipants > 0 || classData.capacity?.max ? (
              <View className="flex-row items-center">
                <Icon name="Users" size={14} color={colors.text} className="opacity-50" />
                <ThemedText className="ml-1.5 text-sm opacity-70">
                  {classData.totalParticipants ?? classData.enrolled ?? 0}/
                  {classData.capacity?.max ?? '∞'}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        {/* Location & Level */}
        {(hasLocation || hasLevel) && (
          <View className="mt-3 flex-row items-center justify-between">
            {hasLocation && (
              <View className="flex-row items-center">
                <Icon name="MapPin" size={14} color={colors.text} className="opacity-50" />
                <ThemedText className="ml-1.5 text-sm opacity-70">{location}</ThemedText>
              </View>
            )}
            {!hasLocation && <View />}

            {hasLevel && (
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
                <ThemedText className="text-xs font-semibold">{level}</ThemedText>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
