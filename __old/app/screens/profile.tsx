import { View, Image, ScrollView, Pressable } from 'react-native';
import Header, { HeaderIcon } from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Avatar from '@/components/Avatar';
import ListLink from '@/components/ListLink';
import AnimatedView from '@/components/AnimatedView';
import ThemedScroller from '@/components/ThemeScroller';
import { shadowPresets } from '@/utils/useShadow';
import React from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/Button';
import { Link } from 'expo-router';

export default function ProfileScreen() {
    return (
        <>
            <Header showBackButton title="Profile" rightComponents={[<ThemeToggle />]} />
            <ThemedScroller className='px-6 pt-4'>
                <View style={shadowPresets.medium} className=" pt-10 pb-10 mb-4 w-full flex-row bg-secondary rounded-2xl ">
                    <View className="flex-col w-1/2 items-center">
                        <Avatar src={require('@/assets/_global/img/user-3.jpg')} size="xl" />
                        <View className="flex-1 items-center mt-4">
                            <ThemedText className="text-2xl font-bold">John Doe</ThemedText>
                            <View className='flex flex-row items-center'>
                                <ThemedText className='text-sm text-light-subtext dark:text-dark-subtext'>johndoe@gmail.com</ThemedText>
                            </View>
                        </View>
                    </View>
                    <View className="flex-col w-1/2 items-start pl-10 border-l border-border ">
                        <View className="flex-col flex-1 justify-center">
                            <ThemedText className="text-xl font-bold">74kg</ThemedText>
                            <ThemedText className="opacity-50 font-xs">Current weight</ThemedText>
                        </View>
                        <View className="flex-col flex-1 justify-center">
                            <ThemedText className="text-xl font-bold">2400</ThemedText>
                            <ThemedText className="opacity-50 font-xs">Daily calories</ThemedText>
                        </View>
                    </View>
                </View>
                <UpgradeToPlus />

                <View style={shadowPresets.medium} className='bg-secondary rounded-2xl mt-4'>
                    <ListLink className='px-5' hasBorder title="Settings" description='Manage your account settings' icon="Settings" href="/screens/edit-profile" />
                    <ListLink className='px-5' hasBorder title="Subscription" description='Renews July 25, 2025' icon="Trophy" href="/screens/subscription" />
                    <ListLink className='px-5' hasBorder title="Devices" description='Garmin + Apple Watch' icon="Watch" href="/screens/devices" />
                    <ListLink className='px-5' hasBorder title="Help" description='Get help' icon="HelpCircle" href="/screens/help" />
                    <ListLink className='px-5' hasBorder title="Onboarding" description='Complete onboarding' icon="Star" href="/screens/onboarding-start" />
                    <ListLink className='px-5' title="Logout" description='Logout of your account' icon="LogOut" href="/screens/welcome" />
                </View>
            </ThemedScroller>
        </>
    );
}

const UpgradeToPlus = () => {
    return (
        <LinearGradient
            colors={['#FF6B6B', '#4ECDC4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 2 }}
            style={{ borderRadius: 10, ...shadowPresets.medium }}>
            <Link asChild href="/screens/subscription">
                <Pressable className='p-6 flex flex-row justify-between items-center'>
                    <View>
                        <ThemedText className="text-xl text-white font-outfit-bold">Go premium</ThemedText>
                        <ThemedText className="text-sm text-white">Unlock all features</ThemedText>
                    </View>
                    <Button variant='outline' href='/screens/subscription' rounded='xl' title="Upgrade now" textClassName='text-white' className='border-white' />
                </Pressable>
            </Link>
        </LinearGradient>
    );
}