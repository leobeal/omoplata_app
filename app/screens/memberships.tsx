import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import { useThemeColors } from '@/contexts/ThemeColors';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

export default function MembershipsScreen() {
  const [selectedPlan, setSelectedPlan] = useState('Monthly');

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title="Membership Plans" />
      <ThemedScroller>
        <View className="mb-10 w-3/4">
          <ThemedText className="text-5xl font-semibold">Choose your plan</ThemedText>
          <ThemedText className="mt-2 text-lg font-light">
            Flexible membership options for your fitness journey
          </ThemedText>
        </View>

        <MembershipCard
          icon="User"
          title="Basic"
          description="Perfect for getting started"
          price="$29.99"
          features={[
            'Access to gym floor',
            '10 group classes per month',
            'Basic equipment',
            'Locker access',
          ]}
          active={selectedPlan === 'Basic'}
          onPress={() => setSelectedPlan('Basic')}
        />

        <MembershipCard
          icon="Star"
          title="Monthly Premium"
          description="Most popular for dedicated members"
          price="$79.99"
          discount="20%"
          features={[
            'Unlimited gym access',
            'Unlimited group classes',
            'Personal training session',
            'Premium locker',
            'Guest passes (2/month)',
          ]}
          active={selectedPlan === 'Monthly'}
          onPress={() => setSelectedPlan('Monthly')}
        />

        <MembershipCard
          icon="Award"
          title="Annual Premium"
          description="Best value for committed athletes"
          price="$799.99"
          discount="50%"
          features={[
            'All Premium features',
            '4 personal training sessions',
            'Nutrition consultation',
            'Free merchandise',
            'Priority class booking',
            'Guest passes (5/month)',
          ]}
          active={selectedPlan === 'Annual'}
          onPress={() => setSelectedPlan('Annual')}
        />

        <View className="mb-4 mt-8">
          <Button
            className="!bg-highlight"
            textClassName="!text-white"
            size="large"
            rounded="full"
            title={`Select ${selectedPlan} Plan`}
            onPress={() => {
              // TODO: Implement membership selection
              console.log(`Selected: ${selectedPlan}`);
            }}
          />
        </View>

        <View className="mb-8">
          <ThemedText className="text-center text-sm opacity-50">
            All plans include access to our state-of-the-art facilities
          </ThemedText>
        </View>
      </ThemedScroller>
    </View>
  );
}

interface MembershipCardProps {
  icon: string;
  title: string;
  description: string;
  price: string;
  discount?: string;
  features: string[];
  active: boolean;
  onPress: () => void;
}

const MembershipCard = (props: MembershipCardProps) => {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={props.onPress}
      className={`relative mb-4 flex-col rounded-xl border border-border bg-secondary ${
        props.active ? 'border-2 border-highlight' : ''
      }`}>
      {props.discount && (
        <ThemedText className="absolute right-2 top-2 z-10 ml-2 rounded-full bg-highlight px-2 py-1 text-xs font-semibold text-white">
          {props.discount} off
        </ThemedText>
      )}

      <View className="flex-row items-center border-b border-border p-6">
        <View className="pr-6">
          <Icon
            name={props.icon as any}
            size={24}
            color={props.active ? 'white' : colors.text}
            className={`h-16 w-16 rounded-full ${props.active ? 'bg-highlight' : 'bg-background'}`}
          />
        </View>
        <View className="flex-1">
          <ThemedText className="text-2xl font-semibold">{props.title}</ThemedText>
          <ThemedText className="text-sm font-light">{props.description}</ThemedText>
          <View className="mt-2 flex-row items-center">
            <ThemedText className="text-lg font-bold">{props.price}</ThemedText>
            <ThemedText className="ml-2 text-sm opacity-50">/month</ThemedText>
          </View>
        </View>
      </View>

      <View className="p-6">
        <ThemedText className="mb-3 text-sm font-semibold opacity-70">WHAT'S INCLUDED</ThemedText>
        {props.features.map((feature, index) => (
          <View key={index} className="mb-2 flex-row items-center">
            <Icon
              name="Check"
              size={16}
              color={props.active ? colors.highlight : colors.text}
              className="mr-2"
            />
            <ThemedText className="text-sm">{feature}</ThemedText>
          </View>
        ))}
      </View>
    </Pressable>
  );
};
