import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import ThemedText from './ThemedText';

import { BeltConfig, ColorStop, Graduation, StripeLayer } from '@/api/graduations';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

interface BeltVisualProps {
  config: BeltConfig;
  stripes?: number; // Current stripe count to display
  size?: 'sm' | 'md' | 'lg';
  borderColor?: string;
}

// Size configurations
const SIZE_CONFIG = {
  sm: { width: 40, height: 20, stripeHeight: 16, stripeWidth: 3 },
  md: { width: 64, height: 32, stripeHeight: 24, stripeWidth: 4 },
  lg: { width: 80, height: 40, stripeHeight: 32, stripeWidth: 5 },
};

// Check if belt needs a border (light colors)
const needsBorder = (colors: ColorStop[]): boolean => {
  return colors.some((colorStop) => {
    const hex = colorStop.color.toUpperCase();
    return hex === '#FFFFFF' || hex === '#FFF' || hex.includes('FFFF');
  });
};

// Calculate which stripes to render based on total stripes and layer config
// Layers stack on top of each other at the same positions (left to right)
// Example: 6 stripes with layers [4 white, 4 red, 3 yellow]
// - Layer 0: 4 white stripes at positions [0.15, 0.35, 0.55, 0.75]
// - Layer 1: 2 red stripes at positions [0.15, 0.35] (covering white from left)
// Result: [red, red, white, white] - 2 red on left + 2 white on right
const calculateStripesToRender = (
  stripeLayers: StripeLayer[],
  totalStripes: number
): { color: string; position: number }[] => {
  if (!stripeLayers.length || totalStripes === 0) return [];

  // Get max positions from first layer
  const maxPositions = stripeLayers[0]?.positions?.length || 4;

  // Build array of colors per position, stacking layers from left to right
  const positionColors: string[] = new Array(maxPositions).fill('');
  let remainingStripes = totalStripes;

  for (const layer of stripeLayers) {
    if (remainingStripes <= 0) break;

    const stripesInThisLayer = Math.min(remainingStripes, layer.maxCount);
    // Fill from LEFT (position 0) to RIGHT
    for (let i = 0; i < stripesInThisLayer; i++) {
      if (i < maxPositions) {
        positionColors[i] = layer.color; // Overwrite with newer layer color
      }
    }
    remainingStripes -= stripesInThisLayer;
  }

  // Get positions from first layer
  const positions = stripeLayers[0]?.positions || [];

  // Convert to result array, filtering out empty positions
  return positionColors
    .map((color, index) => ({
      color,
      position: positions[index] || 0,
    }))
    .filter((stripe) => stripe.color !== '');
};

