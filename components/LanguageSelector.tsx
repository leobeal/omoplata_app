import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';

import Icon from './Icon';
import ThemedText from './ThemedText';

import { updateUserLocale } from '@/api/profile';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';
import { LANGUAGE_OPTIONS, SupportedLanguages } from '@/locales';

export interface LanguageSelectorRef {
  open: () => void;
  close: () => void;
}

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const LanguageSelector = forwardRef<LanguageSelectorRef, LanguageSelectorProps>(
  ({ visible, onClose }, ref) => {
    const { t, locale, setLocale } = useTranslation();
    const { user } = useAuth();
    const colors = useThemeColors();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const actionSheetRef = useRef<ActionSheetRef>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        actionSheetRef.current?.show();
      },
      close: () => {
        actionSheetRef.current?.hide();
      },
    }));

    // Sync visibility with action sheet
    useEffect(() => {
      if (visible) {
        actionSheetRef.current?.show();
      } else {
        actionSheetRef.current?.hide();
      }
    }, [visible]);

    const handleSelectLanguage = async (languageCode: SupportedLanguages) => {
      if (languageCode === locale) {
        onClose();
        return;
      }

      setIsUpdating(languageCode);

      try {
        // Update locale in context and local storage (global, not tenant-specific)
        await setLocale(languageCode);

        // Update on backend if user is logged in
        if (user?.id) {
          await updateUserLocale(user.id, languageCode);
        }

        onClose();
      } catch (error) {
        console.error('Failed to update language:', error);
      } finally {
        setIsUpdating(null);
      }
    };

    return (
      <ActionSheet
        ref={actionSheetRef}
        gestureEnabled
        drawUnderStatusBar={false}
        statusBarTranslucent
        onClose={onClose}
        containerStyle={{
          backgroundColor: colors.sheet,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}>
        <View className="px-6 pb-10 pt-6">
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <ThemedText className="text-xl font-bold">{t('language.title')}</ThemedText>
            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.bg }}>
              <Icon name="X" size={18} />
            </TouchableOpacity>
          </View>

          {/* Language Options */}
          <View className="rounded-2xl" style={{ backgroundColor: colors.secondary }}>
            {LANGUAGE_OPTIONS.map((lang, index) => {
              const isSelected = locale === lang.code;
              const isLoading = isUpdating === lang.code;
              const isLast = index === LANGUAGE_OPTIONS.length - 1;

              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleSelectLanguage(lang.code)}
                  disabled={isUpdating !== null}
                  className={`flex-row items-center px-5 py-4 ${!isLast ? 'border-b' : ''}`}
                  style={{ borderColor: colors.border }}>
                  {/* Flag */}
                  <View className="bg-bg mr-4 h-10 w-10 items-center justify-center rounded-full">
                    <ThemedText className="text-2xl">{lang.flag}</ThemedText>
                  </View>

                  {/* Language Name */}
                  <View className="flex-1">
                    <ThemedText className={`text-lg ${isSelected ? 'font-bold' : 'font-medium'}`}>
                      {lang.nativeName}
                    </ThemedText>
                    {lang.name !== lang.nativeName && (
                      <ThemedText className="text-sm opacity-50">{lang.name}</ThemedText>
                    )}
                  </View>

                  {/* Selection Indicator */}
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.highlight} />
                  ) : isSelected ? (
                    <View
                      className="h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.highlight }}>
                      <Icon name="Check" size={14} color="white" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Current Language Info */}
          <View className="mt-4 items-center">
            <ThemedText className="text-sm opacity-50">
              {t('language.current')}: {LANGUAGE_OPTIONS.find((l) => l.code === locale)?.nativeName}
            </ThemedText>
          </View>
        </View>
      </ActionSheet>
    );
  }
);

export default LanguageSelector;
