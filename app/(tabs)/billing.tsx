import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import { useT } from '@/contexts/LocalizationContext';
import { getInvoices, getNextInvoice, Invoice } from '@/api/invoices';
import { router } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function BillingScreen() {
  const t = useT();
  const colors = useThemeColors();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [nextInvoice, setNextInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const [invoicesData, nextInvoiceData] = await Promise.all([getInvoices(), getNextInvoice()]);
      setInvoices(invoicesData);
      setNextInvoice(nextInvoiceData);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
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
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header title="Billing" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header title="Billing" />
      <ThemedScroller className="px-6 pt-4">
        {/* Next Invoice Card */}
        {nextInvoice && (
          <Pressable
            className="mb-6 rounded-2xl bg-secondary p-6"
            onPress={() => router.push(`/screens/invoice-detail?id=${nextInvoice.id}`)}>
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1">
                <ThemedText className="text-sm opacity-50">Next Invoice</ThemedText>
                <ThemedText className="text-3xl font-bold">{formatAmount(nextInvoice.amount)}</ThemedText>
                <ThemedText className="mt-1 text-sm opacity-70">
                  Due {formatDate(nextInvoice.dueDate)}
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
                <ThemedText className="mr-2 text-sm font-semibold text-highlight">View Details</ThemedText>
                <Icon name="ChevronRight" size={16} color={colors.highlight} />
              </View>
            </View>
          </Pressable>
        )}

        {/* Invoices List */}
        <View className="mb-4">
          <ThemedText className="mb-3 text-lg font-bold">Recent Invoices</ThemedText>
        </View>

        <View className="mb-8 rounded-2xl bg-secondary">
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

        {/* Payment Method */}
        <View className="mb-4">
          <ThemedText className="mb-3 text-lg font-bold">Payment Method</ThemedText>
        </View>

        <View className="mb-8 rounded-2xl bg-secondary p-5">
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-background">
              <Icon name="Building" size={20} />
            </View>
            <View className="flex-1">
              <ThemedText className="font-semibold">SEPA Direct Debit</ThemedText>
              <ThemedText className="text-sm opacity-50">DE89 3704 0044 0532 •••• 00</ThemedText>
            </View>
            <Pressable onPress={() => router.push('/screens/payment-methods')}>
              <ThemedText className="font-semibold text-highlight">Edit</ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedScroller>
    </View>
  );
}
