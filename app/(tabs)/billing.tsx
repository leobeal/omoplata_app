import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';

import {
  getInvoicesPaginated,
  getInvoiceStatusColor,
  getInvoiceStatusTranslationKey,
  getNextInvoice,
  Invoice,
} from '@/api/invoices';
import { formatCurrency } from '@/api/membership';
import { getPaymentMethodIcon, getPaymentMethodTypeName } from '@/api/payment-methods';
import Avatar from '@/components/Avatar';
import ErrorState from '@/components/ErrorState';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import LargeTitle from '@/components/LargeTitle';
import Section from '@/components/Section';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/DashboardReadyContext';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

interface BillingScreenProps {
  showBackButton?: boolean;
}

// Empty state component for when billing is managed by a responsible
function BillingEmptyState({ responsibleName }: { responsibleName?: string }) {
  const t = useT();
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center px-6">
      <View
        className="mb-4 rounded-full p-6"
        style={{ backgroundColor: colors.isDark ? '#2A2A2A' : '#E5E5E5' }}>
        <Icon name="Receipt" size={48} color={colors.text} style={{ opacity: 0.3 }} />
      </View>
      <ThemedText className="text-center text-xl font-bold opacity-80">
        {t('billing.managedByResponsible')}
      </ThemedText>
      <ThemedText className="mt-2 px-8 text-center opacity-50">
        {responsibleName
          ? t('billing.billingManagedByName', { name: responsibleName })
          : t('billing.billingManagedByResponsible')}
      </ThemedText>
    </View>
  );
}

