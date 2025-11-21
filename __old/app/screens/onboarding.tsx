import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import MultiStep, { Step } from '@/components/MultiStep';
import Selectable from '@/components/forms/Selectable';
import ThemedText from '@/components/ThemedText';
import { Chip } from '@/components/Chip';
import Icon, { IconName } from '@/components/Icon';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import { ThemedCalendar } from '@/components/Calendar';
import { TimePicker } from '@/components/forms/TimePicker';

import { DatePicker } from '@/components/forms/DatePicker';
import Select from '@/components/forms/Select';
import { RulerPicker } from 'react-native-ruler-picker';
import { useThemeColors } from '../contexts/ThemeColors';
import WheelPickerExpo from 'react-native-wheel-picker-expo';
import { Button } from '@/components/Button';



export default function OnboardingStart() {

    return (
        <MultiStep
            onComplete={() => {
                router.push({
                    pathname: '/(drawer)/(tabs)/',
                    params: {}
                });
            }}
            onClose={() => router.push('/(drawer)/(tabs)/')}
        >
            <Step title="Sex">
                <Gender />
            </Step>

            <Step title="Birthday">
                <Birthday />
            </Step>

            <Step title="Height">
                <Height />
            </Step>

            <Step title="Weight">
                <Weight />
            </Step>

            <Step title="Trend">
                <Trend />
            </Step>
            <Step title="Frequency">
                <Frequency />
            </Step>
        </MultiStep>
    );
}


const Gender = () => {
    const [gender, setGender] = useState<'Male' | 'Female'>();

    return (
        <View className='flex-1 px-global'>
            <ThemedText className='text-center text-3xl font-bold mb-7'>What is your sex?</ThemedText>
            <Selectable title="Male" icon="Mars" onPress={() => setGender('Male')} selected={gender === 'Male'} />
            <Selectable title="Female" icon="Venus" onPress={() => setGender('Female')} selected={gender === 'Female'} />
        </View>
    )
}

const Birthday = () => {
    const [birthday, setBirthday] = useState<Date>(new Date('1990-01-01'));

    return (
        <View className='flex-1 px-global'>
            <Icon name="Cake" size={30} className='w-20 h-20 rounded-full border border-border mx-auto my-8' />
            <ThemedText className='text-center text-3xl font-bold mb-7'>When is your birthday?</ThemedText>

            <DatePicker label="Birthday" onChange={setBirthday} value={birthday} />

        </View>
    )
}

const Trend = () => {
    const [trend, setTrend] = useState<'up' | 'down' | 'stable' | 'not-sure'>();

    return (
        <View className='flex-1 px-global'>
            <ThemedText className='text-center text-3xl font-bold mb-7'>How was your weight past week?</ThemedText>
            <Selectable title="I have been gaining weight" icon="ArrowUp" onPress={() => setTrend('up')} selected={trend === 'up'} />
            <Selectable title="I have been losing weight" icon="ArrowDown" onPress={() => setTrend('down')} selected={trend === 'down'} />
            <Selectable title="I have been stable" icon="Minus" onPress={() => setTrend('stable')} selected={trend === 'stable'} />
            <Selectable title="Not sure" icon="FileQuestion" onPress={() => setTrend('not-sure')} selected={trend === 'not-sure'} />
        </View>
    )
}

const Frequency = () => {
    const [trend, setTrend] = useState<'0' | '1-3' | '4-6' | '7+'>();

    return (
        <View className='flex-1 px-global'>
            <View className=' mb-7'>
                <ThemedText className='text-center text-3xl font-bold'>How often do you exercise?</ThemedText>
                <ThemedText className='text-base opacity-60 text-center'>Estimate workouts, recreational sports or resistance training.</ThemedText>
            </View>
            <Selectable title="0 times a week" icon="Calendar" onPress={() => setTrend('0')} selected={trend === '0'} />
            <Selectable title="1-3 times a week" icon="Calendar1" onPress={() => setTrend('1-3')} selected={trend === '1-3'} />
            <Selectable title="4-6 times a week" icon="CalendarDays" onPress={() => setTrend('4-6')} selected={trend === '4-6'} />
            <Selectable title="7+ times a week" icon="CalendarRange" onPress={() => setTrend('7+')} selected={trend === '7+'} />
        </View>
    )
}

