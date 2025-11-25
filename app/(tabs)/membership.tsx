import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, RefreshControl } from 'react-native';

import {
  getMembership,
  downloadContract,
  Membership as MembershipType,
  getPrimaryMember,
  getMonthlyEquivalent,
  formatCurrency,
} from '@/api/membership';
import { getPaymentMethod, PaymentMethod } from '@/api/payment-methods';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import Section from '@/components/Section';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useMembershipSettings, useFeatureFlags } from '@/contexts/AppConfigContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function MembershipScreen() {
  const t = useT();
  const colors = useThemeColors();
  const router = useRouter();
  const membershipSettings = useMembershipSettings();
  const featureFlags = useFeatureFlags();
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [membershipData, paymentData] = await Promise.all([
        getMembership(),
        getPaymentMethod(),
      ]);
      setMembership(membershipData);
      setPaymentMethod(paymentData);
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

  const handleDownloadContract = async () => {
    if (!membership) return;

    setDownloadingPdf(true);
    try {
      const pdfUrl = await downloadContract(membership.id);
      // In a real app, this would open the PDF or download it
      Alert.alert(
        t('membership.contractPdfTitle'),
        t('membership.contractDownloadMessage', { url: pdfUrl }),
        [{ text: t('common.confirm'), style: 'default' }]
      );
    } catch (error) {
      console.error('Error downloading contract:', error);
      Alert.alert(t('common.error'), t('membership.downloadError'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'suspended':
      case 'pending':
        return '#F59E0B';
      case 'expired':
      case 'cancelled':
        return '#EF4444';
      default:
        return colors.text;
    }
  };

  const getBillingCycleLabel = (chargeInterval: string) => {
    switch (chargeInterval) {
      case 'yearly':
        return t('membership.billedAnnually');
      case 'monthly':
        return t('membership.billedMonthly');
      case 'weekly':
        return t('membership.billedWeekly');
      default:
        return chargeInterval;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header title={t('membership.title')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" testID="activity-indicator" />
        </View>
      </View>
    );
  }

  if (!membership) {
    return (
      <View className="flex-1 bg-background">
        <Header title={t('membership.title')} />
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="UserX" size={64} className="mb-4 opacity-30" />
          <ThemedText className="text-center text-lg">{t('membership.noMembership')}</ThemedText>
        </View>
      </View>
    );
  }

  const primaryMember = getPrimaryMember(membership);
  const monthlyEquivalent = getMonthlyEquivalent(membership.plan);

  return (
    <View className="flex-1 bg-background">
      <Header title={t('membership.title')} />
      <ThemedScroller
        className="px-6 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF', colors.highlight]}
            progressBackgroundColor={colors.bg}
          />
        }>
        {/* Current Plan Card */}
        <View className="mb-6 rounded-2xl bg-secondary p-6">
          <View className="mb-4 flex-row items-start justify-between">
            <View className="flex-1">
              <ThemedText className="mb-1 text-sm opacity-50">
                {t('membership.currentPlan')}
              </ThemedText>
              <ThemedText className="text-3xl font-bold">{membership.plan.name}</ThemedText>
              <View className="mt-2 flex-row items-center">
                <View
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: `${getStatusColor(membership.status)}20` }}>
                  <ThemedText
                    className="text-xs font-semibold capitalize"
                    style={{ color: getStatusColor(membership.status) }}>
                    {t(`membership.${membership.status}`)}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-highlight">
              <Icon name="Award" size={32} color="white" />
            </View>
          </View>

          <View className="border-t border-border pt-4">
            {primaryMember && (
              <View className="mb-3 flex-row justify-between">
                <ThemedText className="opacity-50">{t('membership.memberId')}</ThemedText>
                <ThemedText className="font-semibold">{primaryMember.prefixedId}</ThemedText>
              </View>
            )}
            <View className="flex-row justify-between">
              <ThemedText className="opacity-50">{t('membership.membershipId')}</ThemedText>
              <ThemedText className="font-semibold">{membership.id}</ThemedText>
            </View>
          </View>
        </View>

        {/* Members (if more than one) */}
        {membership.members.length > 1 && (
          <>
            <Section title={t('membership.members')} className="mb-4" />
            <View className="mb-6 rounded-2xl bg-secondary">
              {membership.members.map((member, index) => (
                <View
                  key={member.id}
                  className={`flex-row items-center justify-between p-5 ${
                    index < membership.members.length - 1 ? 'border-b border-border' : ''
                  }`}>
                  <View className="flex-row items-center">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-background">
                      <Icon name="User" size={18} />
                    </View>
                    <View>
                      <ThemedText className="font-semibold">{member.fullName}</ThemedText>
                      <ThemedText className="text-xs capitalize opacity-50">
                        {member.role}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText className="text-sm opacity-50">{member.prefixedId}</ThemedText>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Contract Details */}
        <Section title={t('membership.contractDetails')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary">
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">{t('membership.startDate')}</ThemedText>
            <ThemedText className="font-semibold">{formatDate(membership.startsAt)}</ThemedText>
          </View>
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">{t('membership.endDate')}</ThemedText>
            <ThemedText className="font-semibold">{formatDate(membership.endsAt)}</ThemedText>
          </View>
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">{t('membership.renewalDate')}</ThemedText>
            <ThemedText className="font-semibold">{formatDate(membership.renewsAt)}</ThemedText>
          </View>
          <View className="flex-row items-center justify-between p-5">
            <ThemedText className="opacity-70">{t('membership.autoRenewal')}</ThemedText>
            <View className="flex-row items-center">
              <Icon
                name={membership.renewsAutomatically ? 'Check' : 'X'}
                size={16}
                color={membership.renewsAutomatically ? '#10B981' : '#EF4444'}
                className="mr-2"
              />
              <ThemedText
                className="font-semibold"
                style={{
                  color: membership.renewsAutomatically ? '#10B981' : '#EF4444',
                }}>
                {membership.renewsAutomatically
                  ? t('membership.enabled')
                  : t('membership.disabled')}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <Section title={t('membership.pricing')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <ThemedText className="text-sm opacity-50">
                {membership.plan.chargeInterval === 'yearly'
                  ? t('membership.annualFee')
                  : t('membership.monthlyFee')}
              </ThemedText>
              <ThemedText className="text-3xl font-bold">
                {formatCurrency(membership.plan.amount, membership.plan.currency)}
              </ThemedText>
            </View>
            {membership.plan.chargeInterval === 'yearly' && (
              <View className="items-end">
                <ThemedText className="text-sm opacity-50">
                  {t('membership.monthlyEquivalent')}
                </ThemedText>
                <ThemedText className="text-lg font-semibold">
                  {formatCurrency(monthlyEquivalent, membership.plan.currency)}
                  {t('membership.perMonth')}
                </ThemedText>
              </View>
            )}
          </View>
          <View className="border-t border-border pt-4">
            <ThemedText className="text-sm opacity-70">
              {getBillingCycleLabel(membership.plan.chargeInterval)}
            </ThemedText>
          </View>
        </View>

        {/* Payment Method */}
        {paymentMethod && (
          <>
            <Section title={t('membership.paymentMethod')} className="mb-4" />
            <View className="mb-6 rounded-2xl bg-secondary p-5">
              <View className="flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-background">
                  <Icon name="Building" size={20} />
                </View>
                <View className="flex-1">
                  <ThemedText className="font-semibold">{paymentMethod.type}</ThemedText>
                  <ThemedText className="text-sm opacity-50">{paymentMethod.maskedIban}</ThemedText>
                  <ThemedText className="mt-1 text-xs opacity-50">
                    {paymentMethod.accountHolder}
                  </ThemedText>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Policies */}
        <Section title={t('membership.policies')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4">
            <View className="mb-2 flex-row items-start">
              <Icon name="XCircle" size={16} className="mr-2 mt-1 opacity-50" />
              <View className="flex-1">
                <ThemedText className="font-semibold">
                  {t('membership.cancellationPolicy')}
                </ThemedText>
                <ThemedText className="mt-1 text-sm opacity-70">
                  {membershipSettings.cancellationNoticeDays
                    ? t('membership.daysNoticeRequired', {
                        count: membershipSettings.cancellationNoticeDays,
                      })
                    : t('membership.defaultCancellationPolicy')}
                </ThemedText>
              </View>
            </View>
          </View>
          {membershipSettings.allowFreeze && (
            <View className="mb-4 border-t border-border pt-4">
              <View className="mb-2 flex-row items-start">
                <Icon name="Pause" size={16} className="mr-2 mt-1 opacity-50" />
                <View className="flex-1">
                  <ThemedText className="font-semibold">{t('membership.freezePolicy')}</ThemedText>
                  <ThemedText className="mt-1 text-sm opacity-70">
                    {membershipSettings.maxFreezeDaysPerYear
                      ? `${t('membership.upTo')} ${t('membership.daysPerYear', {
                          count: membershipSettings.maxFreezeDaysPerYear,
                        })}`
                      : t('membership.defaultFreezePolicy')}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
          <View
            className={`${membershipSettings.allowFreeze ? 'border-t border-border pt-4' : ''}`}>
            <View className="flex-row items-start">
              <Icon name="UserX" size={16} className="mr-2 mt-1 opacity-50" />
              <View className="flex-1">
                <ThemedText className="font-semibold">{t('membership.transferPolicy')}</ThemedText>
                <ThemedText className="mt-1 text-sm opacity-70">
                  {t('membership.defaultTransferPolicy')}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Download Contract */}
        {membershipSettings.showContractDownload && (
          <View className="mb-6">
            <Button
              title={t('membership.downloadContract')}
              icon="Download"
              variant="outline"
              onPress={handleDownloadContract}
              disabled={downloadingPdf}
            />
          </View>
        )}

        {/* Cancel Membership */}
        {featureFlags.membershipCancellationEnabled && (
          <View className="mb-8">
            <Button
              title={t('membership.cancelMembership')}
              icon="XCircle"
              variant="outline"
              onPress={() => router.push('/screens/cancel-membership')}
              className="border-red-500"
              textClassName="text-red-500"
            />
          </View>
        )}

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
