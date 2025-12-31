import React, { useState, useEffect, memo } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';

import Icon from './Icon';
import ThemedText from './ThemedText';

import { Class } from '@/api/classes';
import { useT } from '@/contexts/LocalizationContext';

interface ClassCardProps {
  classData: Class;
  childId?: string;
  onConfirm?: (classId: string, childId?: string) => Promise<void>;
  onDeny?: (classId: string, childId?: string) => Promise<void>;
}

const ClassCard = memo(function ClassCard({
  classData,
  childId,
  onConfirm,
  onDeny,
}: ClassCardProps) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(classData.status);

  // Sync localStatus when classData changes (e.g., when switching between children)
  useEffect(() => {
    setLocalStatus(classData.status);
  }, [classData.id, classData.status]);

  const formatTime = (time: string | null) => {
    if (!time) return null;

    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return time; // Return original if format is unexpected

    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    // Handle datetime strings:
    // - ISO format: "2025-11-21T18:00:00" or "2025-11-21T18:00:00.000Z"
    // - Space format: "2025-12-08 10:00:00"
    // - Date-only: "2025-11-21"
    // Extract date part by splitting on T or space
    const datePart = dateString.split(/[T ]/)[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const classDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    classDate.setHours(0, 0, 0, 0);

    if (classDate.getTime() === today.getTime()) {
      return t('classCard.today');
    } else if (classDate.getTime() === tomorrow.getTime()) {
      return t('classCard.tomorrow');
    } else {
      return classDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleConfirm = async () => {
    if (!onConfirm) return;
    setLoading(true);
    try {
      await onConfirm(classData.id, childId);
      setLocalStatus('confirmed');
    } catch (error) {
      console.error('Error confirming attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!onDeny) return;
    setLoading(true);
    try {
      await onDeny(classData.id, childId);
      setLocalStatus('denied');
    } catch (error) {
      console.error('Error denying attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (localStatus) {
      case 'confirmed':
        return (
          <View className="flex-row items-center rounded-full bg-green-500/20 px-3 py-1">
            <Icon name="Check" size={14} color="#10B981" />
            <ThemedText className="ml-1 text-xs font-semibold" style={{ color: '#10B981' }}>
              {t('classCard.confirmed')}
            </ThemedText>
          </View>
        );
      case 'denied':
        return (
          <View className="flex-row items-center rounded-full bg-red-500/20 px-3 py-1">
            <Icon name="X" size={14} color="#EF4444" />
            <ThemedText className="ml-1 text-xs font-semibold" style={{ color: '#EF4444' }}>
              {t('classCard.declined')}
            </ThemedText>
          </View>
        );
      default:
        return null;
    }
  };

  // Check if we have time info to display
  const startTimeFormatted = formatTime(classData.startTime);
  const endTimeFormatted = formatTime(classData.endTime);
  const hasTimeInfo = startTimeFormatted && endTimeFormatted;

  // Check if instructor is available
  const instructor = typeof classData.instructor === 'string' ? classData.instructor : '';
  const hasInstructor = instructor && instructor.trim() !== '';

  // Check if location/facility is available
  const location = typeof classData.location === 'string' ? classData.location : '';
  const facility = typeof classData.facility === 'string' ? classData.facility : '';
  const hasLocation = (location && location.trim() !== '') || (facility && facility.trim() !== '');
  const locationDisplay = location && facility ? `${facility} · ${location}` : facility || location;

  // Check if we should show enrollment info
  const hasEnrollmentInfo = classData.capacity.max !== null || classData.enrolled > 0;

  return (
    <View className="mb-4 rounded-2xl bg-secondary p-5">
      {/* Header */}
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <ThemedText className="mb-1 text-lg font-bold">{classData.title}</ThemedText>
          {hasInstructor && (
            <View className="flex-row items-center">
              <Icon name="User" size={14} className="mr-1 opacity-50" />
              <ThemedText className="text-sm opacity-70">{instructor}</ThemedText>
            </View>
          )}
        </View>
        {getStatusBadge()}
      </View>

      {/* Class Info */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Icon name="Calendar" size={16} className="mr-2 opacity-50" />
          <ThemedText className="text-sm opacity-70">{formatDate(classData.date)}</ThemedText>
        </View>
        {hasTimeInfo && (
          <View className="flex-row items-center">
            <Icon name="Clock" size={16} className="mr-2 opacity-50" />
            <ThemedText className="text-sm opacity-70">
              {startTimeFormatted} - {endTimeFormatted}
            </ThemedText>
          </View>
        )}
      </View>

      {(hasLocation || hasEnrollmentInfo) && (
        <View className="mb-4 flex-row items-center justify-between">
          {hasLocation && (
            <View className="flex-row items-center">
              <Icon name="MapPin" size={16} className="mr-2 opacity-50" />
              <ThemedText className="text-sm opacity-70">{locationDisplay}</ThemedText>
            </View>
          )}
          {hasEnrollmentInfo && (
            <View className="flex-row items-center">
              <Icon name="Users" size={16} className="mr-2 opacity-50" />
              <ThemedText className="text-sm opacity-70">
                {classData.capacity.max !== null
                  ? t('classCard.enrolledWithMax', {
                      enrolled: classData.enrolled,
                      max: classData.capacity.max,
                    })
                  : t('classCard.enrolled', { count: classData.enrolled })}
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {onConfirm && onDeny && localStatus === 'pending' && (
        <View className="flex-row gap-3 border-t border-border pt-4">
          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-xl bg-red-500/10"
            style={{ height: 48 }}
            onPress={handleDeny}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Icon name="X" size={18} color="#EF4444" />
                <ThemedText className="ml-2 font-semibold" style={{ color: '#EF4444' }}>
                  {t('classCard.decline')}
                </ThemedText>
              </>
            )}
          </Pressable>

          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-xl bg-green-500/10"
            style={{ height: 48 }}
            onPress={handleConfirm}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <Icon name="Check" size={18} color="#10B981" />
                <ThemedText className="ml-2 font-semibold" style={{ color: '#10B981' }}>
                  {t('classCard.confirm')}
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>
      )}

      {onConfirm && onDeny && localStatus === 'confirmed' && (
        <View className="flex-row gap-3 border-t border-border pt-4">
          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-xl border border-border"
            style={{ height: 48 }}
            onPress={handleDeny}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <Icon name="X" size={18} />
                <ThemedText className="ml-2 font-semibold">
                  {t('classCard.cancelAttendance')}
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>
      )}

      {onConfirm && onDeny && localStatus === 'denied' && (
        <View className="flex-row gap-3 border-t border-border pt-4">
          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-xl border border-border"
            style={{ height: 48 }}
            onPress={handleConfirm}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <Icon name="Check" size={18} />
                <ThemedText className="ml-2 font-semibold">
                  {t('classCard.confirmAttendance')}
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
});

export default ClassCard;
