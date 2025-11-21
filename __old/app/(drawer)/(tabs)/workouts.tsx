import React, { useState, useRef } from 'react';
import { View, Pressable, FlatList } from 'react-native';
import ThemedText from 'components/ThemedText';
import ThemedScroller from 'components/ThemeScroller';
import Icon from 'components/Icon';
import Header from 'components/Header';
import { Link } from 'expo-router';
import Section from '@/components/layout/Section';
import { CardScroller } from '@/components/CardScroller';
import WorkoutBarChart from '@/components/WorkoutBarChart';
import Avatar from '@/components/Avatar';

interface Workout {
  id: string;
  name: string;
  duration: string;
  exercises: number;
}

// Sample data for different days
const workoutDaysData = [
  {
    id: 0,
    date: 'TUESDAY',
    title: 'Workouts',
    subtitle: '3 Workouts this week',
  },
  {
    id: 1,
    date: 'YESTERDAY', 
    title: 'Workouts',
    subtitle: '4 Workouts this week',
  },
  {
    id: 2,
    date: 'TODAY',
    title: 'Workouts',
    subtitle: '5 Workouts this week',
  }
];

const mockWorkouts: Workout[] = [
  {
    id: '1',
    name: 'Upper Body Strength',
    duration: '45 min',
    exercises: 8,
  },
  {
    id: '2',
    name: 'HIIT Cardio',
    duration: '30 min',
    exercises: 12,
  },
  {
    id: '3',
    name: 'Yoga Flow',
    duration: '60 min',
    exercises: 15,
  },
  {
    id: '4',
    name: 'Core Blast',
    duration: '20 min',
    exercises: 6,
  },
  {
    id: '5',
    name: 'Lower Body Power',
    duration: '40 min',
    exercises: 10,
  }
];

const recentWorkouts = [
  { name: 'Upper Body Strength', date: 'Today', duration: '45 min' },
  { name: 'HIIT Cardio', date: 'Yesterday', duration: '30 min' },
  { name: 'Yoga Flow', date: '2 days ago', duration: '60 min' }
];

export default function WorkoutsScreen() {
  const [currentDayIndex, setCurrentDayIndex] = useState(2); // Start with TODAY
  const flatListRef = useRef<FlatList>(null);

  const handlePrevDay = () => {
    if (currentDayIndex > 0) {
      const newIndex = currentDayIndex - 1;
      setCurrentDayIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  const handleNextDay = () => {
    if (currentDayIndex < workoutDaysData.length - 1) {
      const newIndex = currentDayIndex + 1;
      setCurrentDayIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  const renderWorkoutDay = ({ item }: { item: typeof workoutDaysData[0] }) => (
    <WorkoutDayContent data={item} />
  );

  const onScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const pageIndex = Math.round(contentOffset / viewSize);
    setCurrentDayIndex(pageIndex);
  };

  return (
    <>
      <Header
        title="Workouts"
        className='bg-secondary'
        leftComponent={<Avatar src={require('@/assets/_global/img/user-3.jpg')} size="sm" link="/screens/profile" />}
        rightComponents={[<Icon name="PlusCircle" size={24} href="/screens/add-workout" className="text-light-text dark:text-dark-text" />]}
      />
      <View className='w-full bg-secondary border-b border-border py-4 px-global flex-row justify-between items-center'>
        <Pressable onPress={handlePrevDay} disabled={currentDayIndex === 0}>
          <Icon name="ChevronLeft" size={20} className={currentDayIndex === 0 ? 'opacity-30' : ''} />
        </Pressable>
        <ThemedText className='text-base'>{workoutDaysData[currentDayIndex].date}</ThemedText>
        <Pressable onPress={handleNextDay} disabled={currentDayIndex === workoutDaysData.length - 1}>
          <Icon name="ChevronRight" size={20} className={currentDayIndex === workoutDaysData.length - 1 ? 'opacity-30' : ''} />
        </Pressable>
      </View>
      
      <ThemedScroller className="flex-1 !px-0">
        {/* Horizontal scrollable chart section */}
        <FlatList
          ref={flatListRef}
          data={workoutDaysData}
          renderItem={renderWorkoutDay}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          initialScrollIndex={2}
          getItemLayout={(data, index) => {
            const { width } = require('react-native').Dimensions.get('window');
            return {
              length: width,
              offset: width * index,
              index,
            };
          }}
        />
        
        {/* Static content below */}
        
          <View className='px-global mt-6'>
            <Section title="Recent Workouts" className='mb-6'>
              <CardScroller space={10} className='mt-2'>
                {recentWorkouts.map((workout, index) => (
                  <Link key={index} asChild href="/screens/workout-detail">
                    <Pressable
                      className="bg-secondary  min-h-[150px] w-[150px] dark:bg-dark-secondary rounded-lg p-4 mb-2 items-start justify-between"
                    >
                      <ThemedText className="font-medium text-base text-light-text dark:text-dark-text">
                        {workout.name}
                      </ThemedText>
                      <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-auto">
                        {workout.date} • {workout.duration}
                      </ThemedText>
                    </Pressable>
                  </Link>
                ))}
              </CardScroller>
            </Section>

            <Section title="Available Workouts" className='mb-6 mt-5'>
              <FlatList
                className='mt-4'
                data={mockWorkouts}
                renderItem={renderWorkoutCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </Section>
          </View>
        </ThemedScroller>
    </>
  );
}

const WorkoutDayContent = ({ data }: { data: typeof workoutDaysData[0] }) => {
  const { width } = require('react-native').Dimensions.get('window');
  
  return (
    <View style={{ width }} className='bg-secondary'>
      <View className='px-global'>
        <Section title={data.title} subtitle={data.subtitle} titleSize='3xl' className='mt-10 mb-2' />
        <WorkoutBarChart className="mb-10 mt-6" />
      </View>
    </View>
  );
};

const renderWorkoutCard = ({ item }: { item: Workout }) => {
  return (
    <Link asChild href="/screens/workout-tracker">
      <Pressable className="bg-secondary  dark:bg-dark-secondary flex-row items-center justify-between rounded-xl p-4 mb-4">

        <View className="flex-1">
          <ThemedText className="text-lg mb-4 font-semibold text-light-text dark:text-dark-text">
            {item.name}
          </ThemedText>

          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center">
              <Icon name="Clock" size={14} className="text-light-subtext dark:text-dark-subtext mr-1" />
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {item.duration}
              </ThemedText>
            </View>

            <View className="flex-row items-center">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {item.exercises} exercises
              </ThemedText>
            </View>
          </View>

        </View>
        <Icon name="Play" size={17} className="w-10 h-10 items-center justify-center bg-background dark:bg-dark-primary/60 rounded-full" />
      </Pressable>
    </Link>
  );
}