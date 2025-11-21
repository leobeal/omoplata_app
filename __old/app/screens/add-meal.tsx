import { View, Image, ScrollView, Pressable, TextInput } from 'react-native';
import Header, { HeaderIcon } from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeColors from '../contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';
import React, { useState } from 'react';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import ThemedFooter from '@/components/ThemeFooter';
import { Button } from '@/components/Button';
import { router } from 'expo-router';

const mealOptions = [
    { title: 'Greek Yogurt', description: '77 cal, Plain Greek yogurt, 100.0 g' },
    { title: 'Grilled Chicken Breast', description: '165 cal, Skinless chicken breast, 100.0 g' },
    { title: 'Peanut Butter', description: '588 cal, Natural peanut butter, 100.0 g' },
    { title: 'Banana', description: '89 cal, Medium banana, 118.0 g' },
    { title: 'Salmon Fillet', description: '208 cal, Atlantic salmon, 100.0 g' },
    { title: 'Brown Rice', description: '111 cal, Cooked brown rice, 100.0 g' },
    { title: 'Avocado', description: '160 cal, Medium avocado, 100.0 g' },
    { title: 'Almonds', description: '579 cal, Raw almonds, 100.0 g' },
    { title: 'Sweet Potato', description: '86 cal, Baked sweet potato, 100.0 g' },
    { title: 'Spinach', description: '23 cal, Fresh spinach leaves, 100.0 g' },
    { title: 'Eggs', description: '155 cal, Large whole eggs, 100.0 g' },
    { title: 'Quinoa', description: '120 cal, Cooked quinoa, 100.0 g' },
    { title: 'Blueberries', description: '57 cal, Fresh blueberries, 100.0 g' },
    { title: 'Broccoli', description: '34 cal, Fresh broccoli, 100.0 g' },
    { title: 'Oatmeal', description: '68 cal, Cooked oatmeal, 100.0 g' },
    { title: 'Turkey Breast', description: '135 cal, Roasted turkey breast, 100.0 g' }
];

export default function AddMealScreen() {
    return (
        <>
            <SearchInput />
            <ThemedScroller className='!px-4 pt-6'>
                <View className='gap-3'>
                    {mealOptions.map((meal, index) => (
                        <MealCard 
                            key={index}
                            title={meal.title} 
                            description={meal.description} 
                        />
                    ))}
                </View>
            </ThemedScroller>
            <ThemedFooter>
                <Button title='Add Meal' className="!bg-highlight" textClassName='!text-white' onPress={() => {}} />
            </ThemedFooter>
        </>
    );
}

const SearchInput = () => {
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();
    return (
        <View style={{paddingTop: insets.top}} className='flex-row px-4 pb-4 items-center bg-secondary justify-between'>
            <View className='relative h-14 flex-1 flex-row  bg-border rounded-xl'>
                <Icon name='ArrowLeft' onPress={() => router.back()} size={20} className='pl-2' />
                <TextInput className='flex-1 h-14 text-text rounded-xl px-4' placeholder='Search meals' placeholderTextColor={colors.placeholder} />
            </View>
        </View>
    )
}

const MealCard = (props: any) => {
    const [isActive, setIsActive] = useState(false);
    return (
        <Pressable style={{...shadowPresets.card}} onPress={() => setIsActive(!isActive)} className='flex-row bg-secondary rounded-xl p-4 items-center justify-between'>
            <View className='flex-1'>
                <ThemedText className='text-lg font-bold'>{props.title}</ThemedText>
                <ThemedText className='text-base text-text opacity-50'>{props.description}</ThemedText>
            </View>
            {isActive ? <Icon name='Check' size={20} color="white" className='w-10 h-10 bg-highlight rounded-full' /> : <Icon name='Plus' size={20} className='w-10 h-10 bg-background rounded-full' />}
        </Pressable>
    )
}



