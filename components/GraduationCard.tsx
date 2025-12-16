import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import ThemedText from './ThemedText';

import { BeltConfig, Graduation, StripeLayer } from '@/api/graduations';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

interface BeltVisualProps {
  config: BeltConfig;
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
const needsBorder = (colors: string[]): boolean => {
  return colors.some((color) => {
    const hex = color.toUpperCase();
    return hex === '#FFFFFF' || hex === '#FFF' || hex.includes('FFFF');
  });
};

// Reusable Belt Visual Component - API driven
export const BeltVisual = ({ config, size = 'md', borderColor }: BeltVisualProps) => {
  const { colors, stripeLayers = [], hasGraduationBar = false, splitVertical = false } = config;
  const { width, height, stripeHeight, stripeWidth } = SIZE_CONFIG[size];

  const showBorder = needsBorder(colors);
  const visibleStripesCount = Math.min(
    4,
    stripeLayers.reduce((sum, layer) => sum + layer.count, 0)
  );
  const stripeSectionWidth = Math.max(visibleStripesCount * (stripeWidth + 2) + 8, width * 0.3);

  // Graduation bar with stripe layers (BJJ style)
  const GraduationBar = () => {
    if (!hasGraduationBar || stripeLayers.length === 0) return null;

    return (
      <View
        className="absolute items-center justify-center"
        style={{
          width: stripeSectionWidth,
          height: '100%',
          backgroundColor: '#18181B',
          left: (width - stripeSectionWidth) / 2,
        }}>
        {stripeLayers.map((layer: StripeLayer, layerIndex: number) => (
          <View
            key={layerIndex}
            className="absolute flex-row items-center justify-center"
            style={{
              width: stripeSectionWidth,
              height: '100%',
              gap: 2,
            }}>
            {Array.from({ length: layer.count }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: stripeWidth,
                  height: stripeHeight,
                  backgroundColor: layer.color,
                  borderRadius: 1,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

  // Render belt bands
  const renderBands = () => {
    if (colors.length === 1) {
      return <View style={{ flex: 1, backgroundColor: colors[0] }} />;
    }

    return colors.map((color, i) => <View key={i} style={{ flex: 1, backgroundColor: color }} />);
  };

  return (
    <View
      className="overflow-hidden rounded-xl"
      style={{
        width,
        height,
        flexDirection: splitVertical ? 'row' : 'column',
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
    ? beltConfig.colors[0]
    : nextBeltConfig?.colors[0] || beltConfig.colors[0];

  useEffect(() => {
    if (!animate) {
      animationProgress.setValue(1);
      return;
    }

    animationProgress.setValue(0);
    Animated.timing(animationProgress, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
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
        <BeltVisual config={beltConfig} size="lg" borderColor={colors.border} />
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
