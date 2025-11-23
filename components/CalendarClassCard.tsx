import React from 'react';
import { View, Pressable } from 'react-native';
import ThemedText from './ThemedText';
import Icon from './Icon';
import Avatar from './Avatar';
import { useThemeColors } from '@/contexts/ThemeColors';
import { Class } from '@/api/classes';

interface CalendarClassCardProps {
  classData: Class;
  onPress?: () => void;
}

export default function CalendarClassCard({ classData, onPress }: CalendarClassCardProps) {
  const colors = useThemeColors();

  const getCategoryColor = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      'BJJ': '#9333EA',
      'Muay Thai': '#DC2626',
      'Boxing': '#2563EB',
      'Wrestling': '#EA580C',
      'MMA': '#16A34A',
      'Grappling': '#7C3AED',
      'Self Defense': '#DB2777',
      'Fitness': '#0891B2',
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

        {/* Level Badge */}
        <View className="mt-3 flex-row items-center justify-between">
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
            <ThemedText className="text-xs font-semibold">{classData.level}</ThemedText>
          </View>

          <View className="flex-row items-center">
            <Icon name="Users" size={14} color={colors.text} className="opacity-50" />
            <ThemedText className="ml-1 text-sm opacity-70">
              {classData.enrolled}/{classData.capacity}
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