export default function BillingScreen({ showBackButton = false }: BillingScreenProps) {
  const t = useT();
  const colors = useThemeColors();
  const { user, isViewingAsChild, parentUser } = useAuth();
  const { paymentMethods, membership } = useAppData();

  // Check if billing is managed by a responsible (parent)
  const billingManagedByResponsible = useMemo(() => {
    // Case 1: Parent is viewing child's profile
    if (isViewingAsChild && parentUser) {
      return {
        isManaged: true,
        responsibleName: `${parentUser.firstName} ${parentUser.lastName}`,
      };
    }

    // Case 2: User has a membership with a different payer
    if (membership && user) {
      const payerPrefixedId = membership.payer?.prefixedId;
      const userPrefixedId = user.prefixedId;
      if (payerPrefixedId && userPrefixedId && payerPrefixedId !== userPrefixedId) {
        return {
          isManaged: true,
          responsibleName: membership.payer.fullName,
        };
      }
    }

    return { isManaged: false, responsibleName: undefined };
  }, [isViewingAsChild, parentUser, membership, user]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [nextInvoice, setNextInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scroll state for collapsible title
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const LARGE_TITLE_HEIGHT = 44;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowHeaderTitle(offsetY > LARGE_TITLE_HEIGHT);
  }, []);

  // Reload invoices when user changes (profile switch)
  useEffect(() => {
    setLoading(true);
    loadInvoices();
  }, [user?.id]);

  const loadInvoices = async (isRefreshing: boolean = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }

      const [invoicesData, nextInvoiceData] = await Promise.all([
        getInvoicesPaginated(10, 1),
        getNextInvoice(),
      ]);
      setInvoices(invoicesData.invoices);
      setHasMore(invoicesData.hasMore);
      setCurrentPage(1);
      setNextInvoice(nextInvoiceData);
      setError(null);
    } catch (error) {
      console.error('Error loading invoices:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load invoices. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadInvoices(true);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const invoicesData = await getInvoicesPaginated(10, nextPage);
      setInvoices((prev) => [...prev, ...invoicesData.invoices]);
      setHasMore(invoicesData.hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more invoices:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatAmount = (amount: number, currency: string) => {
    return formatCurrency(amount, currency);
  };

  const getStatusColor = (status: string) => getInvoiceStatusColor(status);
  const getStatusLabel = (status: string) => t(getInvoiceStatusTranslationKey(status));

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header
          showBackButton={showBackButton}
          rightComponents={[
            <Avatar
              key="avatar"
              name={user ? `${user.firstName} ${user.lastName}` : ''}
              size="sm"
              link="/screens/settings"
              src={user?.profilePicture}
            />,
          ]}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background">
        <Header
          showBackButton={showBackButton}
          rightComponents={[
            <Avatar
              key="avatar"
              name={user ? `${user.firstName} ${user.lastName}` : ''}
              size="sm"
              link="/screens/settings"
              src={user?.profilePicture}
            />,
          ]}
        />
        <ErrorState
          title={t('billing.errorTitle') || 'Unable to load invoices'}
          message={error}
          onRetry={() => {
            setLoading(true);
            loadInvoices();
          }}
          retryButtonText={t('common.tryAgain') || 'Try Again'}
        />
      </View>
    );
  }

  // Show empty state when billing is managed by a responsible
  if (billingManagedByResponsible.isManaged) {
    return (
      <View className="flex-1 bg-background">
        <Header
          showBackButton={showBackButton}
          rightComponents={[
            <Avatar
              key="avatar"
              name={user ? `${user.firstName} ${user.lastName}` : ''}
              size="sm"
              link="/screens/settings"
              src={user?.profilePicture}
            />,
          ]}
        />
        <View className="px-6">
          <LargeTitle title={t('billing.title')} className="pt-2" />
        </View>
        <BillingEmptyState responsibleName={billingManagedByResponsible.responsibleName} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header
        showBackButton={showBackButton}
        title={showHeaderTitle ? t('billing.title') : undefined}
        rightComponents={[
          <Avatar
            key="avatar"
            name={user ? `${user.firstName} ${user.lastName}` : ''}
            size="sm"
            link="/screens/settings"
            src={user?.profilePicture}
          />,
        ]}
      />
      <ThemedScroller
        className="flex-1 px-6"
        onScroll={handleScroll}
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
        <LargeTitle title={t('billing.title')} className="pt-2" />

        {/* Next Invoice Card */}
        {nextInvoice && (
          <Pressable
            className="mb-6 rounded-2xl bg-secondary p-6"
            onPress={() => router.push(`/screens/invoice-detail?id=${nextInvoice.id}`)}>
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1">
                <ThemedText className="text-sm opacity-50">{t('billing.nextInvoice')}</ThemedText>
                <ThemedText className="text-3xl font-bold">
                  {formatAmount(nextInvoice.amount, nextInvoice.currency)}
                </ThemedText>
                <ThemedText className="mt-1 text-sm opacity-70">
                  {t('billing.due')} {formatDate(nextInvoice.dueDate)}
                </ThemedText>
              </View>
              <View className="h-16 w-16 items-center justify-center rounded-full bg-highlight">
                <Icon name="Receipt" size={32} color="white" />
              </View>
            </View>

            <View className="flex-row items-center border-t border-border pt-4">
              <View className="flex-1">
                <ThemedText className="text-sm opacity-70">{nextInvoice.id}</ThemedText>
              </View>
              <View className="flex-row items-center">
                <ThemedText className="mr-2 text-sm font-semibold text-highlight">
                  {t('billing.viewDetails')}
                </ThemedText>
                <Icon name="ChevronRight" size={16} color={colors.highlight} />
              </View>
            </View>
          </Pressable>
        )}

        {/* Invoices List */}
        <Section title={t('billing.recentInvoices')} titleSize="lg" noTopMargin className="mt-4">
          <View className="rounded-2xl bg-secondary">
            {invoices.map((invoice, index) => (
              <Pressable
                key={invoice.id}
                className={`flex-row items-center p-5 ${
                  index < invoices.length - 1 ? 'border-b border-border' : ''
                }`}
                onPress={() => router.push(`/screens/invoice-detail?id=${invoice.id}`)}>
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-background">
                  <Icon name="FileText" size={20} />
                </View>

                <View className="flex-1">
                  <View className="flex-row justify-between gap-2">
                    <View>
                      <ThemedText className="font-semibold">{invoice.id}</ThemedText>
                    </View>
                    <ThemedText className="font-bold">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </ThemedText>
                  </View>
                  <View className="flex-row justify-between gap-2">
                    <ThemedText className="text-sm opacity-50">
                      {formatDate(invoice.date)}
                    </ThemedText>
                    <View
                      className="mt-1 rounded-full px-2 py-0.5"
                      style={{ backgroundColor: `${getStatusColor(invoice.status)}20` }}>
                      <ThemedText
                        className="text-xs font-semibold"
                        style={{ color: getStatusColor(invoice.status) }}>
                        {getStatusLabel(invoice.status)}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View className="ml-3 opacity-30">
                  <Icon name="ChevronRight" size={20} />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Load More Button */}
          {hasMore && (
            <Pressable
              className="mt-4 flex-row items-center justify-center rounded-2xl bg-secondary p-4"
              onPress={loadMore}
              disabled={loadingMore}>
              {loadingMore ? (
                <ActivityIndicator size="small" color={colors.highlight} />
              ) : (
                <>
                  <ThemedText className="mr-2 font-semibold text-highlight">
                    {t('billing.loadMore')}
                  </ThemedText>
                  <Icon name="ChevronDown" size={20} color={colors.highlight} />
                </>
              )}
            </Pressable>
          )}
        </Section>

        {/* Payment Method */}
        {paymentMethods.length > 0 && (
          <Section title={t('billing.paymentMethod')} titleSize="lg">
            <View className="rounded-2xl bg-secondary p-5">
              {paymentMethods
                .filter((pm) => pm.isActive)
                .map((paymentMethod) => (
                  <View key={paymentMethod.id} className="flex-row items-center">
                    <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-background">
                      <Icon name={getPaymentMethodIcon(paymentMethod.type)} size={20} />
                    </View>
                    <View className="flex-1">
                      <ThemedText className="font-semibold">
                        {getPaymentMethodTypeName(paymentMethod.type)}
                      </ThemedText>
                      <ThemedText className="text-sm opacity-50">
                        {paymentMethod.details?.maskedIban || paymentMethod.last4}
                      </ThemedText>
                    </View>
                  </View>
                ))}
            </View>
          </Section>
        )}
      </ThemedScroller>
    </View>
  );
}
