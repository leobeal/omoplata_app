import { Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ThemedText from './ThemedText';

import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/contexts/LocalizationContext';

export default function ViewingAsChildBanner() {
  const { isViewingAsChild, user, parentUser, switchBackToParent } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useT();
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isViewingAsChild || !user) {
    return null;
  }

  const handleSwitchBack = async () => {
    setIsSwitching(true);
    try {
      await switchBackToParent();
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 4,
        },
      ]}>
      <View style={styles.content}>
        <Users size={16} color="#fff" />
        <ThemedText style={styles.text}>
          {t('family.viewingAs', { name: user.firstName })}
        </ThemedText>
        <TouchableOpacity
          onPress={handleSwitchBack}
          disabled={isSwitching}
          style={styles.switchButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {isSwitching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <ThemedText style={styles.switchText}>
                {t('family.switchBack', { name: parentUser?.firstName || '' })}
              </ThemedText>
              <X size={14} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#6366f1', // Indigo color to differentiate from offline banner
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  switchText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
