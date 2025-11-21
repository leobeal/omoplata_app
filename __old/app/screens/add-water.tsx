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
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';



export default function AddWaterScreen() {
    return (
        <View className='flex-1 bg-background relative'>
            <Header className='bg-transparent' title='Add Water' showBackButton />


                <View className='flex-1 items-center justify-center relative w-full'>
                    <WaterBar />
                </View>
            <ThemedFooter className='!bg-transparent'>
                <Button title='Add Water' className="!bg-highlight" textClassName='!text-white' onPress={() => { }} />
            </ThemedFooter>
        </View>
    );
}


const WaterBar = () => {
    const [waterAmount, setWaterAmount] = useState(100);
    const waterHeight = useSharedValue(20); // Start at 20% height

    const animatedStyle = useAnimatedStyle(() => {
        return {
            height: `${waterHeight.value}%`,
        };
    });

    const handleDecrease = () => {
        if (waterAmount > 0) {
            const newAmount = waterAmount - 100;
            setWaterAmount(newAmount);
            // Calculate percentage: 0ml = 0%, 500ml = 100%
            const percentage = (newAmount / 500) * 100;
            waterHeight.value = withSpring(percentage);
        }
    };

    const handleIncrease = () => {
        if (waterAmount < 500) {
            const newAmount = waterAmount + 100;
            setWaterAmount(newAmount);
            // Calculate percentage: 0ml = 0%, 500ml = 100%
            const percentage = (newAmount / 500) * 100;
            waterHeight.value = withSpring(percentage);
        }
    };

    return (
        <>
            <View className='relative z-10'>
                <View className='flex-row items-center justify-between'>
                    <Icon
                        onPress={handleDecrease}
                        name='Minus'
                        size={20}
                        className={`w-10 border border-border h-10 rounded-full ${waterAmount <= 0 ? 'bg-border opacity-50' : 'bg-secondary'}`}
                    />
                    <View className='mx-4 items-center mt-8'>
                        <View style={{ height: 200, ...shadowPresets.large }} className='w-6 bg-secondary rounded-3xl relative justify-end overflow-hidden'>
                            <View className='w-full h-full justify-between absolute top-0 left-0 z-50 opacity-30'>
                                <View className='w-full h-px bg-transparent' />
                                <View className='w-full h-px bg-text' />
                                <View className='w-full h-px bg-text' />
                                <View className='w-full h-px bg-text' />
                                <View className='w-full h-px bg-text' />
                                <View className='w-full h-px bg-transparent' />
                            </View>
                            <Animated.View style={animatedStyle} className='w-full bg-highlight' />
                        </View>
                        <ThemedText className='mt-4 text-lg font-semibold'>{waterAmount} ml</ThemedText>
                    </View>

                    <Icon
                        onPress={handleIncrease}
                        name='Plus'
                        size={20}
                        className={`w-10 border border-border h-10 rounded-full ${waterAmount >= 500 ? 'bg-border opacity-50' : 'bg-secondary'}`}
                    />
                </View>
                <View className='flex-row items-center justify-between gap-2 mt-8'>
                    <GlassCard amount={200} />
                    <GlassCard amount={300} />
                    <GlassCard amount={500} />
                </View>
            </View>
            {/*<View className=' items-center h-screen w-screen absolute bottom-0 left-0 right-0 opacity-10'>
                <View style={{ height: "100%", ...shadowPresets.large }} className='w-screen bg-transparent  relative justify-end overflow-hidden'>
                    <Animated.View style={animatedStyle} className='w-full bg-highlight' />
                </View>
            </View>*/}
        </>
    )
}

const GlassCard = (props: any) => {
    return (
        <Pressable className='w-28 py-4 bg-secondary rounded-xl relative items-center justify-center'>
            <Icon name='GlassWater' size={20} className='w-12 h-12 bg-background rounded-full' />
            <ThemedText className='text-sm mt-4 font-semibold'>{props.amount} ml</ThemedText>
        </Pressable>
    )
}




