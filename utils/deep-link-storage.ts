import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_CHECKIN_KEY = '@omoplata:pendingCheckin';

export interface PendingCheckin {
  location: string;
  code?: string;
  tenantSlug?: string;
  timestamp: number;
}

/**
 * Save pending check-in data when user needs to log in first
 */
export async function savePendingCheckin(data: Omit<PendingCheckin, 'timestamp'>): Promise<void> {
  const pendingCheckin: PendingCheckin = {
    ...data,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(PENDING_CHECKIN_KEY, JSON.stringify(pendingCheckin));
}

/**
 * Get pending check-in data if it exists and is not expired (5 minutes)
 */
export async function getPendingCheckin(): Promise<PendingCheckin | null> {
  try {
    const data = await AsyncStorage.getItem(PENDING_CHECKIN_KEY);
    if (!data) return null;

    const pendingCheckin: PendingCheckin = JSON.parse(data);

    // Check if expired (5 minutes)
    const EXPIRY_MS = 5 * 60 * 1000;
    if (Date.now() - pendingCheckin.timestamp > EXPIRY_MS) {
      await clearPendingCheckin();
      return null;
    }

    return pendingCheckin;
  } catch (error) {
    console.error('Failed to get pending check-in:', error);
    return null;
  }
}

/**
 * Clear pending check-in data
 */
export async function clearPendingCheckin(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_CHECKIN_KEY);
}

/**
 * Extract tenant slug from a domain/hostname
 * e.g., "evolve-grappling.omoplata.de" -> "evolve-grappling"
 */
export function extractTenantFromHost(hostname: string | null): string | null {
  if (!hostname) return null;

  // Match pattern: {tenant}.omoplata.de or {tenant}.omoplata.eu or {tenant}.sportsmanager.test
  const match = hostname.match(/^([^.]+)\.(omoplata\.de|omoplata\.eu|sportsmanager\.test)$/);
  if (match) {
    return match[1];
  }

  return null;
}
