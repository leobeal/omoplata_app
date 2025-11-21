import React, { useRef, useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Pressable, Text, Animated } from 'react-native';
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

type WorkoutState = 'ready' | 'working' | 'resting';

export default function WorkoutTrackerScreen() {
    const [workoutState, setWorkoutState] = useState<WorkoutState>('ready');
    const [currentSet, setCurrentSet] = useState(1);
    const [totalWorkoutTime, setTotalWorkoutTime] = useState(0);
    const [currentTimer, setCurrentTimer] = useState(0);
    const [reps, setReps] = useState(14);

    // Timer effect for total workout time
    useEffect(() => {
        const interval = setInterval(() => {
            setTotalWorkoutTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Timer effect for current activity (set or rest)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (workoutState === 'working' || workoutState === 'resting') {
            interval = setInterval(() => {
                setCurrentTimer(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [workoutState]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSetButtonPress = () => {
        if (workoutState === 'ready') {
            // Start working
            setWorkoutState('working');
            setCurrentTimer(0);
        } else if (workoutState === 'working') {
            // Start resting
            setWorkoutState('resting');
            setCurrentTimer(0);
        } else if (workoutState === 'resting') {
            // Next set
            setCurrentSet(prev => prev + 1);
            setWorkoutState('working');
            setCurrentTimer(0);
        }
    };

    const getButtonText = () => {
        switch (workoutState) {
            case 'ready': return 'Start';
            case 'working': return 'Stop';
            case 'resting': return 'Next Set';
            default: return 'Start';
        }
    };

    const getTimerLabel = () => {
        switch (workoutState) {
            case 'ready': return 'Timer';
            case 'working': return 'Set Time';
            case 'resting': return 'Rest Time';
            default: return 'Timer';
        }
    };

    return (
        <>
            <View className='flex-1'>
                <Header className='bg-secondary' title='Workout' showBackButton
                    rightComponents={[
                        <View className='flex-row items-center justify-center px-3 py-1 bg-background rounded-full border border-border'>
                            <ThemedText className='text-lg font-semibold'>{formatTime(totalWorkoutTime)}</ThemedText>
                            <View className='w-3 h-3 bg-highlight rounded-full ml-4' />
                        </View>
                    ]} />
                    <View className=' bg-secondary items-center justify-center py-global'>
                        <View className='flex-row items-center justify-between w-full px-8'>
                            <View className='items-center w-24 h-24 border border-border bg-background rounded-full justify-center'>
                                <ThemedText className='text-sm'>Set</ThemedText>
                                <ThemedText className='text-lg font-bold'>{currentSet}</ThemedText>
                            </View>
                            <SetButton 
                                onPress={handleSetButtonPress}
                                text={getButtonText()}
                                isActive={workoutState === 'working'}
                            />
                            <View className='items-center w-24 h-24 border border-border bg-background rounded-full justify-center'>
                                <ThemedText className='text-sm'>Reps</ThemedText>
                                <ThemedText className='text-lg font-bold'>{reps}</ThemedText>
                            </View>
                        </View>
                        <View className='w-full flex-row mt-6  items-center justify-between'>
                            <View className='h-px flex-1 bg-border' />
                            <View className='items-center w-24 h-24 border border-border bg-background rounded-full justify-center'>
                                <ThemedText className='text-sm'>{getTimerLabel()}</ThemedText>
                                <ThemedText className='text-lg font-bold'>{formatTime(currentTimer)}</ThemedText>
                            </View>
                            <View className='h-px flex-1 bg-border' />
                        </View>
                    </View>
                <ThemedScroller className='!px-0'>
                    

                    <View className='p-global'>
                        <SetCard title='Press up' description='2 sets' timer={formatTime(currentTimer)} isActive={true} />
                        <SetCard title='Dumbbell press' description='3 sets' timer='0:00' isActive={false} />
                        <SetCard title='Push up' description='2 sets' timer='0:00' isActive={false} />
                        <SetCard title='Pull up' description='2 sets' timer='0:00' isActive={false} />
                        <SetCard title='Incline push up' description='2 sets' timer='0:00' isActive={false} />
                        <SetCard title='Incline pull up' description='2 sets' timer='0:00' isActive={false} />
                    </View>

                </ThemedScroller>
                <ThemedFooter>
                    <Button title='Finish' size='large' rounded='full' />
                </ThemedFooter>

            </View>

        </>
    );
}

const SetCard = (props: any) => {
    return (
        <View className={`p-5 rounded-2xl bg-secondary flex flex-row items-center justify-start mb-3 ${props.isActive ? 'border border-highlight' : 'border border-transparent'}`}>
            <View>
                <ThemedText className='font-semibold text-base '>{props.title}</ThemedText>
                <ThemedText className='text-sm'>{props.description}</ThemedText>
            </View>
            <View className='ml-auto flex-row items-center justify-center'>
                <ThemedText className='text-sm mr-4'>{props.timer}</ThemedText>
                {props.isActive ? <View className='w-3 h-3 bg-highlight rounded-full' /> : <View className='w-3 h-3 bg-border rounded-full' />}
            </View>
        </View>
    )
}

const SetButton = ({ onPress, text, isActive }: { onPress: () => void, text: string, isActive: boolean }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isActive) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isActive, pulseAnim]);

    return (
        <View className='w-40 h-40 bg-background rounded-full border border-text items-center justify-center p-4'>
            <Animated.View 
                style={{ 
                    transform: [{ scale: pulseAnim }],
                    width: '100%',
                    height: '100%'
                }}
            >
                <Pressable 
                    onPress={onPress} 
                    className={`w-full h-full rounded-full items-center justify-center ${
                        isActive ? 'bg-text' : 'bg-text'
                    }`}
                >
                    <Text className={`text-base uppercase font-semibold ${
                        isActive ? 'text-background' : 'text-background'
                    }`}>
                        {text}
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    )
}
