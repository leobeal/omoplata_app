import { View, Image, Pressable } from 'react-native';
import Header from '@/components/Header';
import React, { useState } from 'react';
import Icon from '@/components/Icon';
import ThemedFooter from '@/components/ThemeFooter';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import * as ImagePicker from 'expo-image-picker';




export default function WeightEntryScreen() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    return (
        <View className='flex-1 bg-background relative flex-col'>
            <Header className='bg-transparent' title='Weight Entry' showBackButton />
                <View className='flex-1 items-center justify-center relative w-full'>
                    <Pressable 
                        className="bg-secondary mb-20 border border-border rounded-xl w-44 h-44 items-center justify-center overflow-hidden"
                        onPress={pickImage}
                    >
                        {selectedImage ? (
                            <Image 
                                source={{ uri: selectedImage }} 
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <>
                                <Icon name='Camera' size={30} />
                                <ThemedText className='text-sm mt-2'>Add photo</ThemedText>
                            </>
                        )}
                    </Pressable>
                    <WeightBar />
                </View>
            <ThemedFooter className='!bg-transparent'>
                <Button title='Save' className="!bg-highlight" textClassName='!text-white' onPress={() => { }} />
            </ThemedFooter>
        </View>
    );
}


const WeightBar = () => {
    const [weight, setWeight] = useState(74.3);

    const handleDecrease = () => {
        if (weight > 30) {
            setWeight(prev => Math.max(30, prev - 0.1));
        }
    };

    const handleIncrease = () => {
        if (weight < 200) {
            setWeight(prev => Math.min(200, prev + 0.1));
        }
    };

    return (
        <>
            <View className='relative z-10 px-20 mb-32'>
                <View className='flex-row items-center justify-between pb-20 w-full'>
                    <Icon
                        onPress={handleDecrease}
                        name='Minus'
                        size={20}
                        className={`w-10 border border-border h-10 rounded-full ${weight <= 30 ? 'bg-border opacity-50' : 'bg-secondary'
                            }`}
                    />
                    <View className='mx-6'>
                        <ThemedText className='text-5xl font-semibold text-center'>
                            {weight.toFixed(1)} kg
                        </ThemedText>
                    </View>

                    <Icon
                        onPress={handleIncrease}
                        name='Plus'
                        size={20}
                        className={`w-10 border border-border h-10 rounded-full ${weight >= 200 ? 'bg-border opacity-50' : 'bg-secondary'
                            }`}
                    />
                </View>

            </View>

        </>
    )
}


