import { getDocumentAsync } from 'expo-document-picker';
import { requestCameraPermissionsAsync, launchCameraAsync } from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

import {
  getMembership,
  downloadContract,
  uploadDocument,
  Membership as MembershipType,
  DocumentRequest,
  getPrimaryMember,
  getMonthlyEquivalent,
  formatCurrency,
  getStatusTranslationKey,
  isStatusActive,
  isStatusWarning,
  isKnownRecurringInterval,
  isKnownOnceDuration,
  parseDurationToMonths,
  getPendingDocumentRequests,
  getDocumentTypeTranslationKey,
} from '@/api/membership';
import { getPaymentMethod, PaymentMethod, getPaymentMethodIcon } from '@/api/payment-methods';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import LargeTitle from '@/components/LargeTitle';
import Section from '@/components/Section';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useMembershipSettings, useFeatureFlags } from '@/contexts/AppConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function MembershipScreen() {
  const t = useT();
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuth();
  const membershipSettings = useMembershipSettings();
  const featureFlags = useFeatureFlags();
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [uploadingDocumentId, setUploadingDocumentId] = useState<number | null>(null);

  // Scroll state for collapsible title
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const LARGE_TITLE_HEIGHT = 44;

  const handleScrollForTitle = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowHeaderTitle(offsetY > LARGE_TITLE_HEIGHT);
  }, []);

  // Reload when user changes (profile switch)
  useEffect(() => {
    setLoading(true);
    loadData();
  }, [user?.id]);

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
      await downloadContract(membership.id);
    } catch (error) {
      console.error('Error downloading contract:', error);
      Alert.alert(
        t('membership.downloadFailed'),
        error instanceof Error ? error.message : t('membership.downloadError')
      );
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

  const getDocumentTypeLabel = (documentTypeName: string) => {
    const key = getDocumentTypeTranslationKey(documentTypeName);
    const translationKey = `membership.documentTypes.${key}`;
    const translated = t(translationKey);
    // If translation not found, return original name formatted
    return translated === translationKey
      ? documentTypeName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      : translated;
  };

  const handleUploadDocument = (documentRequest: DocumentRequest) => {
    Alert.alert(t('membership.uploadDocument'), t('membership.selectFile'), [
      {
        text: t('membership.takePhoto'),
        onPress: () => handleTakePhoto(documentRequest),
      },
      {
        text: t('membership.chooseFromLibrary'),
        onPress: () => handleChooseFromLibrary(documentRequest),
      },
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
    ]);
  };

  const handleTakePhoto = async (documentRequest: DocumentRequest) => {
    const permissionResult = await requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(t('common.error'), t('checkin.permissionRequired'));
      return;
    }

    const result = await launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processUpload(documentRequest, {
        uri: result.assets[0].uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    }
  };

  const handleChooseFromLibrary = async (documentRequest: DocumentRequest) => {
    const result = await getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      await processUpload(documentRequest, {
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        type: result.assets[0].mimeType || 'application/octet-stream',
      });
    }
  };

  const processUpload = async (
    documentRequest: DocumentRequest,
    file: { uri: string; name: string; type: string }
  ) => {
    setUploadingDocumentId(documentRequest.id);
    try {
      const result = await uploadDocument(documentRequest.id, file);
      if (result.success) {
        Alert.alert(t('common.success'), t('membership.uploadSuccess'));
        // Refresh data to update the document request status
        await loadData();
      } else {
        Alert.alert(t('common.error'), t('membership.uploadError'));
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert(t('common.error'), t('membership.uploadError'));
    } finally {
      setUploadingDocumentId(null);
    }
  };

  const getStatusColor = (status: MembershipType['status']) => {
    if (isStatusActive(status)) return '#10B981';
    if (isStatusWarning(status)) return '#F59E0B';
    if (status === 'cancelled') return '#EF4444';
    return colors.text;
  };

  const getChargeIntervalLabel = (chargeInterval: string) => {
    if (isKnownRecurringInterval(chargeInterval)) {
      return t(`frequency.recurring.${chargeInterval}`);
    }
    return chargeInterval;
  };

  const getContractDurationLabel = (contractDuration: string) => {
    if (isKnownOnceDuration(contractDuration)) {
      return t(`frequency.once.${contractDuration}`);
    }
    return contractDuration;
  };

  const isYearlyOrLonger = (chargeInterval: string) => {
    const months = parseDurationToMonths(chargeInterval);
    return months >= 12;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" testID="activity-indicator" />
        </View>
      </View>
    );
  }

  if (!membership) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton />
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="UserX" size={64} className="mb-4 opacity-30" />
          <ThemedText className="text-center text-lg">{t('membership.noMembership')}</ThemedText>
        </View>
      </View>
    );
  }

  const primaryMember = getPrimaryMember(membership);
  const monthlyEquivalent = getMonthlyEquivalent(membership.plan);
  const pendingDocuments = getPendingDocumentRequests(membership);

  return (
    <View className="flex-1 bg-background">
      <Header title={showHeaderTitle ? t('membership.title') : undefined} showBackButton />
      <ThemedScroller
        className="px-6"
        onScroll={handleScrollForTitle}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF', colors.highlight]}
            progressBackgroundColor={colors.bg}
          />
        }>
        <LargeTitle title={t('membership.title')} className="pt-2" />

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
                    className="text-xs font-semibold"
                    style={{ color: getStatusColor(membership.status) }}>
                    {t(`membership.${getStatusTranslationKey(membership.status)}`)}
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

        {/* Pending Document Requests */}
        {pendingDocuments.length > 0 && (
          <>
            <Section title={t('membership.pendingDocuments')} className="mb-2" />
            <View className="mb-6 rounded-2xl bg-secondary">
              {pendingDocuments.map((docRequest, index) => (
                <View
                  key={docRequest.id}
                  className={`p-5 ${
                    index < pendingDocuments.length - 1 ? 'border-b border-border' : ''
                  }`}>
                  <View className="mb-3 flex-row items-start">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                      <Icon name="FileWarning" size={20} color="#F59E0B" />
                    </View>
                    <View className="flex-1">
                      <ThemedText className="font-semibold">
                        {getDocumentTypeLabel(docRequest.documentType.name)}
                      </ThemedText>
                      <ThemedText className="mt-1 text-sm opacity-70">
                        {docRequest.reason}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="flex-row items-center justify-center rounded-xl bg-highlight py-3"
                    onPress={() => handleUploadDocument(docRequest)}
                    disabled={uploadingDocumentId === docRequest.id}>
                    {uploadingDocumentId === docRequest.id ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <ThemedText className="ml-2 font-semibold text-white">
                          {t('membership.uploading')}
                        </ThemedText>
                      </>
                    ) : (
                      <>
                        <Icon name="Upload" size={18} color="white" />
                        <ThemedText className="ml-2 font-semibold text-white">
                          {t('membership.uploadDocument')}
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Members (if more than one) */}
        {membership.members.length > 1 && (
          <>
            <Section title={t('membership.members')} className="mb-2" />
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
        <Section title={t('membership.contractDetails')} className="mb-2" />
        <View className="mb-6 rounded-2xl bg-secondary">
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">{t('membership.startDate')}</ThemedText>
            <ThemedText className="font-semibold">{formatDate(membership.startsAt)}</ThemedText>
          </View>
          {membership.endsAt && (
            <View className="flex-row items-center justify-between border-b border-border p-5">
              <ThemedText className="opacity-70">{t('membership.endDate')}</ThemedText>
              <ThemedText className="font-semibold">{formatDate(membership.endsAt)}</ThemedText>
            </View>
          )}
          {membership.renewsAt && (
            <View className="flex-row items-center justify-between border-b border-border p-5">
              <ThemedText className="opacity-70">{t('membership.renewalDate')}</ThemedText>
              <ThemedText className="font-semibold">{formatDate(membership.renewsAt)}</ThemedText>
            </View>
          )}
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
        <Section title={t('membership.pricing')} className="mb-2" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <ThemedText className="text-sm opacity-50">
                {getChargeIntervalLabel(membership.plan.chargeInterval)}
              </ThemedText>
              <ThemedText className="text-3xl font-bold">
                {formatCurrency(membership.plan.amount, membership.plan.currency)}
              </ThemedText>
            </View>
            {isYearlyOrLonger(membership.plan.chargeInterval) && (
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
            <View className="flex-row justify-between">
              <ThemedText className="text-sm opacity-70">
                {t('membership.contractDuration')}
              </ThemedText>
              <ThemedText className="text-sm font-semibold">
                {getContractDurationLabel(membership.plan.contractDuration)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        {paymentMethod && (
          <>
            <Section title={t('membership.paymentMethod')} className="mb-2" />
            <View className="mb-6 rounded-2xl bg-secondary p-5">
              <View className="flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-background">
                  <Icon name={getPaymentMethodIcon(paymentMethod.type)} size={20} />
                </View>
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <ThemedText className="font-semibold">{paymentMethod.name}</ThemedText>
                    {paymentMethod.isActive && paymentMethod.isCorrectlyConfigured && (
                      <View className="rounded-full bg-green-500/20 px-2 py-0.5">
                        <ThemedText className="text-xs text-green-500">
                          {t('membership.active')}
                        </ThemedText>
                      </View>
                    )}
                    {paymentMethod.isFromResponsible && (
                      <View className="rounded-full bg-blue-500/20 px-2 py-0.5">
                        <ThemedText className="text-xs text-blue-500">
                          {t('membership.fromResponsible')}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText className="text-sm opacity-50">
                    {paymentMethod.details.maskedIban}
                  </ThemedText>
                  <ThemedText className="mt-1 text-xs opacity-50">
                    {paymentMethod.details.accountHolder}
                    {paymentMethod.details.bankName && ` • ${paymentMethod.details.bankName}`}
                  </ThemedText>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Policies */}
        <Section title={t('membership.policies')} className="mb-2" />
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
              loading={downloadingPdf}
              disabled={downloadingPdf}
            />
          </View>
        )}

        {/* Cancel Membership / Changed Your Mind */}
        {featureFlags.membershipCancellationEnabled && (
          <>
            {membership.endsAt ? (
              // Membership is already scheduled for cancellation - show "changed your mind" card
              <View className="mb-6">
                <Section title={t('membership.changeYourMind')} className="mb-2" />
                <View className="rounded-2xl bg-amber-500/10 p-5">
                  <View className="mb-4 flex-row items-center">
                    <Icon name="AlertCircle" size={20} color="#F59E0B" className="mr-3" />
                    <View className="flex-1">
                      <ThemedText className="font-semibold" style={{ color: '#F59E0B' }}>
                        {t('membership.scheduledForCancellation')}
                      </ThemedText>
                      <ThemedText className="mt-1 text-sm opacity-70">
                        {t('membership.membershipEndsOn', { date: formatDate(membership.endsAt) })}
                      </ThemedText>
                    </View>
                  </View>
                  <Button
                    title={t('membership.revertCancellation')}
                    icon="RotateCcw"
                    variant="solid"
                    onPress={() => router.push('/screens/cancel-membership')}
                  />
                </View>
              </View>
            ) : (
              // Membership is active - show cancellation button
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
          </>
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
