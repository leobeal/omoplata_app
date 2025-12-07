import { View, Text, FlatList, Dimensions, Image, Pressable, ImageBackground } from 'react-native';
import { useState } from 'react';
import ThemedText from '@/components/ThemedText';
import ThemeToggle from '@/components/ThemeToggle';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import Icon from '@/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconName } from '@/components/Icon';

const { width } = Dimensions.get('window');

interface SlideData {
    id: string;
    title: string;
    image: any;
    description: string;
    icon: string;
}

const slides: SlideData[] = [
    {
        id: '1',
        title: 'Track Your Health',
        image: require('@/assets/_global/img/onboarding-1.jpg'),
        description: 'Monitor your daily calories, workouts, and progress with ease',
        icon: 'Dumbbell'
    },
    {
        id: '2',
        title: 'Stay Motivated',
        image: require('@/assets/_global/img/onboarding-2.jpg'),
        description: 'Set goals and track your fitness journey every day',
        icon: 'Heart'
    },
    {
        id: '3',
        title: 'Achieve Your Goals',
        image: require('@/assets/_global/img/wallpaper-3.jpg'),
        description: 'Get personalized insights and reach your health targets',
        icon: 'Target'
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const insets = useSafeAreaInsets();

    const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        setCurrentIndex(index);
    };

    return (
        <View style={{}} className='flex-1 bg-background'>

            <View className="flex-1 relative bg-background">

                <FlatList
                    className='w-full h-full'
                    data={slides}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={width}
                    renderItem={({ item }) => (
                        <View style={{ width }} className="items-center justify-center">

                            <ImageBackground
                                source={item.image}
                                className='w-full h-full absolute top-0 left-0'
                            >
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', }}
                                >

                                    <View className="items-center justify-center mt-8 flex-1" style={{  }}>
                                        <Icon name={item.icon as IconName} size={30} strokeWidth={1} color="white" className='w-20 h-20 border-white/40 border rounded-full' />
                                        <ThemedText className="text-3xl font-outfit-bold text-center mt-6">
                                            {item.title}
                                        </ThemedText>
                                        <Text className="text-center text-text opacity-80 text-lg px-20">
                                            {item.description}
                                        </Text>
                                    </View>


                                </LinearGradient>
                            </ImageBackground>



                        </View>
                    )}
                    keyExtractor={(item) => item.id}
                />

                <View className="flex-row justify-center mb-20 w-full absolute" style={{ top: insets.top + 10 }}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2 mx-1 rounded-full ${index === currentIndex ? 'bg-white w-2' : 'bg-white/50 w-2'}`}
                        />
                    ))}
                </View>

                {/* Login/Signup Buttons */}
                <View style={{ bottom: insets.bottom }} className="w-full px-6 mb-global flex flex-col space-y-2 absolute bottom-0">
                    <View className='flex flex-row items-center justify-center gap-2'>
                        <Pressable onPress={() => router.push('/screens/onboarding-start')} className='flex-1 border border-white rounded-full flex flex-row items-center justify-center py-4'>
                            <AntDesign name="google" size={22} color="white" />
                        </Pressable>
                        <Pressable onPress={() => router.push('/screens/login')} className='flex-1 w-1/4 bg-white rounded-full flex flex-row items-center justify-center py-4'>
                            <Icon name="Mail" size={20} color="black" />
                        </Pressable>
                        <Pressable onPress={() => router.push('/screens/onboarding-start')} className='flex-1 border border-white rounded-full flex flex-row items-center justify-center py-4'>
                            <AntDesign name="apple" size={22} color="white" />
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
}