const Height = () => {
    const [height, setHeight] = useState<string>('170');
    const [unit, setUnit] = useState<'cm' | 'ft'>('cm');
    const colors = useThemeColors();

    return (
        <View className='flex-1 px-global'>
            <ThemedText className='text-center text-3xl font-bold mb-7'>How tall are you?</ThemedText>
            <View className='w-1/2 mb-20 mx-auto'>
                <View className='flex-row items-center justify-center gap-2'>
                    <Button
                        title='cm'
                        variant={unit === 'cm' ? 'primary' : 'outline'}
                        onPress={() => setUnit('cm')}
                    />
                    <Button
                        title='ft'
                        variant={unit === 'ft' ? 'primary' : 'outline'}
                        onPress={() => setUnit('ft')}
                    />
                </View>
            </View>
            <View className="flex-1 items-center justify-start">
                {unit === 'cm' ? (
                    <WheelPickerExpo
                        height={300}
                        width={150}
                        backgroundColor={colors.bg}
                        initialSelectedIndex={70}
                        items={Array.from({ length: 150 }, (_, i) => i + 100).map(h => ({
                            label: h.toString(),
                            value: h.toString()
                        }))}
                        onChange={({ item }) => setHeight(item.label)}
                    />
                ) : (
                    <WheelPickerExpo
                        height={300}
                        width={150}
                        backgroundColor={colors.bg}
                        initialSelectedIndex={10}
                        items={(() => {
                            const items = [];
                            for (let feet = 4; feet <= 7; feet++) {
                                for (let inches = 0; inches <= 11; inches++) {
                                    const label = `${feet}'${inches}"`;
                                    items.push({ label, value: `${feet}.${inches}` });
                                }
                            }
                            return items;
                        })()}
                        onChange={({ item }) => setHeight(item.label)}
                    />
                )}
            </View>
        </View>
    )
}


const Weight = () => {
    const [weight, setWeight] = useState<string>('170');
    const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
    const colors = useThemeColors();

    return (
        <View className='flex-1'>
            <ThemedText className='text-center text-3xl font-bold mb-7'>What is your weight?</ThemedText>
            <View className='w-1/2 mb-20 mx-auto'>
                <View className='flex-row items-center justify-center gap-2'>
                    <Button
                        title='kg'
                        variant={unit === 'kg' ? 'primary' : 'outline'}
                        onPress={() => setUnit('kg')}
                    />
                    <Button
                        title='lb'
                        variant={unit === 'lb' ? 'primary' : 'outline'}
                        onPress={() => setUnit('lb')}
                    />
                </View>
            </View>
            <View className='flex-1 items-center justify-center'>
                {Platform.OS === 'ios' ? (
                    <ThemedText className='text-center text-5xl font-bold translate-y-20'>{weight} {unit}</ThemedText>
                ) : (
                    <></>
                )}
                {unit === 'kg' ? (
                    <RulerPicker
                        min={40}
                        max={200}
                        step={1}
                        fractionDigits={0}
                        initialValue={80}
                        unit="kg"
                        indicatorColor={colors.text}
                        valueTextStyle={{ color: `${Platform.OS === 'ios' ? 'transparent' : colors.text}` }}
                        unitTextStyle={{ color: `${Platform.OS === 'ios' ? 'transparent' : colors.text}` }}
                        onValueChange={(value) => setWeight(value)}
                    />
                ) : (
                    <RulerPicker
                        min={40}
                        max={200}
                        step={1}
                        fractionDigits={0}
                        initialValue={160}
                        unit="lb"
                        indicatorColor={colors.text}
                        valueTextStyle={{ color: `${Platform.OS === 'ios' ? 'transparent' : colors.text}` }}
                        unitTextStyle={{ color: `${Platform.OS === 'ios' ? 'transparent' : colors.text}` }}
                        onValueChange={(value) => setWeight(value)}
                    />
                )}
            </View>
        </View>
    )
}