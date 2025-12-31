import AsyncStorage from '@react-native-async-storage/async-storage';

const TENANT_STORAGE_KEY = '@omoplata/tenant';

export interface TenantInfo {
  slug: string;
  name: string;
  domain: string;
  loginBackground?: string;
  dashboardBackground?: string;
  forgotPasswordBackground?: string;
  logo?: string;
  signup_link?: string;
}

/**
 * Save selected tenant to persistent storage
 */
export const saveTenant = async (tenant: TenantInfo): Promise<void> => {
  try {
    await AsyncStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
  } catch (error) {
    console.error('Failed to save tenant:', error);
    throw error;
  }
};

/**
 * Load saved tenant from persistent storage
 */
export const loadTenant = async (): Promise<TenantInfo | null> => {
  try {
    const tenantJson = await AsyncStorage.getItem(TENANT_STORAGE_KEY);
    if (!tenantJson) {
      return null;
    }
    return JSON.parse(tenantJson);
  } catch (error) {
    console.error('Failed to load tenant:', error);
    return null;
  }
};

/**
 * Clear saved tenant from storage
 */
export const clearTenant = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TENANT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear tenant:', error);
    throw error;
  }
};
