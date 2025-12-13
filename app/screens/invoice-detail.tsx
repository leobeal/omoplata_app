import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Pressable, Alert } from 'react-native';

import {
  getInvoiceById,
  Invoice,
  downloadInvoicePdf,
  getInvoiceStatusColor,
  getInvoiceStatusTranslationKey,
} from '@/api/invoices';
import { formatCurrency } from '@/api/membership';
import { Button } from '@/components/Button';
import ErrorState from '@/components/ErrorState';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LocalizationContext';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setError(null);
      if (id) {
        const data = await getInvoiceById(id);
        setInvoice(data);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load invoice. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, invoice!.currency);
  };

  const getStatusColor = (status: string) => getInvoiceStatusColor(status);
  const getStatusLabel = (status: string) => t(getInvoiceStatusTranslationKey(status));

  const handleShare = async () => {
    if (!invoice) return;

    setSharing(true);
    try {
      await downloadInvoicePdf(invoice.id);
    } catch (error) {
      console.error('Error sharing invoice:', error);
      Alert.alert(
        t('billing.shareFailed'),
        error instanceof Error ? error.message : t('billing.shareFailedMessage')
      );
    } finally {
      setSharing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;

    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice.id);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      Alert.alert(
        t('billing.downloadFailed'),
        error instanceof Error ? error.message : t('billing.downloadFailedMessage')
      );
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title={t('billing.invoiceDetails')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title={t('billing.invoiceDetails')} />
        <ErrorState
          title={t('billing.unableToLoadInvoice')}
          message={error}
          onRetry={() => {
            setLoading(true);
            loadInvoice();
          }}
          retryButtonText={t('common.tryAgain')}
        />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title={t('billing.invoiceDetails')} />
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="FileX" size={64} className="mb-4 opacity-30" />
          <ThemedText className="text-center text-lg">{t('billing.invoiceNotFound')}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header
        showBackButton
        title={t('billing.invoiceDetails')}
        rightComponents={[
          <Pressable key="share" onPress={handleShare} disabled={sharing} className="p-2">
            {sharing ? <ActivityIndicator size="small" /> : <Icon name="Share2" size={20} />}
          </Pressable>,
        ]}
      />
      <ThemedScroller className="px-6 pt-4">
        {/* Invoice Header */}
        <View className="mb-6 rounded-2xl bg-secondary p-6">
          <View className="mb-4 flex-row items-start justify-between">
            <View>
              <ThemedText className="mb-1 text-sm opacity-50">
                {t('billing.invoiceNumber')}
              </ThemedText>
              <ThemedText className="text-2xl font-bold" selectable>
                {invoice.id}
              </ThemedText>
            </View>
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: `${getStatusColor(invoice.status)}20` }}>
              <ThemedText
                className="font-semibold"
                style={{ color: getStatusColor(invoice.status) }}>
                {getStatusLabel(invoice.status)}
              </ThemedText>
            </View>
          </View>

          <View className="border-t border-border pt-4">
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-50">{t('billing.issueDate')}</ThemedText>
              <ThemedText className="font-semibold">{formatDate(invoice.date)}</ThemedText>
            </View>
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-50">{t('billing.dueDate')}</ThemedText>
              <ThemedText className="font-semibold">{formatDate(invoice.dueDate)}</ThemedText>
            </View>
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-50">{t('billing.paymentMethod')}</ThemedText>
              <ThemedText className="font-semibold">{invoice.paymentMethod}</ThemedText>
            </View>
            {invoice.paymentDetails && (
              <View className="flex-row justify-between">
                <ThemedText className="opacity-50">{t('billing.account')}</ThemedText>
                <ThemedText className="font-semibold" selectable>
                  {invoice.paymentDetails}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Line Items */}
        <View className="mb-4">
          <ThemedText className="mb-3 text-lg font-bold">{t('billing.items')}</ThemedText>
        </View>

        <View className="mb-6 rounded-2xl bg-secondary">
          {invoice.lineItems.map((item, index) => (
            <View
              key={item.id}
              className={`p-5 ${index < invoice.lineItems.length - 1 ? 'border-b border-border' : ''}`}>
              <View className="mb-2 flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <ThemedText className="font-semibold">{item.description}</ThemedText>
                  <ThemedText className="mt-1 text-sm opacity-50">
                    {item.quantity} × {formatAmount(item.unitPrice)}
                    {item.taxRate > 0 && ` ${t('billing.taxRate', { rate: item.taxRate })}`}
                  </ThemedText>
                </View>
                <ThemedText className="text-lg font-bold">{formatAmount(item.total)}</ThemedText>
              </View>
            </View>
          ))}

          {/* Totals */}
          <View className="border-t border-border p-5">
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-70">{t('billing.subtotal')}</ThemedText>
              <ThemedText className="font-semibold">{formatAmount(invoice.subtotal)}</ThemedText>
            </View>
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-70">{t('billing.tax')}</ThemedText>
              <ThemedText className="font-semibold">{formatAmount(invoice.tax)}</ThemedText>
            </View>
            <View className="flex-row justify-between border-t border-border pt-3">
              <ThemedText className="text-lg font-bold">{t('billing.total')}</ThemedText>
              <ThemedText className="text-2xl font-bold" selectable>
                {formatAmount(invoice.total)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Billing Information */}
        <View className="mb-4">
          <ThemedText className="mb-3 text-lg font-bold">
            {t('billing.billingInformation')}
          </ThemedText>
        </View>

        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <ThemedText className="font-semibold" selectable>
            {user ? `${user.firstName} ${user.lastName}`.trim() : 'User'}
          </ThemedText>
          <ThemedText className="mt-1 text-sm opacity-70" selectable>
            {user?.email || 'user@example.com'}
          </ThemedText>
          {invoice.payerAddress ? (
            <>
              <ThemedText className="mt-1 text-sm opacity-70" selectable>
                {invoice.payerAddress.street}
              </ThemedText>
              <ThemedText className="text-sm opacity-70" selectable>
                {invoice.payerAddress.postalCode} {invoice.payerAddress.city}
              </ThemedText>
              <ThemedText className="text-sm opacity-70" selectable>
                {invoice.payerAddress.country}
              </ThemedText>
            </>
          ) : (
            <ThemedText className="mt-1 text-sm opacity-70">
              {t('billing.addressOnFile')}
            </ThemedText>
          )}
        </View>

        {/* Actions */}
        {invoice.status === 'paid' && (
          <View className="mb-8">
            <Button
              title={t('billing.downloadPdf')}
              icon="Download"
              variant="outline"
              onPress={handleDownloadPdf}
              loading={downloading}
              disabled={downloading}
            />
          </View>
        )}

        <View className="mb-8">
          <ThemedText className="text-center text-xs opacity-50">
            {t('billing.supportContact', { email: 'app@omoplata.com' })}
          </ThemedText>
        </View>
      </ThemedScroller>
    </View>
  );
}