// Reusable Belt Visual Component - API driven
export const BeltVisual = ({ config, stripes = 0, size = 'md', borderColor }: BeltVisualProps) => {
  const { colors, stripeLayers = [], hasGraduationBar = false } = config;
  const { width, height, stripeHeight, stripeWidth } = SIZE_CONFIG[size];

  const showBorder = needsBorder(colors);
  const stripesToRender = calculateStripesToRender(stripeLayers, stripes);
  const stripeSectionWidth = Math.max(stripesToRender.length * (stripeWidth + 2) + 8, width * 0.3);

  // Graduation bar with stripes (BJJ style)
  const GraduationBar = () => {
    if (!hasGraduationBar) return null;

    return (
      <View
        className="absolute items-center justify-center"
        style={{
          width: stripeSectionWidth,
          height: '100%',
          backgroundColor: '#18181B',
          left: (width - stripeSectionWidth) / 2,
        }}>
        <View
          className="flex-row items-center justify-center"
          style={{
            width: stripeSectionWidth,
            height: '100%',
            gap: 2,
          }}>
          {stripesToRender.map((stripe, i) => (
            <View
              key={i}
              style={{
                width: stripeWidth,
                height: stripeHeight,
                backgroundColor: stripe.color,
                borderRadius: 1,
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  // Render belt bands based on color stops
  const renderBands = () => {
    if (colors.length === 1) {
      return <View style={{ flex: 1, backgroundColor: colors[0].color }} />;
    }

    // Calculate flex values based on stop ranges
    return colors.map((colorStop: ColorStop, i: number) => {
      const flexValue = colorStop.stop[1] - colorStop.stop[0];
      return (
        <View
          key={i}
          style={{
            flex: flexValue,
            backgroundColor: colorStop.color,
          }}
        />
      );
    });
  };

  return (
    <View
      className="overflow-hidden rounded-xl"
      style={{
        width,
        height,
        flexDirection: 'column',
        borderWidth: showBorder ? 1 : 0,
        borderColor: borderColor || '#D1D5DB',
      }}>
      {renderBands()}
      <GraduationBar />
    </View>
  );
};

interface GraduationCardProps {
  graduation: Graduation;
  animate?: boolean;
}

export const GraduationCard = ({ graduation, animate = true }: GraduationCardProps) => {
  const t = useT();
  const colors = useThemeColors();
  const animationProgress = useRef(new Animated.Value(animate ? 0 : 1)).current;

  const {
    discipline,
    beltKey,
    beltConfig,
    nextBeltConfig,
    classesAttended = 0,
    classesRequired = 0,
    stripes,
    maxStripes,
    showProgress = true,
  } = graduation;

  // Determine if we're progressing toward next stripe or next belt
  const hasStripes = beltConfig.hasGraduationBar && maxStripes > 0;
  const isProgressingToStripe = hasStripes && stripes < maxStripes;
  const percentage = Math.min((classesAttended / classesRequired) * 100, 100);

  // Progress bar color - use current belt primary for stripe progress, next belt for belt progress
  const progressBarColor = isProgressingToStripe
    ? beltConfig.colors[0].color
    : nextBeltConfig?.colors[0].color || beltConfig.colors[0].color;

  useEffect(() => {
    if (!animate) {
      animationProgress.setValue(1);
      return;
    }

    animationProgress.setValue(0);
    const animation = Animated.timing(animationProgress, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();

    return () => {
      animation.stop();
    };
  }, [graduation, animate, animationProgress]);

  return (
    <View className="rounded-2xl bg-secondary p-4">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <ThemedText className="text-lg font-bold">{discipline}</ThemedText>
          <ThemedText className="text-sm opacity-60">
            {t(`graduation.belts.${beltKey}`)}
            {stripes > 0 && ` • ${stripes} ${stripes === 1 ? 'stripe' : 'stripes'}`}
          </ThemedText>
        </View>
        {/* Belt visualization */}
        <BeltVisual config={beltConfig} stripes={stripes} size="lg" borderColor={colors.border} />
      </View>

      {/* Progress Section - only show if showProgress is true and we have progress data */}
      {showProgress && classesRequired > 0 && (
        <View className="rounded-xl bg-background p-3">
          {isProgressingToStripe ? (
            /* Progress to next stripe */
            <>
              <View className="mb-2 flex-row items-center justify-between">
                <ThemedText className="text-sm opacity-60">
                  {t('graduation.nextStripe')} ({stripes + 1}/{maxStripes})
                </ThemedText>
                <ThemedText className="text-sm font-bold">
                  {classesAttended}/{classesRequired}
                </ThemedText>
              </View>

              <View className="h-2 overflow-hidden rounded-full bg-border">
                <Animated.View
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: progressBarColor,
                    width: animationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${percentage}%`],
                    }),
                  }}
                />
              </View>

              <ThemedText className="mt-2 text-xs opacity-50">
                {classesRequired - classesAttended} {t('graduation.classesRemaining')}
              </ThemedText>
            </>
          ) : (
            /* Progress to next belt */
            <>
              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <ThemedText className="text-sm opacity-60">
                    {t('graduation.nextBelt')}:
                  </ThemedText>
                  {nextBeltConfig && (
                    <View className="ml-2 mr-2">
                      <BeltVisual config={nextBeltConfig} size="sm" borderColor={colors.border} />
                    </View>
                  )}
                </View>
                <ThemedText className="text-sm font-bold">
                  {classesAttended}/{classesRequired}
                </ThemedText>
              </View>

              <View className="h-2 overflow-hidden rounded-full bg-border">
                <Animated.View
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: progressBarColor,
                    width: animationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${percentage}%`],
                    }),
                  }}
                />
              </View>

              <ThemedText className="mt-2 text-xs opacity-50">
                {classesRequired - classesAttended} {t('graduation.classesRemaining')}
              </ThemedText>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default GraduationCard;
