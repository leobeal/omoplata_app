import { usePathname } from 'expo-router';
import React, { useRef, useEffect } from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';

import { useScrollToTop } from '@/contexts/ScrollToTopContext';

interface ThemedScrollerProps extends ScrollViewProps {
  className?: string;
  children: React.ReactNode;
}

export default function ThemedScroller({
  className = '',
  children,
  contentContainerStyle,
  ...props
}: ThemedScrollerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { registerScrollHandler, unregisterScrollHandler } = useScrollToTop();
  const pathname = usePathname();

  useEffect(() => {
    const handleScrollToTop = () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    registerScrollHandler(pathname, handleScrollToTop);

    return () => {
      unregisterScrollHandler(pathname);
    };
  }, [pathname, registerScrollHandler, unregisterScrollHandler]);

  return (
    <ScrollView
      ref={scrollViewRef}
      className={`bg-background px-6 ${className}`}
      bounces
      alwaysBounceVertical
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      {...props}>
      {children}
      <View className="h-24" />
    </ScrollView>
  );
}
