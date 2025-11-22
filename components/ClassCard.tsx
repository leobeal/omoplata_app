import React, { useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import ThemedText from './ThemedText';
import Icon from './Icon';
import Avatar from './Avatar';
import { Class } from '@/api/classes';
import { useThemeColors } from '@/contexts/ThemeColors';

interface ClassCardProps {
  classData: Class;
  onConfirm: (classId: string) => Promise<void>;
  onDeny: (classId: string) => Promise<void>;
}

export default function ClassCard({ classData, onConfirm, onDeny }: ClassCardProps) {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(classData.status);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const classDate = new Date(date);
    classDate.setHours(0, 0, 0, 0);

    if (classDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (classDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(classData.id);
      setLocalStatus('confirmed');
    } catch (error) {
      console.error('Error confirming attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    setLoading(true);
    try {
      await onDeny(classData.id);
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
              Confirmed
            </ThemedText>
          </View>
        );
      case 'denied':
        return (
          <View className="flex-row items-center rounded-full bg-red-500/20 px-3 py-1">
            <Icon name="X" size={14} color="#EF4444" />
            <ThemedText className="ml-1 text-xs font-semibold" style={{ color: '#EF4444' }}>
              Declined
            </ThemedText>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className="mb-4 rounded-2xl bg-secondary p-5">
      {/* Header */}
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <ThemedText className="mb-1 text-lg font-bold">{classData.title}</ThemedText>
          <View className="flex-row items-center">
            <Icon name="User" size={14} className="mr-1 opacity-50" />
            <ThemedText className="text-sm opacity-70">{classData.instructor}</ThemedText>
          </View>
        </View>
        {getStatusBadge()}
      </View>

      {/* Class Info */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Icon name="Calendar" size={16} className="mr-2 opacity-50" />
          <ThemedText className="text-sm opacity-70">{formatDate(classData.date)}</ThemedText>
        </View>
        <View className="flex-row items-center">
          <Icon name="Clock" size={16} className="mr-2 opacity-50" />
          <ThemedText className="text-sm opacity-70">
            {formatTime(classData.startTime)} - {formatTime(classData.endTime)}
          </ThemedText>
        </View>
      </View>

      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Icon name="MapPin" size={16} className="mr-2 opacity-50" />
          <ThemedText className="text-sm opacity-70">{classData.location}</ThemedText>
        </View>
        <View className="flex-row items-center">
          <Icon name="Users" size={16} className="mr-2 opacity-50" />
          <ThemedText className="text-sm opacity-70">
            {classData.enrolled}/{classData.capacity} enrolled
          </ThemedText>
        </View>
      </View>

      {/* Action Buttons */}
      {localStatus === 'pending' && (
        <View className="flex-row gap-3 border-t border-border pt-4">
          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-xl bg-red-500/10 py-3"
            onPress={handleDeny}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Icon name="X" size={18} color="#EF4444" />
                <ThemedText className="ml-2 font-semibold" style={{ color: '#EF4444' }}>
                  Decline
                </ThemedText>
              </>
            )}
          </Pressable>

          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-xl bg-green-500/10 py-3"
            onPress={handleConfirm}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <Icon name="Check" size={18} color="#10B981" />
                <ThemedText className="ml-2 font-semibold" style={{ color: '#10B981' }}>
                  Confirm
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>
      )}

      {localStatus === 'confirmed' && (
        <View className="flex-row gap-3 border-t border-border pt-4">
          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-xl border border-border py-3"
            onPress={handleDeny}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <Icon name="X" size={18} />
                <ThemedText className="ml-2 font-semibold">Cancel Attendance</ThemedText>
              </>
            )}
          </Pressable>
        </View>
      )}

      {localStatus === 'denied' && (
        <View className="flex-row gap-3 border-t border-border pt-4">
          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-xl border border-border py-3"
            onPress={handleConfirm}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <Icon name="Check" size={18} />
                <ThemedText className="ml-2 font-semibold">Confirm Attendance</ThemedText>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
