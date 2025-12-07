import { WifiOff } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ThemedText from './ThemedText';

import { useT } from '@/contexts/LocalizationContext';
import { useIsOnline } from '@/contexts/NetworkContext';

export default function OfflineBanner() {
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();
  const t = useT();
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // Calculate banner height (safe area + padding + content)
  const bannerHeight = insets.top + 8 + 24 + 8; // top inset + paddingTop + content + paddingBottom

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: -bannerHeight,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [isOnline, slideAnim, bannerHeight]);

  if (!isVisible && isOnline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      <View style={styles.content}>
        <WifiOff size={16} color="#fff" />
        <ThemedText style={styles.text}>{t('network.offline')}</ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ef4444',
    paddingBottom: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
