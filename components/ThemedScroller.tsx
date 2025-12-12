import { usePathname } from 'expo-router';
import React, { useRef, useEffect } from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';

import { useScrollToTop } from '@/contexts/ScrollToTopContext';

interface ThemedScrollerProps extends ScrollViewProps {
  className?: string;
  children: React.ReactNode;
}

// Convert pathname like "/(tabs)/leaderboard" to href format "/leaderboard"
const pathnameToHref = (pathname: string): string => {
  // Handle index route
  if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index') {
    return '/';
  }
  // Remove (tabs) group from path
  return pathname.replace(/\/?\(tabs\)\/?/, '/');
};

export default function ThemedScroller({
  className = '',
  children,
  contentContainerStyle,
  ...props
}: ThemedScrollerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollHandlerRef = useRef<() => void>(() => {});
  const { registerScrollHandler, unregisterScrollHandler } = useScrollToTop();
  const pathname = usePathname();
  const href = pathnameToHref(pathname);
  const hrefRef = useRef(href);

  // Keep refs updated
  hrefRef.current = href;
  scrollHandlerRef.current = () => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };

  useEffect(() => {
    // Register a stable function that delegates to the ref
    const handleScrollToTop = () => {
      scrollHandlerRef.current();
    };

    // Only register once on mount, using the initial href
    const initialHref = hrefRef.current;
    registerScrollHandler(initialHref, handleScrollToTop);

    return () => {
      // Only unregister on unmount
      unregisterScrollHandler(initialHref);
    };
  }, []);

  return (
    <ScrollView
      ref={scrollViewRef}
      className={`bg-background px-6 ${className}`}
      bounces
      alwaysBounceVertical
      directionalLockEnabled
      nestedScrollEnabled
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      {...props}>
      {children}
      <View className="h-24" />
    </ScrollView>
  );
}
