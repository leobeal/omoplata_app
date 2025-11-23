import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import { useT } from '@/contexts/LocalizationContext';
import { getInvoicesPaginated, getNextInvoice, Invoice } from '@/api/invoices';
import { router } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function BillingScreen() {
  const t = useT();
  const colors = useThemeColors();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [nextInvoice, setNextInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const [invoicesData, nextInvoiceData] = await Promise.all([
        getInvoicesPaginated(10, 0),
        getNextInvoice(),
      ]);
      setInvoices(invoicesData.invoices);
      setHasMore(invoicesData.hasMore);
      setOffset(10);
      setNextInvoice(nextInvoiceData);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const invoicesData = await getInvoicesPaginated(10, offset);
      setInvoices((prev) => [...prev, ...invoicesData.invoices]);
      setHasMore(invoicesData.hasMore);
      setOffset((prev) => prev + 10);
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

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'overdue':
        return '#EF4444';
      default:
        return colors.text;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return t('billing.paid');
      case 'pending':
        return t('billing.pending');
      case 'overdue':
        return t('billing.overdue');
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header title={t('billing.title')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header title={t('billing.title')} />
      <ThemedScroller className="px-6 pt-4">
        {/* Next Invoice Card */}
        {nextInvoice && (
          <Pressable
            className="mb-6 rounded-2xl bg-secondary p-6"
            onPress={() => router.push(`/screens/invoice-detail?id=${nextInvoice.id}`)}>
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1">
                <ThemedText className="text-sm opacity-50">{t('billing.nextInvoice')}</ThemedText>
                <ThemedText className="text-3xl font-bold">{formatAmount(nextInvoice.amount)}</ThemedText>
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
                <ThemedText className="mr-2 text-sm font-semibold text-highlight">{t('billing.viewDetails')}</ThemedText>
                <Icon name="ChevronRight" size={16} color={colors.highlight} />
              </View>
            </View>
          </Pressable>
        )}

        {/* Invoices List */}
        <View className="mb-4">
          <ThemedText className="mb-3 text-lg font-bold">{t('billing.recentInvoices')}</ThemedText>
        </View>

        <View className="mb-4 rounded-2xl bg-secondary">
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
                <ThemedText className="font-semibold">{invoice.id}</ThemedText>
                <ThemedText className="text-sm opacity-50">{formatDate(invoice.date)}</ThemedText>
              </View>

              <View className="items-end">
                <ThemedText className="font-bold">{formatAmount(invoice.amount)}</ThemedText>
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

              <View className="ml-3 opacity-30">
                <Icon name="ChevronRight" size={20} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Load More Button */}
        {hasMore && (
          <Pressable
            className="mb-8 flex-row items-center justify-center rounded-2xl bg-secondary p-4"
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

        {/* Payment Method */}
        <View className="mb-4">
          <ThemedText className="mb-3 text-lg font-bold">{t('billing.paymentMethod')}</ThemedText>
        </View>

        <View className="mb-8 rounded-2xl bg-secondary p-5">
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-background">
              <Icon name="Building" size={20} />
            </View>
            <View className="flex-1">
              <ThemedText className="font-semibold">{t('billing.sepaDirectDebit')}</ThemedText>
              <ThemedText className="text-sm opacity-50">DE89 3704 0044 0532 •••• 00</ThemedText>
            </View>
            <Pressable onPress={() => router.push('/screens/payment-methods')}>
              <ThemedText className="font-semibold text-highlight">{t('billing.edit')}</ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedScroller>
    </View>
  );
}
