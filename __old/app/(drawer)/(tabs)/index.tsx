import React, { useRef, useCallback } from 'react';
import { View, Animated } from 'react-native';
import ThemedText from 'components/ThemedText';
import ThemedScroller from 'components/ThemeScroller';
import useThemeColors from '@/app/contexts/ThemeColors';
import Icon from 'components/Icon';
import Header, { HeaderIcon } from 'components/Header';
import Section from '@/components/layout/Section';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { SmallChartCard } from '@/components/SmallChartCard';
import { SmallCircleCard } from '@/components/SmallCircleCard';
import { SmallProgressBarCard } from '@/components/SmallProgressBarCard';
import Avatar from '@/components/Avatar';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function HomeScreen() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <Header
        className='bg-secondary'

        leftComponent={<Avatar src={require('@/assets/_global/img/user-3.jpg')} size="sm" link="/screens/profile" />}
        rightComponents={[<HeaderIcon icon="Bell" hasBadge href="/screens/notifications" />]}
      />
      <ThemedScroller className="flex-1 bg-background !px-0">
        <View className='px-global bg-secondary '>
          <Section title="Good morning!" titleSize='4xl' subtitle={today} className='mt-8 mb-8' />
          <CaloriesOverview />
        </View>
        <View className='p-5 bg-background'>
          <MiniCharts />
        </View>

      </ThemedScroller>
    </>
  );
}

const MiniCharts = () => {
  return (
    <>
      <View className="flex-row items-center justify-between w-full gap-4 mb-6">
        <View className="flex-1">
          <SmallChartCard title="Weight Trend" value="72.0" unit="kg" subtitle="Last 7 days" data={[71.6, 71.5, 71, 70.2, 70, 70, 69.8]} lineColor="#00A6F4" />
        </View>
        <View className="flex-1">
          <SmallChartCard title="Calories" value="1800" unit="cal" subtitle="This week" data={[1801, 1801, 1802, 1803, 1802, 1802, 1803]} lineColor="#10b981" />
        </View>
      </View>
      <View className="flex-row items-center justify-between w-full gap-4 mb-6">
        <View className="flex-1">
          <SmallCircleCard
            title="Sleep"
            subtitle='Today'
            percentage={75}
            value="7h 30m"
          />
        </View>
        <View className="flex-1">
          <SmallProgressBarCard
            title="Water Intake"
            subtitle="Past 3 days"
            data={[
              { percentage: 85, },
              { percentage: 70, },
              { percentage: 55, }
            ]}
            barColor="#06b6d4"
            value="1.3L"
            unit="/ 2L"
          />
        </View>
      </View>
    </>
  );
};


const CaloriesOverview = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const currentCalories = 1850;
  const targetCalories = 2200;
  const percentage = (currentCalories / targetCalories) * 100;
  const colors = useThemeColors();
  // Circle properties
  const size = 158; // 32 * 4 (w-32 h-32)
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useFocusEffect(
    useCallback(() => {
      // Reset animation value
      animatedValue.setValue(0);

      // Start animation
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }, [percentage])
  );

  return (
    <View className="mb-6 bg-secondary  dark:bg-dark-secondary rounded-xl pt-14">
      {/* Animated Progress Ring */}
      <View className="items-center mb-12">
        <View className="relative w-32 h-32 items-center justify-center bg-background rounded-full">
          <Svg width={size} height={size} style={{ position: 'absolute' }}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.bg}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated progress circle */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.highlight}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: [circumference, 0],
              })}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          <View className="items-center absolute">
            <ThemedText className="text-3xl font-bold">
              {currentCalories}
            </ThemedText>
            <ThemedText className="text-sm">
              / {targetCalories} cal
            </ThemedText>
          </View>
        </View>
      </View>

      <View className=' justify-center items-center'>
        <ThemedText className="text-lg font-bold">
          Calories Today
        </ThemedText>
      </View>

      {/* Calories Breakdown */}
      <View className="flex-row justify-between  px-6 pt-4 rounded-2xl  border-t mt-4 border-border">
        <View className='items-center'>

          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            Consumed
          </ThemedText>
          <View className='flex-row items-center'>
            <Icon name="Apple" size={14} className="mr-2" />
            <ThemedText className="text-lg font-bold ">
              1,850
            </ThemedText>
          </View>
        </View>
        <View className='items-center'>

          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            Burned
          </ThemedText>
          <View className='flex-row items-center'>
            <Icon name="Flame" size={14} className="mr-2" />
            <ThemedText className="text-lg font-bold ">
              450
            </ThemedText>
          </View>
        </View>
        <View className='items-center'>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            Remaining
          </ThemedText>
          <View className='flex-row items-center'>
            <Icon name="ChartPie" size={14} className="mr-2" />
            <ThemedText className="text-lg font-bold ">
              350
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
};