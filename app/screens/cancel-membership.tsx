import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Alert, TextInput } from 'react-native';

import {
  getMembership,
  cancelMembership,
  revertCancellation,
  Membership as MembershipType,
  getPrimaryMember,
  formatCurrency,
} from '@/api/membership';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import Section from '@/components/Section';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useMembershipSettings } from '@/contexts/AppConfigContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';
import { clearMembershipCache } from '@/utils/local-cache';

export default function CancelMembershipScreen() {
  const router = useRouter();
  const t = useT();
  const colors = useThemeColors();
  const membershipSettings = useMembershipSettings();
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [cancellationDate, setCancellationDate] = useState<string>('');
  const [reason, setReason] = useState('');

  // Check if membership is already cancelled (endsAt is set and in the future)
  const isCancelled = membership?.endsAt !== null && membership?.endsAt !== undefined;
  const cancellationEndDate = membership?.endsAt;
  const canRevertCancellation =
    isCancelled && cancellationEndDate && new Date(cancellationEndDate) > new Date();

  // Get earliest cancellation date from backend (cancellableAt)
  const getEarliestCancellationDate = useCallback(
    (data: MembershipType | null) => {
      // Use backend-provided cancellableAt if available
      if (data?.cancellableAt) {
        return data.cancellableAt.split('T')[0];
      }
      // Fallback: today + notice period (should not happen if backend provides cancellableAt)
      const noticeDays = membershipSettings.cancellationNoticeDays || 30;
      const date = new Date();
      date.setDate(date.getDate() + noticeDays);
      return date.toISOString().split('T')[0];
    },
    [membershipSettings.cancellationNoticeDays]
  );

  useEffect(() => {
    loadMembership();
  }, []);

  const loadMembership = async (skipCache = false) => {
    try {
      if (skipCache) {
        await clearMembershipCache();
      }
      const data = await getMembership();
      setMembership(data);
      // Use cancellableAt from backend as the earliest cancellation date
      if (data && !data.endsAt) {
        const earliestDate = getEarliestCancellationDate(data);
        setCancellationDate(earliestDate);
      }
    } catch (error) {
      console.error('Error loading membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleCancel = async () => {
    if (!membership) return;

    Alert.alert(
      t('membership.confirmCancellation'),
      t('membership.confirmCancellationMessage', { date: formatDate(cancellationDate) }),
      [
        { text: t('membership.keepMembership'), style: 'cancel' },
        {
          text: t('membership.yesCancelMembership'),
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelMembership(membership.id, cancellationDate, reason || undefined);
              // Refresh membership data to get updated endsAt
              await loadMembership(true);
            } catch (error) {
              console.error('Error cancelling membership:', error);
              Alert.alert(
                t('common.error'),
                error instanceof Error ? error.message : t('membership.cancellationError')
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleRevertCancellation = async () => {
    if (!membership) return;

    Alert.alert(t('membership.confirmRevert'), t('membership.confirmRevertMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('membership.yesRevert'),
        onPress: async () => {
          setReverting(true);
          try {
            await revertCancellation(membership.id);
            // Refresh membership data
            await loadMembership(true);
            Alert.alert(t('membership.revertSuccess'), t('membership.revertSuccessMessage'));
          } catch (error) {
            console.error('Error reverting cancellation:', error);
            Alert.alert(
              t('common.error'),
              error instanceof Error ? error.message : t('membership.revertError')
            );
          } finally {
            setReverting(false);
          }
        },
      },
    ]);
  };

  const primaryMember = membership ? getPrimaryMember(membership) : null;
  const earliestDate = getEarliestCancellationDate(membership);

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title={t('membership.cancelMembership')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (!membership) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title={t('membership.cancelMembership')} />
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="UserX" size={64} className="mb-4 opacity-30" />
          <ThemedText className="text-center text-lg">{t('membership.noMembership')}</ThemedText>
        </View>
      </View>
    );
  }

  // Already cancelled - show revert option
  if (isCancelled && cancellationEndDate) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title={t('membership.cancelMembership')} />
        <ThemedScroller className="px-6 pt-4">
          {/* Cancelled Status Card */}
          <View className="mb-6 rounded-2xl bg-amber-500/10 p-6">
            <View className="mb-4 flex-row items-center">
              <Icon name="AlertCircle" size={24} color="#F59E0B" className="mr-3" />
              <ThemedText className="flex-1 text-lg font-bold" style={{ color: '#F59E0B' }}>
                {t('membership.alreadyCancelled')}
              </ThemedText>
            </View>
            <ThemedText className="opacity-70">
              {t('membership.membershipEndsOn', { date: formatDate(cancellationEndDate) })}
            </ThemedText>
          </View>

          {/* Current Plan */}
          <Section title={t('membership.currentPlan')} className="mb-4" />
          <View className="mb-6 rounded-2xl bg-secondary p-5">
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-70">{t('membership.planName')}</ThemedText>
              <ThemedText className="font-semibold">{membership.plan.name}</ThemedText>
            </View>
            {primaryMember && (
              <View className="mb-3 flex-row justify-between">
                <ThemedText className="opacity-70">{t('membership.memberId')}</ThemedText>
                <ThemedText className="font-semibold">{primaryMember.prefixedId}</ThemedText>
              </View>
            )}
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-70">{t('membership.amount')}</ThemedText>
              <ThemedText className="font-semibold">
                {formatCurrency(membership.amount, membership.currency)}
              </ThemedText>
            </View>
            <View className="flex-row justify-between">
              <ThemedText className="opacity-70">{t('membership.endDate')}</ThemedText>
              <ThemedText className="font-semibold" style={{ color: '#EF4444' }}>
                {formatDate(cancellationEndDate)}
              </ThemedText>
            </View>
          </View>

          {/* Revert Option */}
          {canRevertCancellation && (
            <>
              <Section title={t('membership.changeYourMind')} className="mb-4" />
              <View className="mb-6 rounded-2xl bg-secondary p-5">
                <ThemedText className="mb-4 text-sm opacity-70">
                  {t('membership.revertDescription')}
                </ThemedText>
                <Button
                  title={t('membership.revertCancellation')}
                  icon="RotateCcw"
                  variant="solid"
                  onPress={handleRevertCancellation}
                  loading={reverting}
                  disabled={reverting}
                />
              </View>
            </>
          )}

          {/* Back Button */}
          <View className="mb-4">
            <Button
              title={t('common.back')}
              variant="outline"
              onPress={() => router.back()}
              disabled={reverting}
            />
          </View>

          {/* Support */}
          <View className="mb-8">
            <ThemedText className="text-center text-xs opacity-50">
              {t('membership.supportMessage')}
            </ThemedText>
          </View>
        </ThemedScroller>
      </View>
    );
  }

  // Not cancelled yet - show cancellation form
  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title={t('membership.cancelMembership')} showTitle />
      <ThemedScroller className="px-6 pt-4">
        {/* Warning Card */}
        <View className="mb-6 rounded-2xl bg-red-500/10 p-6">
          <View className="mb-4 flex-row items-center">
            <Icon name="AlertTriangle" size={24} color="#EF4444" className="mr-3" />
            <ThemedText className="flex-1 text-lg font-bold" style={{ color: '#EF4444' }}>
              {t('membership.importantInformation')}
            </ThemedText>
          </View>
          <ThemedText className="mb-2 opacity-70">{t('membership.cancellationWarning')}</ThemedText>
          <ThemedText className="opacity-70">{t('membership.cancellationReversible')}</ThemedText>
        </View>

        {/* Current Plan */}
        <Section title={t('membership.currentPlan')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-3 flex-row justify-between">
            <ThemedText className="opacity-70">{t('membership.planName')}</ThemedText>
            <ThemedText className="font-semibold">{membership.plan.name}</ThemedText>
          </View>
          {primaryMember && (
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-70">{t('membership.memberId')}</ThemedText>
              <ThemedText className="font-semibold">{primaryMember.prefixedId}</ThemedText>
            </View>
          )}
          <View className="mb-3 flex-row justify-between">
            <ThemedText className="opacity-70">{t('membership.amount')}</ThemedText>
            <ThemedText className="font-semibold">
              {formatCurrency(membership.amount, membership.currency)}
            </ThemedText>
          </View>
          {membership.endsAt && (
            <View className="flex-row justify-between">
              <ThemedText className="opacity-70">{t('membership.endDate')}</ThemedText>
              <ThemedText className="font-semibold">{formatDate(membership.endsAt)}</ThemedText>
            </View>
          )}
        </View>

        {/* Cancellation Details */}
        <Section title={t('membership.cancellationDetails')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4">
            <View className="mb-2 flex-row items-center">
              <Icon name="Calendar" size={16} className="mr-2 opacity-50" />
              <ThemedText className="font-semibold">
                {t('membership.effectiveCancellationDate')}
              </ThemedText>
            </View>
            <ThemedText className="text-sm opacity-70">
              {t('membership.membershipCancelledOn', { date: formatDate(cancellationDate) })}
            </ThemedText>
            <View className="mt-3 rounded-lg bg-background p-3">
              <ThemedText className="text-xs opacity-50">
                {t('membership.earliestCancellationDate', { date: formatDate(earliestDate) })}
              </ThemedText>
            </View>
          </View>

          {membershipSettings.cancellationNoticeDays && (
            <View className="border-t border-border pt-4">
              <View className="mb-2 flex-row items-center">
                <Icon name="Clock" size={16} className="mr-2 opacity-50" />
                <ThemedText className="font-semibold">{t('membership.noticePeriod')}</ThemedText>
              </View>
              <ThemedText className="text-sm opacity-70">
                {t('membership.daysNoticeRequired', {
                  count: membershipSettings.cancellationNoticeDays,
                })}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Cancellation Reason */}
        <Section title={t('membership.cancellationReason')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <TextInput
            className="min-h-[100px] rounded-lg bg-background p-4 text-base"
            style={{ color: colors.text }}
            placeholder={t('membership.cancellationReasonPlaceholder')}
            placeholderTextColor={colors.subtext}
            value={reason}
            onChangeText={setReason}
            multiline
            textAlignVertical="top"
          />
          <ThemedText className="mt-2 text-xs opacity-50">
            {t('membership.cancellationReasonOptional')}
          </ThemedText>
        </View>

        {/* Cancellation Policy */}
        <Section title={t('membership.cancellationPolicy')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <ThemedText className="text-sm opacity-70">
            {membershipSettings.cancellationNoticeDays
              ? t('membership.daysNoticeRequired', {
                  count: membershipSettings.cancellationNoticeDays,
                })
              : t('membership.defaultCancellationPolicy')}
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View className="mb-4">
          <Button
            title={t('membership.cancelMyMembership')}
            icon="XCircle"
            variant="solid"
            onPress={handleCancel}
            loading={cancelling}
            disabled={cancelling}
            className="mb-3 bg-red-500"
          />
          <Button
            title={t('membership.keepMembership')}
            variant="outline"
            onPress={() => router.back()}
            disabled={cancelling}
          />
        </View>

        {/* Support */}
        <View className="mb-8">
          <ThemedText className="text-center text-xs opacity-50">
            {t('membership.supportMessage')}
          </ThemedText>
        </View>
      </ThemedScroller>
    </View>
  );
}
