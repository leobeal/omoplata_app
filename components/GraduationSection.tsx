import React, { memo, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions, View } from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';

import Avatar from './Avatar';
import { GraduationCard } from './GraduationCard';
import Section from './Section';

import { ChildWithGraduations, Graduation } from '@/api/graduations';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

interface GraduationSectionProps {
  graduations: Graduation[];
  childName?: string;
}

export const GraduationSection = memo(({ graduations, childName }: GraduationSectionProps) => {
  const t = useT();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<GHScrollView>(null);

  const cardWidth = width - 40; // Full width minus padding (20 on each side)
  const cardGap = 12;
  const horizontalPadding = 20;

  // Calculate snap offsets for each card
  const snapOffsets = useMemo(() => {
    return graduations.map((_, index) => index * (cardWidth + cardGap));
  }, [graduations, cardWidth, cardGap]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (cardWidth + cardGap));
    setActiveIndex(index);
  };

  if (graduations.length === 0) {
    return null;
  }

  // Title - either the child's name or the default title
  const title = childName ? t('graduation.childTitle', { name: childName }) : t('graduation.title');

  return (
    <View className="bg-background pb-5">
      {/* Header */}
      <View className="mb-2 flex-row items-center px-5">
        {childName && <Avatar name={childName} size="sm" />}
        <Section title={title} className={childName ? 'ml-3' : ''} noTopMargin={!!childName} />
      </View>

      {/* Horizontal scroll for graduation cards */}
      <GHScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToOffsets={snapOffsets}
        snapToEnd={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, gap: cardGap }}>
        {graduations.map((graduation) => (
          <View key={graduation.id} style={{ width: cardWidth }}>
            <GraduationCard graduation={graduation} />
          </View>
        ))}
      </GHScrollView>

      {/* Pagination dots - centered below cards */}
      {graduations.length > 1 && (
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          {graduations.map((_, index) => (
            <View
              key={index}
              className="h-2 rounded-full"
              style={{
                width: index === activeIndex ? 16 : 8,
                backgroundColor: index === activeIndex ? colors.highlight : colors.border,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
});

interface ChildrenGraduationsSectionProps {
  childrenWithGraduations: ChildWithGraduations[];
}

export const ChildrenGraduationsSection = memo(
  ({ childrenWithGraduations }: ChildrenGraduationsSectionProps) => {
    // Filter children that have graduations
    const childrenWithGrads = childrenWithGraduations.filter(
      (child) => child.graduations.length > 0
    );

    if (childrenWithGrads.length === 0) {
      return null;
    }

    return (
      <>
        {childrenWithGrads.map((child) => (
          <GraduationSection
            key={child.id}
            graduations={child.graduations}
            childName={child.firstName}
          />
        ))}
      </>
    );
  }
);

export default GraduationSection;
