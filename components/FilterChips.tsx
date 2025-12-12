import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';

import Icon, { IconName } from './Icon';
import ThemedText from './ThemedText';

import { FilterOption } from '@/api/leaderboard';
import { useThemeColors } from '@/contexts/ThemeColors';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: IconName;
}

export const FilterChip = memo(({ label, isSelected, onPress, icon }: FilterChipProps) => {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      className="mr-2 flex-row items-center rounded-full px-4 py-2"
      style={{
        backgroundColor: isSelected ? colors.highlight : colors.secondary,
        borderWidth: 1,
        borderColor: isSelected ? colors.highlight : colors.border,
      }}>
      {icon && (
        <Icon name={icon} size={14} color={isSelected ? '#FFFFFF' : colors.text} className="mr-1" />
      )}
      <ThemedText
        className="text-sm font-medium"
        style={{ color: isSelected ? '#FFFFFF' : colors.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
});

interface FilterChipGroupProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  icon?: IconName;
}

export const FilterChipGroup = memo(
  ({ options, selectedId, onSelect, icon }: FilterChipGroupProps) => {
    return (
      <GHScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}>
        {options.map((option) => (
          <FilterChip
            key={option.id}
            label={option.name}
            isSelected={selectedId === option.id}
            onPress={() => onSelect(option.id)}
            icon={icon}
          />
        ))}
      </GHScrollView>
    );
  }
);

interface FilterSectionProps {
  label: string;
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  icon?: IconName;
}

export const FilterSection = memo(
  ({ label, options, selectedId, onSelect, icon }: FilterSectionProps) => {
    return (
      <View className="mb-4">
        <ThemedText className="mb-2 px-5 text-xs font-semibold uppercase opacity-50">
          {label}
        </ThemedText>
        <FilterChipGroup
          options={options}
          selectedId={selectedId}
          onSelect={onSelect}
          icon={icon}
        />
      </View>
    );
  }
);

interface DropdownFilterProps {
  label: string;
  value: string;
  onPress: () => void;
}

export const DropdownFilter = memo(({ label, value, onPress }: DropdownFilterProps) => {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      className="mr-2 flex-row items-center rounded-full px-4 py-2"
      style={{
        backgroundColor: colors.secondary,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      <ThemedText className="mr-1 text-sm font-medium">{value}</ThemedText>
      <Icon name="ChevronDown" size={16} color={colors.text} />
    </Pressable>
  );
});

export default FilterChip;
