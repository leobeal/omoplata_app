import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  ScrollView,
} from 'react-native';

import Icon from '@/components/Icon';
import { useCheckinResult, CheckinResult } from '@/contexts/CheckinSuccessContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

const ERROR_DRAWER_HEIGHT = 300;
const BASE_DRAWER_HEIGHT = 420;
const TALL_DRAWER_HEIGHT = 560;

// Helper to format class time range
function formatClassTimeRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt.replace(' ', 'T'));
  const end = new Date(endsAt.replace(' ', 'T'));
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${formatTime(start)} - ${formatTime(end)}`;
}

// Helper to format time
function formatTime(dateString: string): string {
  const normalized = dateString.replace(' ', 'T');
  const date = new Date(normalized);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Helper to format venue string
function formatVenueString(
  venue: { name: string; facility: { name: string } | null } | null,
  t: (key: string, params?: Record<string, string | number>) => string
): string | null {
  if (!venue) return null;
  const venueName = venue.name;
  const facilityName = venue.facility?.name;
  if (venueName && facilityName) {
    return t('checkin.atVenueAndFacility', { venue: venueName, facility: facilityName });
  }
  if (venueName) return venueName;
  return null;
}

function getDrawerHeight(result: CheckinResult | null): number {
  if (!result) return BASE_DRAWER_HEIGHT;
  if (result.type === 'error') {
    return ERROR_DRAWER_HEIGHT;
  }
  if (result.type === 'no_classes') {
    const hasAlternatives = (result.noClassesData?.alternatives?.length ?? 0) > 0;
    const hasUpcoming = (result.noClassesData?.upcomingHere?.length ?? 0) > 0;
    if (hasAlternatives || hasUpcoming) return TALL_DRAWER_HEIGHT;
  }
  return BASE_DRAWER_HEIGHT;
}

export default function CheckinResultDrawer() {
  const colors = useThemeColors();
  const t = useT();
  const { result, hide } = useCheckinResult();

  const drawerHeight = getDrawerHeight(result);
  const translateY = useRef(new Animated.Value(drawerHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const visible = !!result;

  useEffect(() => {
    if (visible) {
      translateY.setValue(drawerHeight);
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
  }, [visible, drawerHeight]);

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: drawerHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hide();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
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

  if (!visible || !result) return null;

  const renderSuccessContent = () => {
    const data = result.data!;
    const venueStr = formatVenueString(data.venue, t);

    return (
      <>
        {/* Success Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: '#10B98115' }]}>
            <Icon name="CheckCircle" size={32} color="#10B981" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('checkin.checkInSuccess')}
            </Text>
            {venueStr && <Text style={[styles.subtitle, { color: colors.text }]}>{venueStr}</Text>}
          </View>
        </View>

        {/* Greeting */}
        {data.greeting && (
          <Text style={[styles.greeting, { color: colors.text }]}>{data.greeting}</Text>
        )}

        {/* Class Info */}
        {data.class && (
          <View style={[styles.classCard, { backgroundColor: colors.secondary }]}>
            <Icon name="Calendar" size={18} color={colors.highlight} />
            <View style={styles.classInfo}>
              <Text style={[styles.className, { color: colors.text }]}>{data.class.name}</Text>
              <Text style={[styles.classTime, { color: colors.text }]}>
                {formatClassTimeRange(data.class.startsAt, data.class.endsAt)}
              </Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.highlight }]}>
              {data.todayVisitNumber}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>{t('checkin.today')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.highlight }]}>{data.weeklyVisits}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>{t('checkin.thisWeek')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.highlight }]}>
              {data.monthlyVisits}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>{t('checkin.thisMonth')}</Text>
          </View>
        </View>

        {/* Done Button */}
        <Pressable
          onPress={closeDrawer}
          style={[styles.primaryButton, { backgroundColor: colors.highlight }]}>
          <Text style={styles.primaryButtonText}>{t('common.done')}</Text>
        </Pressable>
      </>
    );
  };

  const renderNoClassesContent = () => {
    const data = result.noClassesData!;
    const venueStr = formatVenueString(data.venue, t);
    const nextClass = data.upcomingHere?.[0];
    const alternatives = data.alternatives?.filter((alt) => alt.sameVenue) || [];

    return (
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* No Classes Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: `${colors.highlight}15` }]}>
            <Icon name="Calendar" size={32} color={colors.highlight} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('checkin.noClassesTitle')}
            </Text>
            {venueStr && <Text style={[styles.subtitle, { color: colors.text }]}>{venueStr}</Text>}
          </View>
        </View>

        {/* Next class here */}
        {nextClass && (
          <View style={[styles.classCard, { backgroundColor: colors.secondary }]}>
            <Icon name="Clock" size={18} color={colors.highlight} />
            <View style={styles.classInfo}>
              <Text style={[styles.classCardLabel, { color: colors.text }]}>
                {t('checkin.nextClassHere')}
              </Text>
              <Text style={[styles.className, { color: colors.text }]}>{nextClass.className}</Text>
              <Text style={[styles.classTime, { color: colors.text }]}>
                {t('checkin.startsAt', { time: formatTime(nextClass.startsAt) })}
              </Text>
            </View>
          </View>
        )}

        {/* Alternative facilities */}
        {alternatives.length > 0 && (
          <View style={styles.alternativesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('checkin.classesElsewhere')}
            </Text>
            {alternatives.map((alt, index) => (
              <Pressable
                key={index}
                style={[styles.alternativeCard, { backgroundColor: colors.secondary }]}>
                <View style={styles.alternativeInfo}>
                  <Text style={[styles.alternativeName, { color: colors.text }]}>
                    {alt.facility || alt.venue}
                  </Text>
                  {alt.className && (
                    <Text style={[styles.alternativeDetail, { color: colors.text }]}>
                      {alt.className} · {formatTime(alt.nextClassAt)}
                    </Text>
                  )}
                </View>
                <Icon name="ChevronRight" size={16} color={colors.highlight} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Done Button */}
        <Pressable
          onPress={closeDrawer}
          style={[styles.primaryButton, { backgroundColor: colors.highlight, marginTop: 16 }]}>
          <Text style={styles.primaryButtonText}>{t('common.done')}</Text>
        </Pressable>
      </ScrollView>
    );
  };

  const renderErrorContent = () => {
    const errorMessage = result.errorMessage || t('checkin.checkInFailed');

    return (
      <>
        {/* Error Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: '#EF444415' }]}>
            <Icon name="AlertCircle" size={32} color="#EF4444" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>{t('checkin.checkInFailed')}</Text>
          </View>
        </View>

        {/* Error Message */}
        <Text style={[styles.errorMessage, { color: colors.text }]}>{errorMessage}</Text>

        {/* Help Card */}
        <View style={[styles.helpCard, { backgroundColor: colors.secondary }]}>
          <Icon name="HelpCircle" size={20} color={colors.text} />
          <Text style={[styles.helpText, { color: colors.text }]}>{t('checkin.errorHelp')}</Text>
        </View>

        {/* Done Button */}
        <Pressable
          onPress={closeDrawer}
          style={[styles.primaryButton, { backgroundColor: colors.highlight }]}>
          <Text style={styles.primaryButtonText}>{t('common.done')}</Text>
        </Pressable>
      </>
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="auto">
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.drawer,
          {
            backgroundColor: colors.bg,
            height: drawerHeight,
            transform: [{ translateY }],
          },
        ]}>
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Close Button */}
        <Pressable onPress={closeDrawer} style={styles.closeButton}>
          <Icon name="X" size={24} color={colors.text} />
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          {result.type === 'success' && renderSuccessContent()}
          {result.type === 'no_classes' && renderNoClassesContent()}
          {result.type === 'error' && renderErrorContent()}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  greeting: {
    fontSize: 15,
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 22,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  classInfo: {
    flex: 1,
  },
  classCardLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  className: {
    fontSize: 15,
    fontWeight: '500',
  },
  classTime: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    opacity: 0.3,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  alternativesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    opacity: 0.7,
  },
  alternativeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  alternativeInfo: {
    flex: 1,
  },
  alternativeName: {
    fontSize: 15,
    fontWeight: '500',
  },
  alternativeDetail: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  errorMessage: {
    fontSize: 15,
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 22,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
});
