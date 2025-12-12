import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import ThemedText from './ThemedText';

import { BeltSystem, Graduation } from '@/api/graduations';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

// Belt system configuration - defines how each martial art's belts look
interface BeltSystemConfig {
  hasGraduationBar: boolean; // Black bar in middle (BJJ style)
  hasStripes: boolean; // Whether stripes are shown
  colors: Record<string, BeltColorDef>;
}

interface BeltColorDef {
  primary: string;
  secondary: string;
  colors?: string[]; // For multi-color belts
  split?: boolean; // Vertical split (coral belts)
}

// BJJ belt colors (including kids and coral belts)
const BJJ_COLORS: Record<string, BeltColorDef> = {
  // Adult belts
  white: { primary: '#FFFFFF', secondary: '#E5E5E5' },
  blue: { primary: '#1E40AF', secondary: '#3B82F6' },
  purple: { primary: '#6B21A8', secondary: '#9333EA' },
  brown: { primary: '#78350F', secondary: '#A16207' },
  black: { primary: '#18181B', secondary: '#3F3F46' },
  // Kids belts - Solid
  grey: { primary: '#6B7280', secondary: '#9CA3AF' },
  yellow: { primary: '#EAB308', secondary: '#FACC15' },
  orange: { primary: '#EA580C', secondary: '#F97316' },
  green: { primary: '#16A34A', secondary: '#22C55E' },
  // Kids belts - Two-color (horizontal bands)
  'white-grey': {
    primary: '#6B7280',
    secondary: '#9CA3AF',
    colors: ['#FFFFFF', '#6B7280', '#FFFFFF'],
  },
  'grey-white': {
    primary: '#6B7280',
    secondary: '#9CA3AF',
    colors: ['#6B7280', '#FFFFFF', '#6B7280'],
  },
  'grey-black': {
    primary: '#6B7280',
    secondary: '#3F3F46',
    colors: ['#6B7280', '#18181B', '#6B7280'],
  },
  'yellow-white': {
    primary: '#EAB308',
    secondary: '#FACC15',
    colors: ['#EAB308', '#FFFFFF', '#EAB308'],
  },
  'yellow-black': {
    primary: '#EAB308',
    secondary: '#FACC15',
    colors: ['#EAB308', '#18181B', '#EAB308'],
  },
  'orange-white': {
    primary: '#EA580C',
    secondary: '#F97316',
    colors: ['#EA580C', '#FFFFFF', '#EA580C'],
  },
  'orange-black': {
    primary: '#EA580C',
    secondary: '#F97316',
    colors: ['#EA580C', '#18181B', '#EA580C'],
  },
  'green-white': {
    primary: '#16A34A',
    secondary: '#22C55E',
    colors: ['#16A34A', '#FFFFFF', '#16A34A'],
  },
  'green-black': {
    primary: '#16A34A',
    secondary: '#22C55E',
    colors: ['#16A34A', '#18181B', '#16A34A'],
  },
  // Coral & Red belts (vertical split)
  'red-black': {
    primary: '#DC2626',
    secondary: '#EF4444',
    colors: ['#DC2626', '#18181B'],
    split: true,
  },
  'red-white': {
    primary: '#DC2626',
    secondary: '#EF4444',
    colors: ['#DC2626', '#FFFFFF'],
    split: true,
  },
  red: { primary: '#DC2626', secondary: '#EF4444' },
};

// Judo belt colors
const JUDO_COLORS: Record<string, BeltColorDef> = {
  white: { primary: '#FFFFFF', secondary: '#E5E5E5' },
  yellow: { primary: '#EAB308', secondary: '#FACC15' },
  orange: { primary: '#EA580C', secondary: '#F97316' },
  green: { primary: '#16A34A', secondary: '#22C55E' },
  blue: { primary: '#1E40AF', secondary: '#3B82F6' },
  brown: { primary: '#78350F', secondary: '#A16207' },
  black: { primary: '#18181B', secondary: '#3F3F46' },
  // Red belts for high dans
  red: { primary: '#DC2626', secondary: '#EF4444' },
  'red-white': {
    primary: '#DC2626',
    secondary: '#EF4444',
    colors: ['#DC2626', '#FFFFFF', '#DC2626', '#FFFFFF', '#DC2626'],
  },
};

// Karate belt colors
const KARATE_COLORS: Record<string, BeltColorDef> = {
  white: { primary: '#FFFFFF', secondary: '#E5E5E5' },
  yellow: { primary: '#EAB308', secondary: '#FACC15' },
  orange: { primary: '#EA580C', secondary: '#F97316' },
  green: { primary: '#16A34A', secondary: '#22C55E' },
  blue: { primary: '#1E40AF', secondary: '#3B82F6' },
  purple: { primary: '#6B21A8', secondary: '#9333EA' },
  brown: { primary: '#78350F', secondary: '#A16207' },
  black: { primary: '#18181B', secondary: '#3F3F46' },
};

