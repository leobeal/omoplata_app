import React from 'react';
import { View } from 'react-native';
import ThemedText from './ThemedText';

interface WorkoutStreakProps {
  className?: string;
}

const WorkoutStreak: React.FC<WorkoutStreakProps> = ({
  className = ''
}) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weeks = 10;
  
  // Simple mock data
  const workoutData = [
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
    [0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  ];

  return (
    <View className={className}>
      {days.map((day, dayIndex) => (
        <View key={dayIndex} className="flex-row items-center mb-1">
          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext w-4 mr-3">
            {day}
          </ThemedText>
          <View className="flex-row gap-3">
            {workoutData[dayIndex].map((completed, weekIndex) => (
              <View
                key={weekIndex}
                className={`w-2.5 h-2.5 rounded-full ${
                  completed 
                    ? 'bg-sky-500' 
                    : 'bg-gray-200 dark:bg-dark-secondary'
                }`}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

export default WorkoutStreak; 