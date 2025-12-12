import { apiRequest } from './client';

import data from '@/data/privacy-settings.json';

// API response types (snake_case from backend)
interface ApiPrivacySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface ApiPrivacySettingsResponse {
  settings: ApiPrivacySetting[];
}

// Internal types (camelCase for app)
export interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface PrivacySettingsResponse {
  settings: PrivacySetting[];
}

// Transform API response to internal format
const transformSetting = (api: ApiPrivacySetting): PrivacySetting => ({
  id: api.id,
  title: api.title,
  description: api.description,
  enabled: api.enabled,
});

// Cast mock data
const mockData = data as ApiPrivacySettingsResponse;

/**
 * Fetch privacy settings for the current user
 */
export const getPrivacySettings = async (): Promise<PrivacySettingsResponse> => {
  const response = await apiRequest<ApiPrivacySettingsResponse>('/users/privacy-settings');

  if (response.error || !response.data) {
    console.warn('[PrivacySettings] API failed, using mock data:', response.error);
    return {
      settings: mockData.settings.map(transformSetting),
    };
  }

  return {
    settings: response.data.settings.map(transformSetting),
  };
};

/**
 * Update a single privacy setting
 */
export const updatePrivacySetting = async (
  settingId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> => {
  const response = await apiRequest<{ success: boolean }>('/users/privacy-settings', {
    method: 'PATCH',
    body: {
      setting_id: settingId,
      enabled,
    },
  });

  if (response.error) {
    console.warn('[PrivacySettings] Update failed:', response.error);
    return { success: false, error: response.error };
  }

  return { success: true };
};
