import React, { useState } from 'react';
import { View, TextInput, Alert, ActivityIndicator } from 'react-native';

import Icon from './Icon';
import ThemedText from './ThemedText';

import { submitSepaMandate, PaymentMethod } from '@/api/payment-methods';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

interface SepaFormProps {
  onSuccess?: (paymentMethod: PaymentMethod) => void;
  onCancel?: () => void;
}

export default function SepaForm({ onSuccess }: SepaFormProps) {
  const t = useT();
  const colors = useThemeColors();
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ accountHolder?: string; iban?: string }>({});

  const formatIban = (value: string) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    // Add space every 4 characters
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const handleIbanChange = (value: string) => {
    setIban(formatIban(value));
    if (errors.iban) {
      setErrors((prev) => ({ ...prev, iban: undefined }));
    }
  };

  const handleAccountHolderChange = (value: string) => {
    setAccountHolder(value);
    if (errors.accountHolder) {
      setErrors((prev) => ({ ...prev, accountHolder: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { accountHolder?: string; iban?: string } = {};

    if (!accountHolder.trim()) {
      newErrors.accountHolder = t('sepaForm.invalidAccountHolder');
    }

    const cleanIban = iban.replace(/\s/g, '');
    if (!cleanIban || cleanIban.length < 15 || cleanIban.length > 34) {
      newErrors.iban = t('sepaForm.invalidIban');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await submitSepaMandate({
        accountHolder: accountHolder.trim(),
        iban: iban.replace(/\s/g, ''),
      });

      if (result.success && result.paymentMethod) {
        Alert.alert(t('common.success'), t('sepaForm.successMessage'));
        onSuccess?.(result.paymentMethod);
      } else {
        Alert.alert(t('common.error'), result.message || t('sepaForm.errorMessage'));
      }
    } catch (error) {
      console.error('Error submitting SEPA mandate:', error);
      Alert.alert(t('common.error'), t('sepaForm.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="rounded-2xl bg-secondary p-5">
      {/* Header */}
      <View className="mb-4 flex-row items-center">
        <View className="bg-highlight/20 mr-3 h-10 w-10 items-center justify-center rounded-full">
          <Icon name="Building" size={20} color={colors.highlight} />
        </View>
        <View className="flex-1">
          <ThemedText className="text-lg font-bold">{t('sepaForm.title')}</ThemedText>
          <ThemedText className="text-sm opacity-60">{t('sepaForm.subtitle')}</ThemedText>
        </View>
      </View>

      {/* Account Holder */}
      <View className="mb-4">
        <ThemedText className="mb-2 text-sm font-medium">{t('sepaForm.accountHolder')}</ThemedText>
        <TextInput
          className="rounded-xl border border-border bg-background px-4 py-3 text-text"
          placeholder={t('sepaForm.accountHolderPlaceholder')}
          placeholderTextColor={colors.text + '80'}
          value={accountHolder}
          onChangeText={handleAccountHolderChange}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!submitting}
          style={{ color: colors.text }}
        />
        {errors.accountHolder && (
          <ThemedText className="mt-1 text-xs text-red-500">{errors.accountHolder}</ThemedText>
        )}
      </View>

      {/* IBAN */}
      <View className="mb-4">
        <ThemedText className="mb-2 text-sm font-medium">{t('sepaForm.iban')}</ThemedText>
        <TextInput
          className="rounded-xl border border-border bg-background px-4 py-3 text-text"
          placeholder={t('sepaForm.ibanPlaceholder')}
          placeholderTextColor={colors.text + '80'}
          value={iban}
          onChangeText={handleIbanChange}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!submitting}
          style={{ color: colors.text }}
        />
        {errors.iban && (
          <ThemedText className="mt-1 text-xs text-red-500">{errors.iban}</ThemedText>
        )}
      </View>

      {/* Mandate Text */}
      <View className="bg-background/50 mb-5 rounded-xl p-3">
        <ThemedText className="text-xs opacity-60">{t('sepaForm.mandateText')}</ThemedText>
      </View>

      {/* Submit Button */}
      <View
        className="items-center justify-center rounded-xl bg-highlight py-4"
        style={{ opacity: submitting ? 0.7 : 1 }}>
        {submitting ? (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="white" />
            <ThemedText className="ml-2 font-semibold text-white">
              {t('sepaForm.submitting')}
            </ThemedText>
          </View>
        ) : (
          <ThemedText
            className="font-semibold text-white"
            onPress={handleSubmit}
            suppressHighlighting>
            {t('sepaForm.submitButton')}
          </ThemedText>
        )}
      </View>
    </View>
  );
}
