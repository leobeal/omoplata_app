import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  Pressable,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

import { getFAQs, FAQCategory } from '@/api/faqs';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import LargeTitle from '@/components/LargeTitle';
import Section from '@/components/Section';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import { useT } from '@/contexts/LocalizationContext';

export default function HelpScreen() {
  const t = useT();
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());

  // Scroll state for collapsible title
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const LARGE_TITLE_HEIGHT = 44;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowHeaderTitle(offsetY > LARGE_TITLE_HEIGHT);
  }, []);

  // Separate categories by type
  const clubCategories = useMemo(
    () => categories.filter((cat) => cat.type === 'club'),
    [categories]
  );
  const appCategories = useMemo(() => categories.filter((cat) => cat.type === 'app'), [categories]);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const data = await getFAQs();
      setCategories(data.categories);
      // Expand first category of each type by default
      const clubFirst = data.categories.find((c) => c.type === 'club');
      const appFirst = data.categories.find((c) => c.type === 'app');
      const expanded = new Set<string>();
      if (clubFirst) expanded.add(clubFirst.id);
      if (appFirst) expanded.add(appFirst.id);
      setExpandedCategories(expanded);
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleFAQ = (categoryId: string, questionIndex: number) => {
    const key = `${categoryId}-${questionIndex}`;
    setExpandedFAQs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:app@omoplata.com');
  };

  const renderCategoryList = (categoryList: FAQCategory[]) => {
    return categoryList.map((category) => {
      const isCategoryExpanded = expandedCategories.has(category.id);

      return (
        <View key={category.id} className="mb-4">
          {/* Category Header */}
          <Pressable
            onPress={() => toggleCategory(category.id)}
            className="mb-2 flex-row items-center justify-between rounded-2xl bg-secondary p-5">
            <View className="flex-1 flex-row items-center">
              <Icon
                name={isCategoryExpanded ? 'ChevronDown' : 'ChevronRight'}
                size={20}
                className="mr-3 opacity-50"
              />
              <ThemedText className="flex-1 font-semibold">{category.title}</ThemedText>
            </View>
            <View className="rounded-full bg-highlight px-3 py-1">
              <ThemedText className="text-xs font-bold text-white">
                {category.faqs.length}
              </ThemedText>
            </View>
          </Pressable>

          {/* FAQs List */}
          {isCategoryExpanded && (
            <View className="rounded-2xl bg-secondary">
              {category.faqs.map((faq, index) => {
                const faqKey = `${category.id}-${index}`;
                const isFAQExpanded = expandedFAQs.has(faqKey);

                return (
                  <Pressable
                    key={index}
                    onPress={() => toggleFAQ(category.id, index)}
                    className={`p-5 ${index < category.faqs.length - 1 ? 'border-b border-border' : ''}`}>
                    {/* Question */}
                    <View className="mb-2 flex-row items-start">
                      <Icon
                        name={isFAQExpanded ? 'Minus' : 'Plus'}
                        size={16}
                        className="mr-3 mt-1 opacity-50"
                      />
                      <ThemedText className="flex-1 font-medium">{faq.question}</ThemedText>
                    </View>

                    {/* Answer */}
                    {isFAQExpanded && (
                      <View className="ml-7 mt-2">
                        <ThemedText className="text-sm leading-6 opacity-70">
                          {faq.answer}
                        </ThemedText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      );
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title={showHeaderTitle ? t('settings.helpAndSupport') : undefined} />
      <ThemedScroller className="px-6" onScroll={handleScroll} scrollEventThrottle={16}>
        <LargeTitle title={t('settings.helpAndSupport')} className="pt-2" />

        {/* Contact Support Section */}
        <Section title={t('help.contactSupport')} titleSize="lg" noTopMargin />
        <View className="mb-6 rounded-2xl bg-secondary">
          <Pressable
            onPress={handleContactSupport}
            className="flex-row items-center justify-between p-5">
            <View className="flex-1 flex-row items-center">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-highlight">
                <Icon name="Mail" size={20} color="white" />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">{t('help.emailSupport')}</ThemedText>
                <ThemedText className="text-sm opacity-50">app@omoplata.com</ThemedText>
              </View>
            </View>
            <Icon name="ChevronRight" size={20} className="opacity-30" />
          </Pressable>
        </View>

        {/* Club FAQs Section */}
        {clubCategories.length > 0 && (
          <>
            <Section title={t('help.clubQuestions')} titleSize="lg" />
            {renderCategoryList(clubCategories)}
          </>
        )}

        {/* App FAQs Section */}
        {appCategories.length > 0 && (
          <>
            <Section title={t('help.appQuestions')} titleSize="lg" />
            {renderCategoryList(appCategories)}
          </>
        )}
      </ThemedScroller>
    </View>
  );
}
