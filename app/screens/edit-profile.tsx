import { router } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

import { getProfile, updateProfile, Profile } from '@/api/profile';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import LargeTitle from '@/components/LargeTitle';
import Section from '@/components/Section';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function EditProfileScreen() {
  const colors = useThemeColors();
  const t = useT();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Scroll state for collapsible title
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const LARGE_TITLE_HEIGHT = 44;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowHeaderTitle(offsetY > LARGE_TITLE_HEIGHT);
  }, []);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();

      if (!data) {
        Alert.alert(
          t('editProfile.errorLoadingProfileTitle'),
          t('editProfile.errorLoadingProfile')
        );
        return;
      }

      setProfile(data);

      // Populate form fields
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhone(data.phone || '');

      // Handle address (could be null)
      if (data.address) {
        setStreet(data.address.street || '');
        setCity(data.address.city || '');
        setState(data.address.state || '');
        setPostalCode(data.address.postalCode || '');
        setCountry(data.address.country || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert(t('editProfile.errorLoadingProfileTitle'), t('editProfile.errorLoadingProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('editProfile.validationError'), t('editProfile.firstLastNameRequired'));
      return;
    }

    if (!profile) {
      Alert.alert(t('editProfile.errorUpdatingProfileTitle'), t('editProfile.profileNotAvailable'));
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = await updateProfile(profile.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || undefined,
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postal_code: postalCode.trim(),
          country: country.trim(),
        },
      });

      if (!updatedProfile) {
        Alert.alert(
          t('editProfile.errorUpdatingProfileTitle'),
          t('editProfile.errorUpdatingProfile')
        );
        return;
      }

      // Update local state with the response
      setProfile(updatedProfile);

      Alert.alert(t('editProfile.successTitle'), t('editProfile.successMessage'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        t('editProfile.errorUpdatingProfileTitle'),
        t('editProfile.errorUpdatingProfile')
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title={showHeaderTitle ? t('editProfile.title') : undefined} />
      <ThemedScroller className="flex-1 px-6" onScroll={handleScroll} scrollEventThrottle={16}>
        <LargeTitle title={t('editProfile.title')} className="pt-2" />

        {/* Profile Avatar */}
        <View className="mb-6 items-center">
          <Avatar
            name={`${firstName} ${lastName}`}
            size="xxl"
            src={profile?.profilePicture}
            border
          />
          <ThemedText className="mt-3 text-xs opacity-50">
            {t('editProfile.profilePictureHint')}
          </ThemedText>
        </View>

        {/* Personal Information */}
        <Section title={t('editProfile.personalInformation')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-semibold">
              {t('editProfile.firstNameRequired')}
            </ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('editProfile.enterFirstName')}
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-semibold">
              {t('editProfile.lastNameRequired')}
            </ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('editProfile.enterLastName')}
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-semibold">{t('editProfile.email')}</ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3 opacity-50"
              style={{ color: colors.text }}
              value={profile?.email}
              editable={false}
              placeholder={t('editProfile.emailPlaceholder')}
              placeholderTextColor={colors.subtext}
            />
            <ThemedText className="mt-1 text-xs opacity-50">
              {t('editProfile.emailCannotChange')}
            </ThemedText>
          </View>

          <View>
            <ThemedText className="mb-2 text-sm font-semibold">{t('editProfile.phone')}</ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('editProfile.enterPhone')}
              placeholderTextColor={colors.subtext}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Address */}
        <Section title={t('editProfile.address')} className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-semibold">
              {t('editProfile.streetAddress')}
            </ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={street}
              onChangeText={setStreet}
              placeholder={t('editProfile.enterStreetAddress')}
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-semibold">{t('editProfile.city')}</ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={city}
              onChangeText={setCity}
              placeholder={t('editProfile.enterCity')}
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View className="mb-4 flex-row gap-4">
            <View className="flex-1">
              <ThemedText className="mb-2 text-sm font-semibold">
                {t('editProfile.state')}
              </ThemedText>
              <TextInput
                className="rounded-xl border border-border bg-background px-4 py-3"
                style={{ color: colors.text }}
                value={state}
                onChangeText={setState}
                placeholder={t('editProfile.statePlaceholder')}
                placeholderTextColor={colors.subtext}
              />
            </View>
            <View className="flex-1">
              <ThemedText className="mb-2 text-sm font-semibold">
                {t('editProfile.postalCode')}
              </ThemedText>
              <TextInput
                className="rounded-xl border border-border bg-background px-4 py-3"
                style={{ color: colors.text }}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder={t('editProfile.postalCodePlaceholder')}
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View>
            <ThemedText className="mb-2 text-sm font-semibold">
              {t('editProfile.country')}
            </ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={country}
              onChangeText={setCountry}
              placeholder={t('editProfile.enterCountry')}
              placeholderTextColor={colors.subtext}
            />
          </View>
        </View>

        {/* Emergency Contact - Display only (read from responsibles) */}
        {(profile?.primaryResponsible ||
          (profile?.responsibles && profile.responsibles.length > 0)) && (
          <>
            <Section title={t('editProfile.emergencyContact')} className="mb-4" />
            <View className="mb-6 rounded-2xl bg-secondary p-5">
              <ThemedText className="mb-3 text-xs opacity-50">
                {t('editProfile.emergencyContactHint')}
              </ThemedText>
              {(() => {
                const emergencyContact = profile.primaryResponsible || profile.responsibles[0];
                return (
                  <>
                    <View className="mb-3">
                      <ThemedText className="text-sm opacity-70">
                        {t('editProfile.name')}
                      </ThemedText>
                      <ThemedText className="font-semibold">
                        {emergencyContact.firstName} {emergencyContact.lastName}
                      </ThemedText>
                    </View>
                    <View className="mb-3">
                      <ThemedText className="text-sm opacity-70">
                        {t('editProfile.email')}
                      </ThemedText>
                      <ThemedText className="font-semibold">{emergencyContact.email}</ThemedText>
                    </View>
                    <View>
                      <ThemedText className="text-sm opacity-70">
                        {t('editProfile.relationship')}
                      </ThemedText>
                      <ThemedText className="font-semibold">
                        {emergencyContact.relationship}
                      </ThemedText>
                    </View>
                  </>
                );
              })()}
            </View>
          </>
        )}

        {/* Save Button */}
        <View className="mb-8">
          <Button
            title={saving ? t('editProfile.saving') : t('editProfile.saveChanges')}
            onPress={handleSave}
            disabled={saving}
          />
        </View>

        {/* Cancel Button */}
        <View className="mb-8">
          <Button
            title={t('editProfile.cancel')}
            variant="outline"
            onPress={() => router.back()}
            disabled={saving}
          />
        </View>
      </ThemedScroller>
    </View>
  );
}
