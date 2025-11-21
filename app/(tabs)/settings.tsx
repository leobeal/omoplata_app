import { View, Pressable } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Avatar from '@/components/Avatar';
import ListLink from '@/components/ListLink';
import ThemedScroller from '@/components/ThemedScroller';
import React from 'react';
import { Button } from '@/components/Button';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  return (
    <>
      <Header title="Settings" />
      <ThemedScroller className="px-6 pt-4">
        <View className="mb-4 w-full flex-row rounded-2xl bg-secondary pb-10 pt-10">
          <View className="w-1/2 flex-col items-center">
            <Avatar name="John Doe" size="xl" />
            <View className="mt-4 flex-1 items-center">
              <ThemedText className="text-2xl font-bold">John Doe</ThemedText>
              <View className="flex flex-row items-center">
                <ThemedText className="text-light-subtext dark:text-dark-subtext text-sm">
                  johndoe@example.com
                </ThemedText>
              </View>
            </View>
          </View>
          <View className="w-1/2 flex-col items-start border-l border-border pl-10">
            <View className="flex-1 flex-col justify-center">
              <ThemedText className="text-xl font-bold">Premium</ThemedText>
              <ThemedText className="font-xs opacity-50">Current plan</ThemedText>
            </View>
            <View className="flex-1 flex-col justify-center">
              <ThemedText className="text-xl font-bold">24</ThemedText>
              <ThemedText className="font-xs opacity-50">Classes this month</ThemedText>
            </View>
          </View>
        </View>

        <UpgradePrompt />

        <View className="mt-4 rounded-2xl bg-secondary">
          <ListLink
            className="px-5"
            hasBorder
            title="Edit Profile"
            description="Update your personal information"
            icon="User"
            href="/screens/edit-profile"
          />
          <ListLink
            className="px-5"
            hasBorder
            title="Membership"
            description="Manage your subscription"
            icon="CreditCard"
            href="/screens/memberships"
          />
          <ListLink
            className="px-5"
            hasBorder
            title="Notifications"
            description="Class reminders & updates"
            icon="Bell"
            href="/screens/notifications"
          />
          <ListLink
            className="px-5"
            hasBorder
            title="Help & Support"
            description="Get help with your account"
            icon="HelpCircle"
            href="/screens/help"
          />
          <ListLink
            className="px-5"
            title="Logout"
            description="Sign out of your account"
            icon="LogOut"
            href="/screens/login"
          />
        </View>
      </ThemedScroller>
    </>
  );
}

const UpgradePrompt = () => {
  return (
    <LinearGradient
      colors={['#4CAF50', '#2E7D32']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 2 }}
      style={{ borderRadius: 10 }}>
      <Link asChild href="/screens/plans">
        <Pressable className="flex flex-row items-center justify-between p-6">
          <View>
            <ThemedText className="text-xl font-bold text-white">Upgrade Membership</ThemedText>
            <ThemedText className="text-sm text-white">Unlock unlimited classes</ThemedText>
          </View>
          <Button
            variant="outline"
            href="/screens/plans"
            rounded="xl"
            title="View Plans"
            textClassName="text-white"
            className="border-white"
          />
        </Pressable>
      </Link>
    </LinearGradient>
  );
};
