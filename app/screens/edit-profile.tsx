import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';

import { getProfile, updateProfile, Profile } from '@/api/profile';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Section from '@/components/Section';
import ThemedText from '@/components/ThemedText';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function EditProfileScreen() {
  const colors = useThemeColors();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'First name and last name are required');
      return;
    }

    if (!profile) {
      Alert.alert('Error', 'Profile data not available');
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

      // Update local state with the response
      setProfile(updatedProfile);

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title="Edit Profile" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title="Edit Profile" />
      <ScrollView
        className="flex-1 px-6 pt-4"
        bounces
        alwaysBounceVertical
        showsVerticalScrollIndicator={false}>
        {/* Personal Information */}
        <Section title="Personal Information" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-semibold">First Name *</ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-semibold">Last Name *</ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-semibold">Email</ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3 opacity-50"
              style={{ color: colors.text }}
              value={profile?.email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor={colors.subtext}
            />
            <ThemedText className="mt-1 text-xs opacity-50">
              Email cannot be changed. Contact support if needed.
            </ThemedText>
          </View>

          <View>
            <ThemedText className="mb-2 text-sm font-semibold">Phone</ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor={colors.subtext}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Address */}
        <Section title="Address" className="mb-4" />
        <View className="mb-6 rounded-2xl bg-secondary p-5">
          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-semibold">Street Address</ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={street}
              onChangeText={setStreet}
              placeholder="Enter street address"
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View className="mb-4">
            <ThemedText className="mb-2 text-sm font-semibold">City</ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={city}
              onChangeText={setCity}
              placeholder="Enter city"
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View className="mb-4 flex-row gap-4">
            <View className="flex-1">
              <ThemedText className="mb-2 text-sm font-semibold">State</ThemedText>
              <TextInput
                className="rounded-xl border border-border bg-background px-4 py-3"
                style={{ color: colors.text }}
                value={state}
                onChangeText={setState}
                placeholder="State"
                placeholderTextColor={colors.subtext}
              />
            </View>
            <View className="flex-1">
              <ThemedText className="mb-2 text-sm font-semibold">Postal Code</ThemedText>
              <TextInput
                className="rounded-xl border border-border bg-background px-4 py-3"
                style={{ color: colors.text }}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Postal code"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View>
            <ThemedText className="mb-2 text-sm font-semibold">Country</ThemedText>
            <TextInput
              className="rounded-xl border border-border bg-background px-4 py-3"
              style={{ color: colors.text }}
              value={country}
              onChangeText={setCountry}
              placeholder="Enter country"
              placeholderTextColor={colors.subtext}
            />
          </View>
        </View>

        {/* Emergency Contact - Display only (read from responsibles) */}
        {(profile?.primaryResponsible ||
          (profile?.responsibles && profile.responsibles.length > 0)) && (
          <>
            <Section title="Emergency Contact" className="mb-4" />
            <View className="mb-6 rounded-2xl bg-secondary p-5">
              <ThemedText className="mb-3 text-xs opacity-50">
                Emergency contacts are managed by your gym administrator.
              </ThemedText>
              {(() => {
                const emergencyContact = profile.primaryResponsible || profile.responsibles[0];
                return (
                  <>
                    <View className="mb-3">
                      <ThemedText className="text-sm opacity-70">Name</ThemedText>
                      <ThemedText className="font-semibold">
                        {emergencyContact.firstName} {emergencyContact.lastName}
                      </ThemedText>
                    </View>
                    <View className="mb-3">
                      <ThemedText className="text-sm opacity-70">Email</ThemedText>
                      <ThemedText className="font-semibold">{emergencyContact.email}</ThemedText>
                    </View>
                    <View>
                      <ThemedText className="text-sm opacity-70">Relationship</ThemedText>
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
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={saving}
          />
        </View>

        {/* Cancel Button */}
        <View className="mb-8">
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </View>
  );
}
