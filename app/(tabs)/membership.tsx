import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, Pressable } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import Section from '@/components/Section';
import { getMembership, downloadContract, Membership as MembershipType } from '@/api/membership';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function MembershipScreen() {
  const colors = useThemeColors();
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [loading, setLoading] = useState(true);
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
      Alert.alert('Contract PDF', `Contract would be downloaded from: ${pdfUrl}`, [
        { text: 'OK', style: 'default' },
      ]);
    } catch (error) {
      console.error('Error downloading contract:', error);
      Alert.alert('Error', 'Failed to download contract PDF');
    } finally {
      setDownloadingPdf(false);
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
        <Header title="My Membership" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (!membership) {
    return (
      <View className="flex-1 bg-background">
        <Header title="My Membership" />
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="UserX" size={64} className="mb-4 opacity-30" />
          <ThemedText className="text-center text-lg">No membership found</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header title="My Membership" />
      <ThemedScroller className="px-6 pt-4">
        {/* Current Plan Card */}
        <View className="mb-6 rounded-2xl bg-secondary p-6">
          <View className="mb-4 flex-row items-start justify-between">
            <View className="flex-1">
              <ThemedText className="mb-1 text-sm opacity-50">Current Plan</ThemedText>
              <ThemedText className="text-3xl font-bold">{membership.contract.type}</ThemedText>
              <View className="mt-2 flex-row items-center">
                <View
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: `${getStatusColor(membership.contract.status)}20` }}>
                  <ThemedText
                    className="text-xs font-semibold capitalize"
                    style={{ color: getStatusColor(membership.contract.status) }}>
                    {membership.contract.status}
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
              <ThemedText className="opacity-50">Member ID</ThemedText>
              <ThemedText className="font-semibold">{membership.memberId}</ThemedText>
            </View>
            <View className="flex-row justify-between">
              <ThemedText className="opacity-50">Contract ID</ThemedText>
              <ThemedText className="font-semibold">{membership.contract.id}</ThemedText>
            </View>
          </View>
        </View>

        {/* Contract Details */}
        <Section title="Contract Details" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary">
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">Start Date</ThemedText>
            <ThemedText className="font-semibold">{formatDate(membership.contract.startDate)}</ThemedText>
          </View>
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">End Date</ThemedText>
            <ThemedText className="font-semibold">{formatDate(membership.contract.endDate)}</ThemedText>
          </View>
          <View className="flex-row items-center justify-between border-b border-border p-5">
            <ThemedText className="opacity-70">Renewal Date</ThemedText>
            <ThemedText className="font-semibold">
              {formatDate(membership.contract.renewalDate)}
            </ThemedText>
          </View>
          <View className="flex-row items-center justify-between p-5">
            <ThemedText className="opacity-70">Auto-Renewal</ThemedText>
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
                {membership.contract.autoRenewal ? 'Enabled' : 'Disabled'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <Section title="Pricing" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <ThemedText className="text-sm opacity-50">Annual Fee</ThemedText>
              <ThemedText className="text-3xl font-bold">
                {formatAmount(membership.contract.price.amount)}
              </ThemedText>
            </View>
            <View className="items-end">
              <ThemedText className="text-sm opacity-50">Monthly Equivalent</ThemedText>
              <ThemedText className="text-lg font-semibold">
                {formatAmount(membership.contract.price.monthlyEquivalent)}/mo
              </ThemedText>
            </View>
          </View>
          <View className="border-t border-border pt-4">
            <ThemedText className="text-sm opacity-70">
              Billed {membership.contract.price.billingCycle}
            </ThemedText>
          </View>
        </View>

        {/* Features */}
        <Section title="Plan Features" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary">
          {membership.features.map((feature, index) => (
            <View
              key={index}
              className={`p-5 ${index < membership.features.length - 1 ? 'border-b border-border' : ''}`}>
              <View className="flex-row items-start">
                <Icon
                  name={feature.included ? 'Check' : 'X'}
                  size={20}
                  color={feature.included ? '#10B981' : '#EF4444'}
                  className="mr-3 mt-0.5"
                />
                <View className="flex-1">
                  <ThemedText className="font-semibold">{feature.name}</ThemedText>
                  <ThemedText className="mt-1 text-sm opacity-70">{feature.description}</ThemedText>
                  {feature.limit && (
                    <ThemedText className="mt-1 text-xs font-medium opacity-50">
                      Limit: {feature.limit}
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <Section title="Payment Method" className="mb-4" />
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
        <Section title="Membership Policies" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4">
            <View className="mb-2 flex-row items-start">
              <Icon name="XCircle" size={16} className="mr-2 mt-1 opacity-50" />
              <View className="flex-1">
                <ThemedText className="font-semibold">Cancellation Policy</ThemedText>
                <ThemedText className="mt-1 text-sm opacity-70">
                  {membership.contract.cancellationPolicy}
                </ThemedText>
              </View>
            </View>
          </View>
          <View className="mb-4 border-t border-border pt-4">
            <View className="mb-2 flex-row items-start">
              <Icon name="Pause" size={16} className="mr-2 mt-1 opacity-50" />
              <View className="flex-1">
                <ThemedText className="font-semibold">Freeze Policy</ThemedText>
                <ThemedText className="mt-1 text-sm opacity-70">
                  {membership.contract.freezePolicy}
                </ThemedText>
              </View>
            </View>
          </View>
          <View className="border-t border-border pt-4">
            <View className="flex-row items-start">
              <Icon name="UserX" size={16} className="mr-2 mt-1 opacity-50" />
              <View className="flex-1">
                <ThemedText className="font-semibold">Transfer Policy</ThemedText>
                <ThemedText className="mt-1 text-sm opacity-70">
                  {membership.contract.transferPolicy}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Download Contract */}
        <View className="mb-8">
          <Button
            title="Download Contract PDF"
            icon="Download"
            variant="outline"
            onPress={handleDownloadContract}
            disabled={downloadingPdf}
          />
        </View>

        {/* Support */}
        <View className="mb-8">
          <ThemedText className="text-center text-xs opacity-50">
            For questions about your membership, please contact support@omoplata.com
          </ThemedText>
        </View>
      </ThemedScroller>
    </View>
  );
}
