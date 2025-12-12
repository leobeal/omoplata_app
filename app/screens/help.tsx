import React, { useState, useEffect, useMemo } from 'react';
import { View, ActivityIndicator, Pressable, Linking } from 'react-native';

import { getFAQs, FAQCategory } from '@/api/faqs';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
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
    Linking.openURL('mailto:support@omoplata.com');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+15551234567');
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
        <Header showBackButton title={t('settings.helpAndSupport')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title={t('settings.helpAndSupport')} />
      <ThemedScroller className="px-6 pt-4">
        {/* Contact Support Section */}
        <Section title={t('help.contactSupport')} titleSize="lg" noTopMargin />
        <View className="mb-6 rounded-2xl bg-secondary">
          <Pressable
            onPress={handleContactSupport}
            className="flex-row items-center justify-between border-b border-border p-5">
            <View className="flex-1 flex-row items-center">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-highlight">
                <Icon name="Mail" size={20} color="white" />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">{t('help.emailSupport')}</ThemedText>
                <ThemedText className="text-sm opacity-50">support@omoplata.com</ThemedText>
              </View>
            </View>
            <Icon name="ChevronRight" size={20} className="opacity-30" />
          </Pressable>

          <Pressable
            onPress={handleCallSupport}
            className="flex-row items-center justify-between p-5">
            <View className="flex-1 flex-row items-center">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-highlight">
                <Icon name="Phone" size={20} color="white" />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">{t('help.callSupport')}</ThemedText>
                <ThemedText className="text-sm opacity-50">(555) 123-4567</ThemedText>
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

        {/* Still Need Help */}
        <View className="mb-8 rounded-2xl bg-secondary p-6">
          <View className="mb-3 flex-row items-center">
            <Icon name="HelpCircle" size={24} className="mr-3 opacity-50" />
            <ThemedText className="text-lg font-bold">{t('help.stillNeedHelp')}</ThemedText>
          </View>
          <ThemedText className="mb-4 text-sm opacity-70">
            {t('help.stillNeedHelpDescription')}
          </ThemedText>
          <Pressable
            onPress={handleContactSupport}
            className="items-center rounded-xl bg-highlight py-3">
            <ThemedText className="font-semibold text-white">
              {t('help.contactSupportTeam')}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedScroller>
    </View>
  );
}
