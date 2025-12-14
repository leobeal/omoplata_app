// Device Info Utility
// Collects device information for login

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = '@omoplata/device_id';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string | null;
  platform: string;
  osVersion: string | null;
  modelName: string | null;
}

/**
 * Get or generate a persistent device ID
 */
async function getDeviceId(): Promise<string> {
  try {
    const existingId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existingId) {
      return existingId;
    }

    const newId = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.error('Failed to get/generate device ID:', error);
    return Crypto.randomUUID();
  }
}

/**
 * Collect device information for login
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await getDeviceId();

  return {
    deviceId,
    deviceName: Device.deviceName,
    platform: Platform.OS,
    osVersion: Device.osVersion,
    modelName: Device.modelName,
  };
}
