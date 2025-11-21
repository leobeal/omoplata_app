import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, ImageBackground } from 'react-native';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
export default function OnboardingStart() {
    const insets = useSafeAreaInsets();



    return (
        <>

            <ImageBackground source={require('@/assets/_global/img/welcome.jpg')} style={{ flex: 1 }}>
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', }}
                >
                    <View className=" flex-1 flex justify-end h-full items-start p-6">


                        <View>
                            <ThemedText className='text-4xl text-white font-outfit-bold mt-auto'>Welcome, John</ThemedText>
                            <ThemedText className='text-base text-white mt-2'>We're excited to have you join us! Let's get your account set up with a few quick steps.</ThemedText>
                        </View>
                        <View className=' mt-6 w-full' style={{ paddingBottom: insets.bottom }}>
                            <Button size="large" className='!bg-highlight' textClassName='text-white' rounded="full" title="Let's go" href='/screens/onboarding' />
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </>
    );
} 