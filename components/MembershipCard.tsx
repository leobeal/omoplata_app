import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

import QRCodeDisplay from './QRCodeDisplay';
import ThemedText from './ThemedText';

import { WalletPassData, getStatusColor, formatCardDate } from '@/api/wallet';
import { useTranslation } from '@/contexts/LocalizationContext';

// Convert snake_case status to camelCase for translation keys
const statusToTranslationKey = (status: string): string => {
  return status.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

interface MembershipCardProps {
  data: WalletPassData;
  showQR?: boolean;
  compact?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48; // 24px padding on each side
const CARD_ASPECT_RATIO = 1.586; // Standard credit card ratio
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

const MembershipCard = forwardRef<View, MembershipCardProps>(
  ({ data, showQR = true, compact = false }, ref) => {
    const { t, locale } = useTranslation();
    const statusColor = getStatusColor(data.membershipStatus);

    const cardHeight = compact ? CARD_HEIGHT * 0.7 : CARD_HEIGHT + (showQR ? 160 : 0);

    return (
      <View ref={ref} collapsable={false}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { height: cardHeight }]}>
          {/* Header - Gym Name and Status */}
          <View style={styles.header}>
            <View style={styles.gymInfo}>
              <ThemedText style={styles.gymName}>{data.gymName}</ThemedText>
              <ThemedText style={styles.membershipLabel}>{t('wallet.membershipCard')}</ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <ThemedText style={[styles.statusText, { color: statusColor.text }]}>
                {t(`membership.${statusToTranslationKey(data.membershipStatus)}`)}
              </ThemedText>
            </View>
          </View>

          {/* Member Info */}
          <View style={styles.memberSection}>
            {data.memberPhoto ? (
              <Image source={{ uri: data.memberPhoto }} style={styles.memberPhoto} />
            ) : (
              <View style={styles.memberPhotoPlaceholder}>
                <ThemedText style={styles.memberInitials}>
                  {data.memberName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </ThemedText>
              </View>
            )}
            <View style={styles.memberDetails}>
              <ThemedText style={styles.memberName}>{data.memberName}</ThemedText>
              <ThemedText style={styles.planName}>{data.planName}</ThemedText>
            </View>
          </View>

          {/* Card Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailColumn}>
              <ThemedText style={styles.detailLabel}>{t('wallet.memberId')}</ThemedText>
              <ThemedText style={styles.detailValue}>{data.memberNumber}</ThemedText>
            </View>
            <View style={styles.detailColumn}>
              <ThemedText style={styles.detailLabel}>{t('wallet.validUntil')}</ThemedText>
              <ThemedText style={styles.detailValue}>
                {data.validUntil ? formatCardDate(data.validUntil, locale) : '—'}
              </ThemedText>
            </View>
          </View>

          {/* Decorative elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />

          {/* QR Code Section */}
          {showQR && !compact && (
            <View style={styles.qrSection}>
              <View style={styles.qrDivider} />
              <QRCodeDisplay
                value={data.qrCodeData}
                size={120}
                backgroundColor="#FFFFFF"
                color="#1a1a2e"
                style={styles.qrCode}
              />
            </View>
          )}
        </LinearGradient>
      </View>
    );
  }
);

MembershipCard.displayName = 'MembershipCard';

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  membershipLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  memberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  memberPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  memberPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  memberInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberDetails: {
    marginLeft: 16,
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  planName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  qrSection: {
    marginTop: 20,
    paddingBottom: 8,
    alignItems: 'center',
  },
  qrDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  qrCode: {
    borderRadius: 8,
    padding: 12,
  },
});

export default MembershipCard;
