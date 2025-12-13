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

  const getCategoryColor = (category: string) => {
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

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-2xl bg-secondary"
      style={{ borderLeftWidth: 4, borderLeftColor: categoryColor }}>
      <View className="p-4">
        {/* Header */}
        <View className="mb-3 flex-row items-start justify-between">
          <View className="flex-1">
            <View className="mb-1 flex-row items-center">
              <View
                className="mr-2 h-2 w-2 rounded-full"
                style={{ backgroundColor: categoryColor }}
              />
              <ThemedText className="text-xs font-semibold opacity-60">
                {classData.category}
              </ThemedText>
            </View>
            <ThemedText className="text-lg font-bold" numberOfLines={2}>
              {classData.title}
            </ThemedText>
          </View>
        </View>

        {/* Instructor */}
        <View className="mb-3 flex-row items-center">
          <Avatar name={classData.instructor} size="xs" />
          <ThemedText className="ml-2 text-sm opacity-70">{classData.instructor}</ThemedText>
        </View>

        {/* Details */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Icon name="Clock" size={14} color={colors.text} className="opacity-50" />
            <ThemedText className="ml-1 text-sm opacity-70">
              {classData.startTime} - {classData.endTime}
            </ThemedText>
          </View>

          <View className="flex-row items-center">
            <Icon name="MapPin" size={14} color={colors.text} className="opacity-50" />
            <ThemedText className="ml-1 text-sm opacity-70">{classData.location}</ThemedText>
          </View>
        </View>

        {/* Level Badge and Participants */}
        <View className="mt-3 flex-row items-center justify-between">
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
            <ThemedText className="text-xs font-semibold">{classData.level}</ThemedText>
          </View>

          {/* Participants Avatars */}
          <View className="flex-row items-center">
            {classData.participants.length > 0 ? (
              <View className="flex-row items-center">
                {classData.participants.slice(0, 4).map((participant, index) => (
                  <View key={index} style={{ marginLeft: index > 0 ? -8 : 0, zIndex: 4 - index }}>
                    <Avatar
                      name={`${participant.firstName} ${participant.lastName}`}
                      src={participant.avatar}
                      size="xs"
                    />
                  </View>
                ))}
                {classData.participants.length > 4 && (
                  <View
                    className="h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      marginLeft: -8,
                      backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5',
                    }}>
                    <ThemedText className="text-[10px] font-semibold">
                      +{classData.participants.length - 4}
                    </ThemedText>
                  </View>
                )}
              </View>
            ) : (
              <View className="flex-row items-center">
                <Icon name="Users" size={14} color={colors.text} className="opacity-50" />
                <ThemedText className="ml-1 text-sm opacity-70">
                  {classData.enrolled}/{classData.capacity.max ?? '∞'}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
