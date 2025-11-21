import { View, Image, ScrollView, Pressable, TextInput } from 'react-native';
import Header, { HeaderIcon } from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeColors from '../contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';
import React, { useState } from 'react';
import Icon from '@/components/Icon';
import ThemedFooter from '@/components/ThemeFooter';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';




export default function AddWeightScreen() {
    return (
        <View className='flex-1 bg-background relative'>
            <Header className='bg-transparent' title='Add Weight' showBackButton />
                <View className='flex-1 items-center justify-center relative w-full'>
                    <WeightBar />
                </View>
            <ThemedFooter className='!bg-transparent'>
                <Button title='Add Weight' className="!bg-highlight" textClassName='!text-white' onPress={() => { }} />
            </ThemedFooter>
        </View>
    );
}


const WeightBar = () => {
    const [isKgActive, setIsKgActive] = useState(true);
    const [weight, setWeight] = useState(74.3);

    const handleDecrease = () => {
        const increment = isKgActive ? 0.1 : 0.2;
        const minWeight = isKgActive ? 30 : 66;
        
        if (weight > minWeight) {
            setWeight(prev => Math.max(minWeight, prev - increment));
        }
    };

    const handleIncrease = () => {
        const increment = isKgActive ? 0.1 : 0.2;
        const maxWeight = isKgActive ? 200 : 440;
        
        if (weight < maxWeight) {
            setWeight(prev => Math.min(maxWeight, prev + increment));
        }
    };

    const getDisplayValue = () => {
        if (isKgActive) {
            return `${weight.toFixed(1)} kg`;
        } else {
            return `${(weight * 2.20462).toFixed(1)} lb`;
        }
    };

    return (
        <>
            <View className='relative z-10 flex-1 px-global'>
                <View className='flex-row p-1 bg-secondary rounded-xl overflow-hidden mt-10'>
                    <Pressable
                        onPress={() => setIsKgActive(true)}
                        className={`flex-1 py-2.5 px-4 rounded-xl ${isKgActive ? "bg-background" : "bg-transparent"}`}
                    >
                        <ThemedText className="text-center text-sm font-medium">
                            KG
                        </ThemedText>
                    </Pressable>
                    <Pressable
                        onPress={() => setIsKgActive(false)}
                        className={`flex-1 py-2.5 px-4 rounded-xl ${!isKgActive ? "bg-background" : "bg-transparent"}`}
                    >
                        <ThemedText className="text-center text-sm font-medium">
                            LB
                        </ThemedText>
                    </Pressable>
                </View>
                <View className='flex-row items-center justify-between flex-1 pb-20 w-full'>
                    <Icon
                        onPress={handleDecrease}
                        name='Minus'
                        size={20}
                        className={`w-10 border border-border h-10 rounded-full ${
                            weight <= (isKgActive ? 30 : 66) ? 'bg-border opacity-50' : 'bg-secondary'
                        }`}
                    />
                    <View className='mx-6'>
                        <ThemedText className='text-5xl font-semibold text-center'>
                            {getDisplayValue()}
                        </ThemedText>
                    </View>

                    <Icon
                        onPress={handleIncrease}
                        name='Plus'
                        size={20}
                        className={`w-10 border border-border h-10 rounded-full ${
                            weight >= (isKgActive ? 200 : 440) ? 'bg-border opacity-50' : 'bg-secondary'
                        }`}
                    />
                </View>
               
            </View>
         
        </>
    )
}


