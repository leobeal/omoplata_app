import { View, Image, ScrollView, Pressable } from 'react-native';
import Header, { HeaderIcon } from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Avatar from '@/components/Avatar';
import ListLink from '@/components/ListLink';
import AnimatedView from '@/components/AnimatedView';
import ThemedScroller from '@/components/ThemeScroller';
import { shadowPresets } from '@/utils/useShadow';
import React from 'react';
import Icon from '@/components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/Button';
import { Link } from 'expo-router';

export default function WorkoutDetailScreen() {
    return (
        <>
            <Header showBackButton className='bg-secondary' rightComponents={[<Icon name="Share2" />]} />
            <ThemedScroller className='!px-0'>
                <View className='p-global pt-0 bg-secondary'>
                    <Image style={{objectFit: 'cover'}} source={require('@/assets/_global/img/muscles.png')} className='w-full h-72 ' />
                    <ThemedText className='text-2xl font-bold'>Strength training</ThemedText>
                    <ThemedText className='text-sm opacity-50'>June 23, 2025</ThemedText>
                    <View className='py-global border-y border-border my-global'>
                        <View>
                            <ThemedText className='text-3xl font-bold '>45 min</ThemedText>
                            <ThemedText className='text-sm opacity-50'>Total time</ThemedText>
                        </View>
                    </View>
                    <View className='flex-row items-center w-full'>
                        <View className='flex-1'>
                            <View className='flex-row items-center'>
                                <Icon name="Heart" size={15} />
                                <ThemedText className='text-xl font-bold ml-2'>104 bpm</ThemedText>
                            </View>
                            <ThemedText className='text-sm opacity-50'>Avg HR</ThemedText>
                        </View>
                        <View className='flex-1'>
                            <View className='flex-row items-center'>
                                <Icon name="Flame" size={15} />
                                <ThemedText className='text-xl font-bold ml-2'>241</ThemedText>
                            </View>
                            <ThemedText className='text-sm opacity-50'>Total calories</ThemedText>
                        </View>
                    </View>
                </View>
                <WorkoutTable />
            </ThemedScroller>
        </>
    );
}


const WorkoutTable = () => {
    const workoutData = [
        { set: 1, name: 'Bench Press', time: '2:30', reps: 12, weight: '80kg' },
        { set: 2, name: 'Bench Press', time: '2:45', reps: 10, weight: '85kg' },
        { set: 3, name: 'Bench Press', time: '3:00', reps: 8, weight: '90kg' },
        { set: 4, name: 'Incline Press', time: '2:20', reps: 12, weight: '70kg' },
        { set: 5, name: 'Incline Press', time: '2:35', reps: 10, weight: '75kg' },
        { set: 6, name: 'Dumbbell Flyes', time: '1:45', reps: 15, weight: '25kg' },
    ];

    return (
        <View className="bg-secondary rounded-lg overflow-hidden mt-global">
            {/* Header */}
            <View className="flex-row bg-background dark:bg-dark-primary py-3 px-4">
                <ThemedText className="w-10 text-xs font-semibold opacity-60">SET</ThemedText>
                <ThemedText className="flex-1 text-xs font-semibold opacity-60">EXERCISE</ThemedText>
                <ThemedText className="flex-1 text-xs font-semibold opacity-60 text-center">TIME</ThemedText>
                <ThemedText className="flex-1 text-xs font-semibold opacity-60 text-center">REPS</ThemedText>
                <ThemedText className="flex-1 text-xs font-semibold opacity-60 text-right">WEIGHT</ThemedText>
            </View>
            
            {/* Rows */}
            {workoutData.map((item, index) => (
                <View 
                    key={index} 
                    className={`flex-row py-4 px-4 ${index % 2 === 0 ? 'bg-secondary' : 'bg-background dark:bg-dark-primary'}`}
                >
                    <ThemedText className="w-10 text-base font-medium">{item.set}</ThemedText>
                    <ThemedText className="flex-1 text-base">{item.name}</ThemedText>
                    <ThemedText className="flex-1 text-base text-center">{item.time}</ThemedText>
                    <ThemedText className="flex-1 text-base text-center">{item.reps}</ThemedText>
                    <ThemedText className="flex-1 text-base text-right font-medium">{item.weight}</ThemedText>
                </View>
            ))}
        </View>
    );
}