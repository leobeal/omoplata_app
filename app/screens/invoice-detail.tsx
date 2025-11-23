import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Pressable, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import ErrorState from '@/components/ErrorState';
import { Button } from '@/components/Button';
import { getInvoiceById, Invoice } from '@/api/invoices';
import { useThemeColors } from '@/contexts/ThemeColors';
import { useAuth } from '@/contexts/AuthContext';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
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
      const errorMessage = error instanceof Error
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
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      default:
        return status;
    }
  };

  const handleShare = async () => {
    if (!invoice) return;

    try {
      await Share.share({
        message: `Invoice ${invoice.id}\nAmount: ${formatAmount(invoice.total)}\nDate: ${formatDate(invoice.date)}`,
        title: `Invoice ${invoice.id}`,
      });
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title="Invoice Details" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title="Invoice Details" />
        <ErrorState
          title="Unable to load invoice"
          message={error}
          onRetry={() => {
            setLoading(true);
            loadInvoice();
          }}
          retryButtonText="Try Again"
        />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title="Invoice Details" />
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="FileX" size={64} className="mb-4 opacity-30" />
          <ThemedText className="text-center text-lg">Invoice not found</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header
        showBackButton
        title="Invoice Details"
        rightComponents={[
          <Pressable key="share" onPress={handleShare} className="p-2">
            <Icon name="Share2" size={20} />
          </Pressable>,
        ]}
      />
      <ThemedScroller className="px-6 pt-4">
        {/* Invoice Header */}
        <View className="mb-6 rounded-2xl bg-secondary p-6">
          <View className="mb-4 flex-row items-start justify-between">
            <View>
              <ThemedText className="mb-1 text-sm opacity-50">Invoice Number</ThemedText>
              <ThemedText className="text-2xl font-bold">{invoice.id}</ThemedText>
            </View>
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: `${getStatusColor(invoice.status)}20` }}>
              <ThemedText className="font-semibold" style={{ color: getStatusColor(invoice.status) }}>
                {getStatusLabel(invoice.status)}
              </ThemedText>
            </View>
          </View>

          <View className="border-t border-border pt-4">
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-50">Issue Date</ThemedText>
              <ThemedText className="font-semibold">{formatDate(invoice.date)}</ThemedText>
            </View>
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-50">Due Date</ThemedText>
              <ThemedText className="font-semibold">{formatDate(invoice.dueDate)}</ThemedText>
            </View>
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-50">Payment Method</ThemedText>
              <ThemedText className="font-semibold">{invoice.paymentMethod}</ThemedText>
            </View>
            {invoice.paymentDetails && (
              <View className="flex-row justify-between">
                <ThemedText className="opacity-50">Account</ThemedText>
                <ThemedText className="font-semibold">{invoice.paymentDetails}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Line Items */}
        <View className="mb-4">
          <ThemedText className="mb-3 text-lg font-bold">Items</ThemedText>
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
                  </ThemedText>
                </View>
                <ThemedText className="text-lg font-bold">{formatAmount(item.total)}</ThemedText>
              </View>
            </View>
          ))}

          {/* Totals */}
          <View className="border-t border-border p-5">
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-70">Subtotal</ThemedText>
              <ThemedText className="font-semibold">{formatAmount(invoice.subtotal)}</ThemedText>
            </View>
            <View className="mb-3 flex-row justify-between">
              <ThemedText className="opacity-70">Tax</ThemedText>
              <ThemedText className="font-semibold">{formatAmount(invoice.tax)}</ThemedText>
            </View>
            <View className="flex-row justify-between border-t border-border pt-3">
              <ThemedText className="text-lg font-bold">Total</ThemedText>
              <ThemedText className="text-2xl font-bold">{formatAmount(invoice.total)}</ThemedText>
            </View>
          </View>
        </View>

        {/* Billing Information */}
        <View className="mb-4">
          <ThemedText className="mb-3 text-lg font-bold">Billing Information</ThemedText>
        </View>

        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <ThemedText className="font-semibold">
            {user ? `${user.firstName} ${user.lastName}`.trim() : 'User'}
          </ThemedText>
          <ThemedText className="mt-1 text-sm opacity-70">{user?.email || 'user@example.com'}</ThemedText>
          <ThemedText className="mt-1 text-sm opacity-70">Address on file</ThemedText>
        </View>

        {/* Actions */}
        {invoice.status === 'paid' && (
          <View className="mb-8">
            <Button title="Download PDF" icon="Download" variant="outline" onPress={() => {}} />
          </View>
        )}

        {invoice.status === 'pending' && (
          <View className="mb-8">
            <Button title="Pay Now" icon="Building" onPress={() => {}} />
          </View>
        )}

        <View className="mb-8">
          <ThemedText className="text-center text-xs opacity-50">
            For questions about this invoice, please contact support@omoplata.com
          </ThemedText>
        </View>
      </ThemedScroller>
    </View>
  );
}
