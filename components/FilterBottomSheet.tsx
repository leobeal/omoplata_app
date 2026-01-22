import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';

import Icon from './Icon';
import ThemedText from './ThemedText';

import { FilterOption } from '@/api/leaderboard';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

interface FilterConfig {
  discipline: FilterOption[];
  demographic: FilterOption[];
}

interface FilterValues {
  discipline: string;
  demographic: string;
}

export interface FilterBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface FilterBottomSheetProps {
  filters: FilterConfig;
  values: FilterValues;
  onApply: (values: FilterValues) => void;
}

const FilterOptionRow = memo(
  ({
    label,
    options,
    selectedId,
    onSelect,
  }: {
    label: string;
    options: FilterOption[];
    selectedId: string;
    onSelect: (id: string) => void;
  }) => {
    const colors = useThemeColors();

    return (
      <View className="mb-4">
        <ThemedText className="mb-2 text-xs font-semibold uppercase opacity-50">{label}</ThemedText>
        <View className="flex-row flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selectedId === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => onSelect(option.id)}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor: isSelected ? colors.highlight : colors.secondary,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.highlight : colors.border,
                }}>
                <ThemedText
                  className="text-sm font-medium"
                  style={{ color: isSelected ? '#FFFFFF' : colors.text }}>
                  {option.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }
);

export const FilterBottomSheet = forwardRef<FilterBottomSheetRef, FilterBottomSheetProps>(
  ({ filters, values, onApply }, ref) => {
    const t = useT();
    const colors = useThemeColors();
    const actionSheetRef = useRef<ActionSheetRef>(null);

    const [localValues, setLocalValues] = useState<FilterValues>(values);

    useImperativeHandle(ref, () => ({
      open: () => {
        setLocalValues(values);
        actionSheetRef.current?.show();
      },
      close: () => {
        actionSheetRef.current?.hide();
      },
    }));

    const handleApply = useCallback(() => {
      onApply(localValues);
      actionSheetRef.current?.hide();
    }, [localValues, onApply]);

    const handleReset = useCallback(() => {
      const resetValues: FilterValues = {
        discipline: 'all',
        demographic: 'all',
      };
      setLocalValues(resetValues);
    }, []);

    const hasActiveFilters = localValues.discipline !== 'all' || localValues.demographic !== 'all';

    return (
      <ActionSheet
        ref={actionSheetRef}
        gestureEnabled
        drawUnderStatusBar={false}
        statusBarTranslucent
        containerStyle={{
          backgroundColor: colors.bg,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}>
        <View className="p-5 pb-10">
          {/* Header */}
          <View className="mb-5 flex-row items-center justify-between">
            <ThemedText className="text-xl font-bold">{t('leaderboard.filters.title')}</ThemedText>
            {hasActiveFilters && (
              <Pressable onPress={handleReset}>
                <ThemedText className="text-sm" style={{ color: colors.highlight }}>
                  {t('common.reset')}
                </ThemedText>
              </Pressable>
            )}
          </View>

          {/* Filter Sections - only show if more than 1 option */}
          {filters.discipline.length > 1 && (
            <FilterOptionRow
              label={t('leaderboard.filters.discipline')}
              options={filters.discipline}
              selectedId={localValues.discipline}
              onSelect={(id) => setLocalValues((prev) => ({ ...prev, discipline: id }))}
            />
          )}

          {filters.demographic.length > 1 && (
            <FilterOptionRow
              label={t('leaderboard.filters.demographic')}
              options={filters.demographic}
              selectedId={localValues.demographic}
              onSelect={(id) => setLocalValues((prev) => ({ ...prev, demographic: id }))}
            />
          )}

          {/* Apply Button */}
          <Pressable
            onPress={handleApply}
            className="mt-4 items-center rounded-xl py-4"
            style={{ backgroundColor: colors.highlight }}>
            <ThemedText className="font-semibold text-white">
              {t('leaderboard.filters.apply')}
            </ThemedText>
          </Pressable>
        </View>
      </ActionSheet>
    );
  }
);

interface FilterButtonProps {
  onPress: () => void;
  activeCount: number;
}

export const FilterButton = memo(({ onPress, activeCount }: FilterButtonProps) => {
  const colors = useThemeColors();
  const hasActiveFilters = activeCount > 0;

  return (
    <Pressable
      onPress={onPress}
      className="relative items-center justify-center"
      style={{
        width: 32,
        height: 32,
      }}>
      <Icon
        name="SlidersHorizontal"
        size={20}
        color={hasActiveFilters ? colors.highlight : colors.text}
      />
      {hasActiveFilters && (
        <View
          className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.highlight }}>
          <ThemedText className="text-[10px] font-bold text-white">{activeCount}</ThemedText>
        </View>
      )}
    </Pressable>
  );
});

export default FilterBottomSheet;
