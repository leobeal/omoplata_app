import { Platform, ViewStyle } from 'react-native';

interface ShadowProps {
  elevation?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffset?: {
    width: number;
    height: number;
  };
}

/**
 * Generate consistent shadow styles across the app
 * @param options - Shadow configuration options
 * @returns Shadow style object for React Native components
 */
export const getShadowStyle = (options?: ShadowProps): ViewStyle => {
  const {
    elevation = 5,
    shadowColor = '#000',
    shadowOpacity = 0.1,
    shadowRadius = 3.84,
    shadowOffset = {
      width: 0,
      height: 2,
    },
  } = options || {};

  // iOS shadows
  const iosShadow: ViewStyle = {
    shadowColor,
    shadowOpacity,
    shadowRadius,
    shadowOffset,
  };

  // Android elevation
  const androidShadow: ViewStyle = {
    elevation,
  };

  // Return platform-specific shadow styles
  return Platform.OS === 'ios' ? iosShadow : { ...iosShadow, ...androidShadow };
};

/**
 * Preset shadow styles for common use cases
 */
export const shadowPresets = {
  small: getShadowStyle({
    elevation: 3,
    shadowRadius: 2.5,
    shadowOffset: { width: 0, height: 1 },
  }),

  medium: getShadowStyle({
    elevation: 8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  }),

  large: getShadowStyle({
    elevation: 15,
    shadowRadius: 10.84,
    shadowOffset: { width: 0, height: 10 },
  }),

  card: getShadowStyle({
    elevation: 4,
    shadowRadius: 3.84,
    shadowOffset: { width: 0, height: 2 },
  }),
};

// Keep legacy export name for backwards compatibility
export const useShadow = getShadowStyle;

export default getShadowStyle;
