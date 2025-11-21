import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import Input from '@/components/forms/Input';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

export default function EditProfileScreen() {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <>
      <Header showBackButton
        title="Profile Settings"
        rightComponents={[
          <Button title="Save changes" />
        ]}
      />
      <ThemedScroller>

        <View className="items-center flex-col mb-8 my-14 bg-secondary rounded-2xl p-10 w-[220px] mx-auto">
          <TouchableOpacity
            onPress={pickImage}
            className="relative"
            activeOpacity={0.9}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="w-28 h-28 rounded-full"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-background items-center justify-center">
                <Icon name="Plus" size={25} className="text-light-subtext dark:text-dark-subtext" />
              </View>
            )}

          </TouchableOpacity>
          <View className='mt-4'>
            <Button variant='outline' title={profileImage ? 'Change photo' : 'Upload photo'} className="text-sm text-light-subtext dark:text-dark-subtext" onPress={pickImage} />

            {profileImage && (
              <Button
                className='mt-2'
                title="Remove photo"
                variant="outline"
                onPress={() => setProfileImage(null)}
              />
            )}
          </View>
        </View>
        <Section titleSize='xl' className='pt-4 pb-8' title="Personal information" subtitle="Manage your personal information">
          <Input
            label="First Name"
            value="John"
            keyboardType="email-address"
            autoCapitalize="none"
            containerClassName='mt-8' />
          <Input
            label="Last Name"
            value="Doe"
            containerClassName='flex-1'
            keyboardType="email-address"
            autoCapitalize="none" />

          <Input
            label="Email"
            keyboardType="email-address"
            value="john.doe@example.com"
            autoCapitalize="none" />
        </Section>

        <Section titleSize='xl' className='pt-4 pb-8' title="Units" subtitle="Metric or imperial">
          <View className='mt-4'>
            <MetricPicker defaultSelected="cm" option1="cm" option2="in" />
            <MetricPicker defaultSelected="kg" option1="kg" option2="lb" />
          </View>
        </Section>



      </ThemedScroller>
    </>
  );
}


const MetricPicker = (props: { defaultSelected: string, option1: string, option2: string }) => {
  const [selected, setSelected] = useState(props.defaultSelected);

  return (
    <View className='w-full p-1 bg-secondary rounded-xl flex-row mb-4'>
      <Pressable
        className={`flex-1 rounded-lg flex items-center justify-center py-3 ${selected === props.option1 ? 'bg-text' : ''}`}
        onPress={() => setSelected(props.option1)}
      >
        <ThemedText className={selected === props.option1 ? '!text-background' : ''}>{props.option1}</ThemedText>
      </Pressable>
      <Pressable
        className={`flex-1 rounded-lg flex items-center justify-center py-3 ${selected === props.option2 ? 'bg-text' : ''}`}
        onPress={() => setSelected(props.option2)}
      >
        <ThemedText className={selected === props.option2 ? '!text-background' : ''}>{props.option2}</ThemedText>
      </Pressable>
    </View>
  )
}