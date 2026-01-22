import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, PanResponder } from 'react-native';

import Icon from '@/components/Icon';
import { useCheckinSuccess } from '@/contexts/CheckinSuccessContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

const DRAWER_HEIGHT = 420;

// Helper to format class time range
function formatClassTimeRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt.replace(' ', 'T'));
  const end = new Date(endsAt.replace(' ', 'T'));
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${formatTime(start)} - ${formatTime(end)}`;
}

// Helper to format location string with venue and facility
function formatLocationString(
  location: { venue?: string | null; facility?: string | null },
  t: (key: string, params?: Record<string, string | number>) => string
): string | null {
  const { venue, facility } = location;
  if (venue && facility) {
    return t('checkin.atVenueAndFacility', { venue, facility });
  }
  if (venue) {
    return venue;
  }
  if (facility) {
    return facility;
  }
  return null;
}

export default function CheckinSuccessDrawer() {
  const colors = useThemeColors();
  const t = useT();
  const { successData, hideSuccess } = useCheckinSuccess();

  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const visible = !!successData;
  const locationStr = successData?.location ? formatLocationString(successData.location, t) : null;

  useEffect(() => {
    if (visible) {
      // Reset values first
      translateY.setValue(DRAWER_HEIGHT);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: DRAWER_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideSuccess();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeDrawer();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible || !successData) return null;

  return (
    <View style={styles.drawerContainer} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.drawerBackdrop, { opacity: backdropOpacity }]}
        pointerEvents="auto">
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.drawer,
          {
            backgroundColor: colors.bg,
            transform: [{ translateY }],
          },
        ]}>
        {/* Handle */}
        <View style={styles.drawerHandleContainer}>
          <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />
        </View>

        {/* Close Button */}
        <Pressable onPress={closeDrawer} style={styles.drawerCloseButton}>
          <Icon name="X" size={24} color={colors.text} />
        </Pressable>

        {/* Content */}
        <View style={styles.drawerContent}>
          {/* Success Header */}
          <View style={styles.drawerSuccessHeader}>
            <View style={[styles.successIconCircle, { backgroundColor: '#10B98115' }]}>
              <Icon name="CheckCircle" size={32} color="#10B981" />
            </View>
            <View style={styles.successHeaderText}>
              <Text style={[styles.drawerTitle, { color: colors.text }]}>
                {t('checkin.checkInSuccess')}
              </Text>
              {locationStr && (
                <Text style={[styles.drawerSubtitle, { color: colors.text }]}>{locationStr}</Text>
              )}
            </View>
          </View>

          {/* Greeting */}
          {successData.greeting && (
            <Text style={[styles.drawerGreeting, { color: colors.text }]}>
              {successData.greeting}
            </Text>
          )}

          {/* Class Info */}
          {successData.class && (
            <View style={[styles.drawerClassCard, { backgroundColor: colors.secondary }]}>
              <Icon name="Calendar" size={18} color={colors.highlight} />
              <View style={styles.drawerClassInfo}>
                <Text style={[styles.drawerClassName, { color: colors.text }]}>
                  {successData.class.name}
                </Text>
                <Text style={[styles.drawerClassTime, { color: colors.text }]}>
                  {formatClassTimeRange(successData.class.startsAt, successData.class.endsAt)}
                </Text>
              </View>
            </View>
          )}

          {/* Stats */}
          <View style={styles.drawerStats}>
            <View style={styles.drawerStatItem}>
              <Text style={[styles.drawerStatValue, { color: colors.highlight }]}>
                {successData.todayVisitNumber}
              </Text>
              <Text style={[styles.drawerStatLabel, { color: colors.text }]}>
                {t('checkin.today')}
              </Text>
            </View>
            <View style={[styles.drawerStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.drawerStatItem}>
              <Text style={[styles.drawerStatValue, { color: colors.highlight }]}>
                {successData.weeklyVisits}
              </Text>
              <Text style={[styles.drawerStatLabel, { color: colors.text }]}>
                {t('checkin.thisWeek')}
              </Text>
            </View>
            <View style={[styles.drawerStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.drawerStatItem}>
              <Text style={[styles.drawerStatValue, { color: colors.highlight }]}>
                {successData.monthlyVisits}
              </Text>
              <Text style={[styles.drawerStatLabel, { color: colors.text }]}>
                {t('checkin.thisMonth')}
              </Text>
            </View>
          </View>

          {/* Done Button */}
          <Pressable
            onPress={closeDrawer}
            style={[styles.drawerDoneButton, { backgroundColor: colors.highlight }]}>
            <Text style={styles.drawerDoneButtonText}>{t('common.done')}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  drawerCloseButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  drawerSuccessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  drawerSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  drawerGreeting: {
    fontSize: 15,
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 22,
  },
  drawerClassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  drawerClassInfo: {
    flex: 1,
  },
  drawerClassName: {
    fontSize: 15,
    fontWeight: '500',
  },
  drawerClassTime: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  drawerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 20,
  },
  drawerStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  drawerStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  drawerStatLabel: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  drawerStatDivider: {
    width: 1,
    height: 32,
    opacity: 0.3,
  },
  drawerDoneButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  drawerDoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
