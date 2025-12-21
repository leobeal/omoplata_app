import React from 'react';
import { View } from 'react-native';

import ThemedText from './ThemedText';

interface LargeTitleProps {
  title: string;
  className?: string;
}

export default function LargeTitle({ title, className = '' }: LargeTitleProps) {
  return (
    <View className={`mb-4 pb-2 ${className}`}>
      <ThemedText className="text-[30px] font-bold leading-[36px] tracking-tight">
        {title}
      </ThemedText>
    </View>
  );
}
