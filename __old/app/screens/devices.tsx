import React, { useRef, useState } from 'react';
import { View, Image, TouchableOpacity, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import Input from '@/components/forms/Input';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import ThemedFooter from '@/components/ThemeFooter';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';

export default function DevicesScreen() {

    return (
        <>
            <View className='flex-1'>
                <Header className='bg-secondary' title="Connected devices" showBackButton />
                <ThemedScroller className='!px-0'>
                    <View className='p-global bg-secondary items-center justify-center'>
                        <Image style={{ objectFit: 'cover' }} source={require('@/assets/_global/img/smartwatch.png')} className='w-2/3 h-72 ' />
                    </View>

                    <View className='p-global'>
                        <DeviceCard title='Garmin' description='Vivoactive 5' isActive={true} />
                        <DeviceCard title='Apple Watch' description='Not connected' isActive={false} />
                        <DeviceCard title='Pixel Watch' description='Not connected' isActive={false} />
                        <DeviceCard title='Fitbit' description='Not connected' isActive={false} />
                    </View>

                </ThemedScroller>

            </View>

        </>
    );
}

const DeviceCard = (props: any) => {
    return (
        <View className='p-5 rounded-2xl bg-secondary flex flex-row items-center justify-start mb-3'>
            <Icon name='Watch' size={20} className='w-12 h-12 bg-background rounded-full mr-4' />
            <View>
                <ThemedText className='font-semibold text-base '>{props.title}</ThemedText>
                <ThemedText className='text-lxsg font-light'>{props.description}</ThemedText>
            </View>
            <View className='ml-auto'>
                {props.isActive ? <Button title='Disconnect' size='small' /> : <Button title='Connect' variant='outline' size='small' />}
            </View>
        </View>
    )
}
