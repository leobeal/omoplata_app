import React, { useRef, useState } from 'react';
import { View, Image, TouchableOpacity, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import useThemeColors from '../contexts/ThemeColors';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import ThemedFooter from '@/components/ThemeFooter';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';

export default function EditProfileScreen() {
    const [selectedPlan, setSelectedPlan] = useState('Monthly');
    const actionSheetRef = useRef<ActionSheetRef>(null);
    return (
        <>
            <View className='flex-1 bg-background'>
                <Header showBackButton />
                <ThemedScroller>

                    <View className='w-3/4 mb-10 '>
                        <ThemedText className='font-semibold text-5xl '>Get your first month for free</ThemedText>
                        <ThemedText className='text-lg font-light mt-2'>Unlock all premium features</ThemedText>
                    </View>
                    <SubscriptionCard
                        icon='Star'
                        title='Weekly'
                        description='Unlock all premium features'
                        price='$19.99'
                        active={selectedPlan === 'Weekly'}
                        onPress={() => setSelectedPlan('Weekly')}
                    />
                    <SubscriptionCard
                        icon='Trophy'
                        title='Monthly'
                        description='All premium features + goal tracker'
                        price='$29.99'
                        discount='20%'
                        active={selectedPlan === 'Monthly'}
                        onPress={() => setSelectedPlan('Monthly')}
                    />
                    <SubscriptionCard
                        icon='Medal'
                        title='Yearly'
                        description='All premium features + goal tracker + 1000+ recipes'
                        price='$199.99'
                        discount='50%'
                        active={selectedPlan === 'Yearly'}
                        onPress={() => setSelectedPlan('Yearly')}
                    />
                </ThemedScroller>
                <ThemedFooter>
                    <ThemedText className='text-sm font-light text-center mb-4'>1 month free trial then $29.99/month</ThemedText>
                    <Button onPress={() => actionSheetRef.current?.show()} className='!bg-highlight' textClassName='!text-white' size='large' rounded='full' title="Upgrade to plus" />
                </ThemedFooter>
            </View>
            <ActionSheetThemed 
            gestureEnabled
            containerStyle={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 10,
            }}
            ref={actionSheetRef}>
                <View className='px-6 pt-10 items-center'>
                    <Icon name='Check' size={24} className='w-20 h-20 bg-background rounded-full mb-6' />
                    <ThemedText className='font-semibold text-4xl'>All setup</ThemedText>
                    <ThemedText className='text-lg text-center px-14 font-light mt-2 mb-32'>Hope you are satisfied. We will update you for the next subscription date.</ThemedText>
                    <Button onPress={() => actionSheetRef.current?.hide()} className='!bg-highlight' textClassName='!text-white' size='large' rounded='full' title="Upgrade to plus" />
                </View>
            </ActionSheetThemed>
        </>
    );
}

const SubscriptionCard = (props: any) => {
    const colors = useThemeColors()
    return (
        <Pressable onPress={props.onPress} className={`bg-secondary rounded-xl relative flex-row items-center border-border border mb-4 ${props.active ? 'border-highlight' : ''}`}>
            {props.discount && <ThemedText className='text-xs absolute top-2 right-2 font-semibold bg-highlight text-white rounded-full px-2 py-1  ml-2'>{props.discount} off</ThemedText>}
            <View className=' px-6'>
                <Icon name={props.icon} size={24} color={props.active ? 'white' : colors.text} className={`w-20 h-20 rounded-full ${props.active ? 'bg-highlight' : 'bg-background'}`} />
            </View>
            <View className='py-6 pl-6 border-l border-border flex-1'>
                <ThemedText className='font-semibold text-2xl'>{props.title}</ThemedText>
                <ThemedText className='text-sm font-light'>{props.description}</ThemedText>
                <View className='flex-row items-center'>
                    <ThemedText className='text-lg font-bold mt-2'>{props.price}</ThemedText>
                </View>
            </View>
        </Pressable>
    );
}