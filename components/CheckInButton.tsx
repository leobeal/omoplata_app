import React from 'react';
import Icon from './Icon';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

const CheckInButton = () => {
  const handlePress = () => {
    router.push('/screens/checkin');
  };

  return (
    <View className="relative flex flex-col items-center justify-center">
      <Pressable
        onPress={handlePress}
        className="flex h-16 w-16 -translate-y-2 items-center justify-center rounded-full bg-highlight">
        <Icon name="QrCode" size={24} strokeWidth={2} color="white" />
      </Pressable>
    </View>
  );
};

export default CheckInButton;
