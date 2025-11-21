import { Link, router } from 'expo-router';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import ThemedText from './ThemedText';
import Icon, { IconName } from './Icon';
import Avatar from './Avatar';
import ThemeToggle from './ThemeToggle';
import ThemedScroller from './ThemeScroller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomDrawerContent() {
    const insets = useSafeAreaInsets();
    return (
        <ThemedScroller className="flex-1 p-8 bg-secondary " style={{ paddingTop: insets.top }}>

            <ThemedText className='text-2xl font-outfit-bold mb-8 mt-4'>Caloria<Text className="text-highlight">.</Text></ThemedText>
            
            {/* User Profile Section */}
            <Pressable onPress={() => router.push('/(drawer)/(tabs)/profile')} className="flex-row items-center mb-8 py-10 border-b border-border   rounded-xl">
                <Avatar src="https://mighty.tools/mockmind-api/content/human/5.jpg" size="md" />
                <View className="ml-3">
                    <ThemedText className="font-semibold text-light-text dark:text-dark-text">John Doe</ThemedText>
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">72kg • Goal: 70kg</ThemedText>
                </View>
            </Pressable>

            <View className='flex-col pb-6 mb-6 border-b border-border'>
                <NavItem href="/(drawer)/(tabs)/index" icon="Home" label="Home" description="Daily overview" />
                <NavItem href="/(drawer)/(tabs)/workouts" icon="Dumbbell" label="Workouts" description="Exercise routines" />
                <NavItem href="/(drawer)/(tabs)/meals" icon="UtensilsCrossed" label="Meals" description="Food tracking" />
                <NavItem href="/(drawer)/(tabs)/progress" icon="TrendingUp" label="Progress" description="Charts & stats" />
                <NavItem href="/screens/edit-profile" icon="Settings" label="Settings" description="App preferences" />
            </View>
            
            <View className='flex-row justify-between items-center'>    
                <ThemedText className='text-sm text-light-subtext dark:text-dark-subtext'>Version 1.0.0</ThemedText>
                <ThemeToggle />
            </View>

        </ThemedScroller>
    );
}

type NavItemProps = {
    href: string;
    icon: IconName;
    label: string;
    className?: string;
    description?: string;
};

export const NavItem = ({ href, icon, label, description }: NavItemProps) => (
    <TouchableOpacity onPress={() => router.push(href)} className={`flex-row items-center py-3`}>
        <View className='flex-row items-center justify-center w-14 h-14 bg-background   rounded-xl'>
            <Icon name={icon} size={18} className='' />
        </View>
        <View className='flex-1 ml-4 '>
            {label &&
                <ThemedText className="text-lg font-bold ">{label}</ThemedText>
            }
            {description &&
                <ThemedText className='opacity-50 text-xs'>{description}</ThemedText>
            }
        </View>
    </TouchableOpacity>
);


