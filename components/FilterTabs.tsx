import SegmentedControl from '@react-native-segmented-control/segmented-control';
import React, { memo } from 'react';

import { FilterOption } from '@/api/leaderboard';
import { useThemeColors } from '@/contexts/ThemeColors';

interface FilterTabsProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const FilterTabs = memo(({ options, selectedId, onSelect }: FilterTabsProps) => {
  const colors = useThemeColors();
  const selectedIndex = options.findIndex((o) => o.id === selectedId);
  const values = options.map((o) => o.name);

  return (
    <SegmentedControl
      values={values}
      selectedIndex={selectedIndex}
      onChange={(event) => {
        const index = event.nativeEvent.selectedSegmentIndex;
        if (options[index]) {
          onSelect(options[index].id);
        }
      }}
      appearance={colors.isDark ? 'dark' : 'light'}
    />
  );
});

export default FilterTabs;
