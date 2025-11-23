import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Pressable, ScrollView, RefreshControl } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemedScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import ClassCard from '@/components/ClassCard';
import { Chip } from '@/components/Chip';
import ErrorState from '@/components/ErrorState';
import {
  getClassesPaginated,
  getClassCategories,
  getClassLevels,
  confirmAttendance,
  denyAttendance,
  Class,
  ClassFilters,
} from '@/api/classes';
import { useT } from '@/contexts/LocalizationContext';
import { useThemeColors } from '@/contexts/ThemeColors';

export default function NextClassesScreen() {
  const t = useT();
  const colors = useThemeColors();

  // State
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Filter options
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  // Active filters
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadFilterOptions();
    loadClasses(true);
  }, []);

  useEffect(() => {
    // Reload classes when filters change
    loadClasses(true);
  }, [selectedCategory, selectedLevel]);

  const loadFilterOptions = async () => {
    try {
      const [categoriesData, levelsData] = await Promise.all([
        getClassCategories(),
        getClassLevels(),
      ]);
      setCategories(categoriesData);
      setLevels(levelsData);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadClasses = async (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
      setError(null); // Clear previous errors
    }

    try {
      const filters: ClassFilters = {};
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedLevel) filters.level = selectedLevel;

      const data = await getClassesPaginated(10);

      setClasses(data.classes);
      setTotal(data.total);
      setHasMore(false); // API doesn't support pagination yet
      setError(null); // Clear error on success
    } catch (error) {
      console.error('Error loading classes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load classes. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadClasses(false);
  };

  const handleConfirm = async (classId: string) => {
    try {
      await confirmAttendance(classId);
      setClasses((prev) =>
        prev.map((cls) => (cls.id === classId ? { ...cls, status: 'confirmed' as const } : cls))
      );
    } catch (error) {
      console.error('Error confirming attendance:', error);
    }
  };

  const handleDeny = async (classId: string) => {
    try {
      await denyAttendance(classId);
      setClasses((prev) =>
        prev.map((cls) => (cls.id === classId ? { ...cls, status: 'denied' as const } : cls))
      );
    } catch (error) {
      console.error('Error denying attendance:', error);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedLevel(undefined);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadFilterOptions(), loadClasses(true)]);
    } finally {
      setRefreshing(false);
    }
  };

  const hasActiveFilters = selectedCategory || selectedLevel;

  return (
    <View className="flex-1 bg-background">
      <Header title={t('classes.title')} showBack />

      {/* Filters */}
      <View className="border-b border-border bg-secondary px-6 py-4">
        <View className="mb-3 flex-row items-center justify-between">
          <ThemedText className="text-sm font-semibold">{t('classes.filters')}</ThemedText>
          {hasActiveFilters && (
            <Pressable onPress={clearFilters}>
              <ThemedText className="text-sm font-semibold text-highlight">
                {t('classes.clearFilters')}
              </ThemedText>
            </Pressable>
          )}
        </View>

        {/* Category filters */}
        <View className="mb-3">
          <ThemedText className="mb-2 text-xs opacity-50">{t('classes.category')}</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  isSelected={selectedCategory === category}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === category ? undefined : category)
                  }
                  size="sm"
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Level filters */}
        <View>
          <ThemedText className="mb-2 text-xs opacity-50">{t('classes.level')}</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {levels.map((level) => (
                <Chip
                  key={level}
                  label={level}
                  isSelected={selectedLevel === level}
                  onPress={() => setSelectedLevel(selectedLevel === level ? undefined : level)}
                  size="sm"
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Results count */}
      <View className="border-b border-border px-6 py-3">
        <ThemedText className="text-sm opacity-70">
          {loading ? t('common.loading') : t('classes.showingResults', { count: classes.length, total })}
        </ThemedText>
      </View>

      {/* Classes list */}
      <ThemedScroller
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.highlight}
            colors={[colors.highlight]}
          />
        }
      >
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" />
          </View>
        ) : error ? (
          <ErrorState
            title={t('classes.errorTitle') || 'Unable to load classes'}
            message={error}
            onRetry={() => loadClasses(true)}
            retryButtonText={t('common.tryAgain') || 'Try Again'}
          />
        ) : classes.length > 0 ? (
          <>
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classData={classItem}
                onConfirm={handleConfirm}
                onDeny={handleDeny}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <Pressable
                className="mb-8 flex-row items-center justify-center rounded-2xl bg-secondary p-4"
                onPress={loadMore}
                disabled={loadingMore}>
                {loadingMore ? (
                  <ActivityIndicator size="small" color={colors.highlight} />
                ) : (
                  <>
                    <ThemedText className="mr-2 font-semibold text-highlight">
                      {t('classes.loadMore')}
                    </ThemedText>
                    <Icon name="ChevronDown" size={20} color={colors.highlight} />
                  </>
                )}
              </Pressable>
            )}
          </>
        ) : (
          <View className="items-center justify-center rounded-2xl bg-secondary py-12">
            <Icon name="Calendar" size={48} className="mb-4 opacity-30" />
            <ThemedText className="text-center text-lg font-semibold">
              {t('classes.noClassesFound')}
            </ThemedText>
            <ThemedText className="mt-2 text-center opacity-70">
              {t('classes.tryDifferentFilters')}
            </ThemedText>
          </View>
        )}
      </ThemedScroller>
    </View>
  );
}
