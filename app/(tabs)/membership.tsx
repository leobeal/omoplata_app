import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, Pressable, RefreshControl } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import Section from '@/components/Section';
import { getMembership, downloadContract, Membership as MembershipType } from '@/api/membership';
import { useThemeColors } from '@/contexts/ThemeColors';
import { useT } from '@/contexts/LocalizationContext';
import { useMembershipSettings, useFeatureFlags } from '@/contexts/AppConfigContext';
import { useRouter } from 'expo-router';

export default function MembershipScreen() {
  const t = useT();
  const colors = useThemeColors();
  const router = useRouter();
  const membershipSettings = useMembershipSettings();
  const featureFlags = useFeatureFlags();
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadMembership();
  }, []);

  const loadMembership = async () => {
    try {
      const data = await getMembership();
      setMembership(data);
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

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleDownloadContract = async () => {
    if (!membership) return;

    setDownloadingPdf(true);
    try {
      const pdfUrl = await downloadContract(membership.contract.id);
      // In a real app, this would open the PDF or download it
      Alert.alert(t('membership.contractPdfTitle'), t('membership.contractDownloadMessage', { url: pdfUrl }), [
        { text: t('common.confirm'), style: 'default' },
      ]);
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
      await loadMembership();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'suspended':
        return '#F59E0B';
      case 'expired':
      case 'cancelled':
        return '#EF4444';
      default:
        return colors.text;
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
        }
      >
        {/* Current Plan Card */}
        <View className="mb-6 rounded-2xl bg-secondary p-6">
          <View className="mb-4 flex-row items-start justify-between">
            <View className="flex-1">
              <ThemedText className="mb-1 text-sm opacity-50">{t('membership.currentPlan')}</ThemedText>
              <ThemedText className="text-3xl font-bold">{membership.contract.type}</ThemedText>
              <View className="mt-2 flex-row items-center">
                <View
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: `${getStatusColor(membership.contract.status)}20` }}>
                  <ThemedText
                    className="text-xs font-semibold capitalize"
                    style={{ color: getStatusColor(membership.contract.status) }}>
                    {t(`membership.${membership.contract.status}`)}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-highlight">
              <Icon name="Award" size={32} color="white" />
            </View>
          </View>

          <View className="border-t border-border pt-4">
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-50">{t('membership.memberId')}</ThemedText>
              <ThemedText className="font-semibold">{membership.memberId}</ThemedText>
            </View>
            <View className="flex-row justify-between">
              <ThemedText className="opacity-50">{t('membership.contractId')}</ThemedText>
              <ThemedText className="font-semibold">{membership.contract.id}</ThemedText>
            </View>
          </View>
        </View>

        {/* Contract Details */}
        <Section title={t('membership.contractDetails')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary">
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">{t('membership.startDate')}</ThemedText>
            <ThemedText className="font-semibold">{formatDate(membership.contract.startDate)}</ThemedText>
          </View>
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">{t('membership.endDate')}</ThemedText>
            <ThemedText className="font-semibold">{formatDate(membership.contract.endDate)}</ThemedText>
          </View>
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">{t('membership.renewalDate')}</ThemedText>
            <ThemedText className="font-semibold">
              {formatDate(membership.contract.renewalDate)}
            </ThemedText>
          </View>
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">{t('membership.nextCancellationDate')}</ThemedText>
            <ThemedText className="font-semibold">
              {formatDate(membership.contract.nextCancellationDate)}
            </ThemedText>
          </View>
          <View className="flex-row items-center justify-between p-5">
            <ThemedText className="opacity-70">{t('membership.autoRenewal')}</ThemedText>
            <View className="flex-row items-center">
              <Icon
                name={membership.contract.autoRenewal ? 'Check' : 'X'}
                size={16}
                color={membership.contract.autoRenewal ? '#10B981' : '#EF4444'}
                className="mr-2"
              />
              <ThemedText
                className="font-semibold"
                style={{
                  color: membership.contract.autoRenewal ? '#10B981' : '#EF4444',
                }}>
                {membership.contract.autoRenewal ? t('membership.enabled') : t('membership.disabled')}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <Section title={t('membership.pricing')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <ThemedText className="text-sm opacity-50">{t('membership.annualFee')}</ThemedText>
              <ThemedText className="text-3xl font-bold">
                {formatAmount(membership.contract.price.amount)}
              </ThemedText>
            </View>
            <View className="items-end">
              <ThemedText className="text-sm opacity-50">{t('membership.monthlyEquivalent')}</ThemedText>
              <ThemedText className="text-lg font-semibold">
                {formatAmount(membership.contract.price.monthlyEquivalent)}{t('membership.perMonth')}
              </ThemedText>
            </View>
          </View>
          <View className="border-t border-border pt-4">
            <ThemedText className="text-sm opacity-70">
              {membership.contract.price.billingCycle === 'annual' ? t('membership.billedAnnually') : t('membership.billedMonthly')}
            </ThemedText>
          </View>
        </View>

        {/* Payment Method */}
        <Section title={t('membership.paymentMethod')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-background">
              <Icon name="Building" size={20} />
            </View>
            <View className="flex-1">
              <ThemedText className="font-semibold">{membership.paymentMethod.type}</ThemedText>
              <ThemedText className="text-sm opacity-50">{membership.paymentMethod.iban}</ThemedText>
              <ThemedText className="mt-1 text-xs opacity-50">
                {membership.paymentMethod.accountHolder}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Policies */}
        <Section title={t('membership.policies')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4">
            <View className="mb-2 flex-row items-start">
              <Icon name="XCircle" size={16} className="mr-2 mt-1 opacity-50" />
              <View className="flex-1">
                <ThemedText className="font-semibold">{t('membership.cancellationPolicy')}</ThemedText>
                <ThemedText className="mt-1 text-sm opacity-70">
                  {membership.contract.cancellationPolicy}
                  {membershipSettings.cancellationNoticeDays && (
                    <ThemedText className="text-sm font-semibold">
                      {' '}
                      ({t('membership.daysNoticeRequired', { count: membershipSettings.cancellationNoticeDays })})
                    </ThemedText>
                  )}
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
                    {membership.contract.freezePolicy}
                    {membershipSettings.maxFreezeDaysPerYear && (
                      <ThemedText className="text-sm font-semibold">
                        {' '}
                        ({t('membership.upTo')} {t('membership.daysPerYear', { count: membershipSettings.maxFreezeDaysPerYear })})
                      </ThemedText>
                    )}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
          <View className={`${membershipSettings.allowFreeze ? 'border-t border-border pt-4' : ''}`}>
            <View className="flex-row items-start">
              <Icon name="UserX" size={16} className="mr-2 mt-1 opacity-50" />
              <View className="flex-1">
                <ThemedText className="font-semibold">{t('membership.transferPolicy')}</ThemedText>
                <ThemedText className="mt-1 text-sm opacity-70">
                  {membership.contract.transferPolicy}
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
