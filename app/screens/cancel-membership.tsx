import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';

import { getMembership, cancelMembership, Membership as MembershipType } from '@/api/membership';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import Section from '@/components/Section';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useMembershipSettings } from '@/contexts/AppConfigContext';

export default function CancelMembershipScreen() {
  const router = useRouter();
  const membershipSettings = useMembershipSettings();
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [reason] = useState('');

  useEffect(() => {
    loadMembership();
  }, []);

  const loadMembership = async () => {
    try {
      const data = await getMembership();
      setMembership(data);
      // Default to next available cancellation date
      setSelectedDate(data.contract.nextCancellationDate);
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

  const isDateValid = (dateStr: string) => {
    if (!membership) return false;
    const selectedDateObj = new Date(dateStr);
    const nextCancellationDateObj = new Date(membership.contract.nextCancellationDate);
    return selectedDateObj >= nextCancellationDateObj;
  };

  const handleCancel = async () => {
    if (!membership) return;

    if (!isDateValid(selectedDate)) {
      Alert.alert(
        'Invalid Date',
        `Cancellation date must be on or after ${formatDate(membership.contract.nextCancellationDate)}`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Confirm Cancellation',
      `Are you sure you want to cancel your membership effective ${formatDate(selectedDate)}? This action cannot be undone.`,
      [
        { text: 'No, Keep My Membership', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const result = await cancelMembership(membership.contract.id, selectedDate, reason);
              if (result.success) {
                Alert.alert('Membership Cancelled', result.message, [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                Alert.alert('Error', 'Failed to cancel membership. Please try again.');
              }
            } catch (error) {
              console.error('Error cancelling membership:', error);
              Alert.alert('Error', 'Failed to cancel membership. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title="Cancel Membership" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (!membership) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title="Cancel Membership" />
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="UserX" size={64} className="mb-4 opacity-30" />
          <ThemedText className="text-center text-lg">No membership found</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title="Cancel Membership" />
      <ThemedScroller className="px-6 pt-4">
        {/* Warning Card */}
        <View className="mb-6 rounded-2xl bg-red-500/10 p-6">
          <View className="mb-4 flex-row items-center">
            <Icon name="AlertTriangle" size={24} color="#EF4444" className="mr-3" />
            <ThemedText className="flex-1 text-lg font-bold" style={{ color: '#EF4444' }}>
              Important Information
            </ThemedText>
          </View>
          <ThemedText className="mb-2 opacity-70">
            Cancelling your membership will end your access to all gym facilities and services.
          </ThemedText>
          <ThemedText className="opacity-70">
            Please review the cancellation policy and effective date carefully before proceeding.
          </ThemedText>
        </View>

        {/* Current Plan */}
        <Section title="Current Plan" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-3 flex-row justify-between">
            <ThemedText className="opacity-70">Plan Type</ThemedText>
            <ThemedText className="font-semibold">{membership.contract.type}</ThemedText>
          </View>
          <View className="mb-3 flex-row justify-between">
            <ThemedText className="opacity-70">Member ID</ThemedText>
            <ThemedText className="font-semibold">{membership.memberId}</ThemedText>
          </View>
          <View className="flex-row justify-between">
            <ThemedText className="opacity-70">Contract End Date</ThemedText>
            <ThemedText className="font-semibold">
              {formatDate(membership.contract.endDate)}
            </ThemedText>
          </View>
        </View>

        {/* Cancellation Details */}
        <Section title="Cancellation Details" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4">
            <View className="mb-2 flex-row items-center">
              <Icon name="Calendar" size={16} className="mr-2 opacity-50" />
              <ThemedText className="font-semibold">Effective Cancellation Date</ThemedText>
            </View>
            <ThemedText className="text-sm opacity-70">
              Your membership will be cancelled on: {formatDate(selectedDate)}
            </ThemedText>
            <View className="mt-3 rounded-lg bg-background p-3">
              <ThemedText className="text-xs opacity-50">
                Earliest available date: {formatDate(membership.contract.nextCancellationDate)}
              </ThemedText>
            </View>
          </View>

          {membershipSettings.cancellationNoticeDays && (
            <View className="border-t border-border pt-4">
              <View className="mb-2 flex-row items-center">
                <Icon name="Clock" size={16} className="mr-2 opacity-50" />
                <ThemedText className="font-semibold">Notice Period</ThemedText>
              </View>
              <ThemedText className="text-sm opacity-70">
                {membershipSettings.cancellationNoticeDays} days notice required
              </ThemedText>
            </View>
          )}
        </View>

        {/* Cancellation Policy */}
        <Section title="Cancellation Policy" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <ThemedText className="text-sm opacity-70">
            {membership.contract.cancellationPolicy}
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View className="mb-4">
          <Button
            title="Cancel My Membership"
            icon="XCircle"
            variant="solid"
            onPress={handleCancel}
            disabled={cancelling}
            className="mb-3 bg-red-500"
          />
          <Button
            title="Keep My Membership"
            variant="outline"
            onPress={() => router.back()}
            disabled={cancelling}
          />
        </View>

        {/* Support */}
        <View className="mb-8">
          <ThemedText className="text-center text-xs opacity-50">
            Need help? Contact our support team before cancelling.
          </ThemedText>
        </View>
      </ThemedScroller>
    </View>
  );
}
