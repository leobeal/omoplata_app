import { getPrivacySettings, updatePrivacySetting } from '@/api/privacy-settings';
import { apiRequest } from '@/api/client';

// Mock the API client
jest.mock('@/api/client', () => ({
  apiRequest: jest.fn(),
}));

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('Privacy Settings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrivacySettings', () => {
    it('should return settings from API when successful', async () => {
      const mockApiResponse = {
        settings: [
          {
            id: 'show_on_leaderboard',
            title: 'Show on Leaderboard',
            description: 'Allow your name to appear on the leaderboard',
            enabled: true,
          },
          {
            id: 'public_profile',
            title: 'Public Profile',
            description: 'Allow others to view your profile',
            enabled: false,
          },
        ],
      };

      mockedApiRequest.mockResolvedValueOnce({
        data: mockApiResponse,
        error: null,
        status: 200,
      });

      const result = await getPrivacySettings();

      expect(mockedApiRequest).toHaveBeenCalledWith('/users/privacy-settings');
      expect(result.settings).toHaveLength(2);
      expect(result.settings[0].id).toBe('show_on_leaderboard');
      expect(result.settings[0].title).toBe('Show on Leaderboard');
      expect(result.settings[0].enabled).toBe(true);
      expect(result.settings[1].id).toBe('public_profile');
      expect(result.settings[1].enabled).toBe(false);
    });

    it('should return mock data when API fails', async () => {
      mockedApiRequest.mockResolvedValueOnce({
        data: null,
        error: 'Network error',
        status: 500,
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await getPrivacySettings();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PrivacySettings] API failed, using mock data:',
        'Network error'
      );
      expect(result.settings).toBeDefined();
      expect(result.settings.length).toBeGreaterThan(0);
      // Mock data should have the expected structure
      expect(result.settings[0]).toHaveProperty('id');
      expect(result.settings[0]).toHaveProperty('title');
      expect(result.settings[0]).toHaveProperty('description');
      expect(result.settings[0]).toHaveProperty('enabled');

      consoleSpy.mockRestore();
    });

    it('should transform API response correctly', async () => {
      const mockApiResponse = {
        settings: [
          {
            id: 'test_setting',
            title: 'Test Setting',
            description: 'A test description',
            enabled: true,
          },
        ],
      };

      mockedApiRequest.mockResolvedValueOnce({
        data: mockApiResponse,
        error: null,
        status: 200,
      });

      const result = await getPrivacySettings();

      expect(result.settings[0]).toEqual({
        id: 'test_setting',
        title: 'Test Setting',
        description: 'A test description',
        enabled: true,
      });
    });
  });

  describe('updatePrivacySetting', () => {
    it('should return success when API call succeeds', async () => {
      mockedApiRequest.mockResolvedValueOnce({
        data: { success: true },
        error: null,
        status: 200,
      });

      const result = await updatePrivacySetting('show_on_leaderboard', true);

      expect(mockedApiRequest).toHaveBeenCalledWith('/users/privacy-settings', {
        method: 'PATCH',
        body: {
          setting_id: 'show_on_leaderboard',
          enabled: true,
        },
      });
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error when API call fails', async () => {
      mockedApiRequest.mockResolvedValueOnce({
        data: null,
        error: 'Unauthorized',
        status: 401,
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await updatePrivacySetting('public_profile', false);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PrivacySettings] Update failed:',
        'Unauthorized'
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');

      consoleSpy.mockRestore();
    });

    it('should send correct payload for disabling a setting', async () => {
      mockedApiRequest.mockResolvedValueOnce({
        data: { success: true },
        error: null,
        status: 200,
      });

      await updatePrivacySetting('show_profile_picture', false);

      expect(mockedApiRequest).toHaveBeenCalledWith('/users/privacy-settings', {
        method: 'PATCH',
        body: {
          setting_id: 'show_profile_picture',
          enabled: false,
        },
      });
    });
  });
});