// Taekwondo belt colors
const TAEKWONDO_COLORS: Record<string, BeltColorDef> = {
  white: { primary: '#FFFFFF', secondary: '#E5E5E5' },
  yellow: { primary: '#EAB308', secondary: '#FACC15' },
  green: { primary: '#16A34A', secondary: '#22C55E' },
  blue: { primary: '#1E40AF', secondary: '#3B82F6' },
  red: { primary: '#DC2626', secondary: '#EF4444' },
  black: { primary: '#18181B', secondary: '#3F3F46' },
  // Poom belt (junior black belt)
  'red-black': {
    primary: '#DC2626',
    secondary: '#18181B',
    colors: ['#DC2626', '#18181B'],
    split: true,
  },
};

// Muay Thai (prajioud arm bands - simplified as belts)
const MUAY_THAI_COLORS: Record<string, BeltColorDef> = {
  white: { primary: '#FFFFFF', secondary: '#E5E5E5' },
  yellow: { primary: '#EAB308', secondary: '#FACC15' },
  orange: { primary: '#EA580C', secondary: '#F97316' },
  green: { primary: '#16A34A', secondary: '#22C55E' },
  blue: { primary: '#1E40AF', secondary: '#3B82F6' },
  brown: { primary: '#78350F', secondary: '#A16207' },
  red: { primary: '#DC2626', secondary: '#EF4444' },
  black: { primary: '#18181B', secondary: '#3F3F46' },
};

// Wrestling (simplified ranking)
const WRESTLING_COLORS: Record<string, BeltColorDef> = {
  white: { primary: '#FFFFFF', secondary: '#E5E5E5' },
  grey: { primary: '#6B7280', secondary: '#9CA3AF' },
  blue: { primary: '#1E40AF', secondary: '#3B82F6' },
  red: { primary: '#DC2626', secondary: '#EF4444' },
  black: { primary: '#18181B', secondary: '#3F3F46' },
};

// Belt system configurations
const BELT_SYSTEMS: Record<BeltSystem, BeltSystemConfig> = {
  bjj: {
    hasGraduationBar: true,
    hasStripes: true,
    colors: BJJ_COLORS,
  },
  judo: {
    hasGraduationBar: false,
    hasStripes: false,
    colors: JUDO_COLORS,
  },
  karate: {
    hasGraduationBar: false,
    hasStripes: false,
    colors: KARATE_COLORS,
  },
  taekwondo: {
    hasGraduationBar: false,
    hasStripes: false,
    colors: TAEKWONDO_COLORS,
  },
  'muay-thai': {
    hasGraduationBar: false,
    hasStripes: false,
    colors: MUAY_THAI_COLORS,
  },
  wrestling: {
    hasGraduationBar: false,
    hasStripes: false,
    colors: WRESTLING_COLORS,
  },
  default: {
    hasGraduationBar: true,
    hasStripes: true,
    colors: BJJ_COLORS,
  },
};

// Helper to get belt system config
const getBeltSystem = (beltSystem: BeltSystem): BeltSystemConfig => {
  return BELT_SYSTEMS[beltSystem] || BELT_SYSTEMS.default;
};

// Helper to get belt color config
const getBeltConfig = (beltName: string | undefined, beltSystem: BeltSystem): BeltColorDef => {
  const system = getBeltSystem(beltSystem);
  if (!beltName) {
    return system.colors.white || { primary: '#FFFFFF', secondary: '#E5E5E5' };
  }
  const key = beltName.toLowerCase().replace(/\s+/g, '-');
  return system.colors[key] || system.colors.white || { primary: '#FFFFFF', secondary: '#E5E5E5' };
};

interface GraduationCardProps {
  graduation: Graduation;
  animate?: boolean;
}

interface BeltVisualProps {
  beltName: string;
  beltSystem: BeltSystem;
  stripes?: number;
  maxStripes?: number;
  showStripes?: boolean;
  size?: 'sm' | 'md' | 'lg';
  borderColor?: string;
}

// Reusable Belt Visual Component
const BeltVisual = ({
  beltName,
  beltSystem,
  stripes = 0,
  maxStripes = 4,
  showStripes = true,
  size = 'md',
  borderColor,
}: BeltVisualProps) => {
  const systemConfig = getBeltSystem(beltSystem);
  const colorConfig = getBeltConfig(beltName, beltSystem);

  // Size configurations
  const sizeConfig = {
    sm: { width: 40, height: 20, stripeHeight: 16, stripeWidth: 3 },
    md: { width: 64, height: 32, stripeHeight: 24, stripeWidth: 4 },
    lg: { width: 80, height: 40, stripeHeight: 32, stripeWidth: 5 },
  };
  const { width, height, stripeHeight, stripeWidth } = sizeConfig[size];

  const needsBorder =
    beltName.toLowerCase().includes('white') || beltName.toLowerCase() === 'white';

  const stripeSectionWidth = Math.max(maxStripes * (stripeWidth + 2) + 8, width * 0.3);

  // Whether to show graduation bar with stripes (BJJ style)
  const shouldShowGraduationBar =
    systemConfig.hasGraduationBar && systemConfig.hasStripes && showStripes;

  // Stripe section component (BJJ style - black bar with white stripes)
  const GraduationBar = () =>
    shouldShowGraduationBar ? (
      <View
        className="absolute flex-row items-center justify-center"
        style={{
          width: stripeSectionWidth,
          height: '100%',
          backgroundColor: '#18181B',
          gap: 2,
          left: (width - stripeSectionWidth) / 2,
        }}>
        {stripes > 0 &&
          Array.from({ length: stripes }).map((_, i) => (
            <View
              key={i}
              style={{
                width: stripeWidth,
                height: stripeHeight,
                backgroundColor: '#FFFFFF',
                borderRadius: 1,
              }}
            />
          ))}
      </View>
    ) : null;

  // Render multi-color belt (horizontal bands or vertical split)
  if (colorConfig.colors && colorConfig.colors.length > 1) {
    if (colorConfig.split) {
      // Vertical split (coral belts, poom belt)
      return (
        <View
          className="flex-row overflow-hidden rounded-xl"
          style={{
            width,
            height,
            borderWidth: needsBorder ? 1 : 0,
            borderColor: borderColor || '#D1D5DB',
          }}>
          {colorConfig.colors.map((color, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: color,
              }}
            />
          ))}
          <GraduationBar />
        </View>
      );
    } else {
      // Horizontal bands (kids belts, judo red-white)
      return (
        <View
          className="overflow-hidden rounded-xl"
          style={{
            width,
            height,
            borderWidth: needsBorder ? 1 : 0,
            borderColor: borderColor || '#D1D5DB',
          }}>
          {colorConfig.colors.map((color, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: color,
              }}
            />
          ))}
          <GraduationBar />
        </View>
      );
    }
  }

  // Single color belt
  return (
    <View
      className="overflow-hidden rounded-xl"
      style={{
        width,
        height,
        backgroundColor: colorConfig.primary,
        borderWidth: needsBorder ? 1 : 0,
        borderColor: borderColor || '#D1D5DB',
      }}>
      <GraduationBar />
    </View>
  );
};

export const GraduationCard = ({ graduation, animate = true }: GraduationCardProps) => {
  const t = useT();
  const colors = useThemeColors();
  const animationProgress = useRef(new Animated.Value(animate ? 0 : 1)).current;

  const {
    discipline,
    beltSystem = 'default',
    currentBelt,
    nextBelt,
    classesAttended = 0,
    classesRequired = 0,
    stripes,
    maxStripes,
    showProgress = true,
  } = graduation;

  // Get belt system config
  const systemConfig = getBeltSystem(beltSystem);

  // Determine if we're progressing toward next stripe or next belt
  // Only show stripe progress if the belt system supports stripes
  const isProgressingToStripe = systemConfig.hasStripes && stripes < maxStripes;
  const percentage = Math.min((classesAttended / classesRequired) * 100, 100);
  const beltColor = getBeltConfig(currentBelt, beltSystem);
  const nextBeltColor = getBeltConfig(nextBelt, beltSystem);

  // Progress bar color - use current belt color for stripe progress, next belt for belt progress
  const progressBarColor = isProgressingToStripe ? beltColor.primary : nextBeltColor.primary;

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
            {t(`graduation.belts.${currentBelt.toLowerCase().replace(/\s+/g, '-')}`)}
            {stripes > 0 && ` • ${stripes} ${stripes === 1 ? 'stripe' : 'stripes'}`}
          </ThemedText>
        </View>
        {/* Belt visualization */}
        <BeltVisual
          beltName={currentBelt}
          beltSystem={beltSystem}
          stripes={stripes}
          maxStripes={maxStripes}
          size="lg"
          borderColor={colors.border}
        />
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
                  {nextBelt && (
                    <View className="ml-2 mr-2">
                      <BeltVisual
                        beltName={nextBelt}
                        beltSystem={beltSystem}
                        showStripes={false}
                        size="sm"
                        borderColor={colors.border}
                      />
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
