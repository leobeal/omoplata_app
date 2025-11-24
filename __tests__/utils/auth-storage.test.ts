import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveAuthToken,
  loadAuthToken,
  clearAuthToken,
  saveRefreshToken,
  loadRefreshToken,
  clearRefreshToken,
  saveUser,
  loadUser,
  clearUser,
  clearAllAuthData,
  clearAllTenantsAuthData,
  StoredUser,
} from '@/utils/auth-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Auth Storage - Tenant-Based', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock implementations
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
    mockAsyncStorage.getAllKeys.mockResolvedValue([]);
    mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
  });

  const testUser: StoredUser = {
    id: '123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    avatar: 'https://example.com/avatar.jpg',
    membershipId: 'MEM123',
  };

  describe('Auth Token', () => {
    it('should save auth token without tenant', async () => {
      await saveAuthToken('token123');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@omoplata/auth_token', 'token123');
    });

    it('should save auth token with tenant slug', async () => {
      await saveAuthToken('token456', 'evolve');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@omoplata/auth_token:evolve', 'token456');
    });

    it('should load auth token without tenant', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('token123');
      const token = await loadAuthToken();
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@omoplata/auth_token');
      expect(token).toBe('token123');
    });

    it('should load auth token with tenant slug', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('token456');
      const token = await loadAuthToken('sparta');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@omoplata/auth_token:sparta');
      expect(token).toBe('token456');
    });

    it('should return null when token does not exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      const token = await loadAuthToken('evolve');
      expect(token).toBeNull();
    });

    it('should clear auth token without tenant', async () => {
      await clearAuthToken();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/auth_token');
    });

    it('should clear auth token with tenant slug', async () => {
      await clearAuthToken('evolve');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/auth_token:evolve');
    });

    it('should handle save error gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      await expect(saveAuthToken('token', 'evolve')).rejects.toThrow('Storage error');
    });
  });

  describe('Refresh Token', () => {
    it('should save refresh token with tenant slug', async () => {
      await saveRefreshToken('refresh789', 'evolve');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@omoplata/refresh_token:evolve',
        'refresh789'
      );
    });

    it('should load refresh token with tenant slug', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('refresh789');
      const token = await loadRefreshToken('sparta');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@omoplata/refresh_token:sparta');
      expect(token).toBe('refresh789');
    });

    it('should clear refresh token with tenant slug', async () => {
      await clearRefreshToken('evolve');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/refresh_token:evolve');
    });
  });

  describe('User Data', () => {
    it('should save user data without tenant', async () => {
      await saveUser(testUser);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@omoplata/user',
        JSON.stringify(testUser)
      );
    });

    it('should save user data with tenant slug', async () => {
      await saveUser(testUser, 'evolve');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@omoplata/user:evolve',
        JSON.stringify(testUser)
      );
    });

    it('should load user data with tenant slug', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(testUser));
      const user = await loadUser('sparta');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@omoplata/user:sparta');
      expect(user).toEqual(testUser);
    });

    it('should return null when user data does not exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      const user = await loadUser('evolve');
      expect(user).toBeNull();
    });

    it('should return null when user data is invalid JSON', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');
      const user = await loadUser('evolve');
      expect(user).toBeNull();
    });

    it('should clear user data with tenant slug', async () => {
      await clearUser('evolve');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/user:evolve');
    });
  });

  describe('Clear All Auth Data', () => {
    it('should clear all auth data for a specific tenant', async () => {
      await clearAllAuthData('evolve');

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(3);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/auth_token:evolve');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/refresh_token:evolve');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/user:evolve');
    });

    it('should clear all auth data without tenant', async () => {
      await clearAllAuthData();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(3);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/auth_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/refresh_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/user');
    });
  });

  describe('Clear All Tenants Auth Data', () => {
    it('should clear auth data for all tenants', async () => {
      const allKeys = [
        '@omoplata/auth_token:evolve',
        '@omoplata/auth_token:sparta',
        '@omoplata/refresh_token:evolve',
        '@omoplata/refresh_token:sparta',
        '@omoplata/user:evolve',
        '@omoplata/user:sparta',
        '@other/key', // Should not be removed
      ];

      mockAsyncStorage.getAllKeys.mockResolvedValue(allKeys);

      await clearAllTenantsAuthData();

      expect(mockAsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@omoplata/auth_token:evolve',
        '@omoplata/auth_token:sparta',
        '@omoplata/refresh_token:evolve',
        '@omoplata/refresh_token:sparta',
        '@omoplata/user:evolve',
        '@omoplata/user:sparta',
      ]);
    });

    it('should not call multiRemove if no auth keys exist', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue(['@other/key', '@another/key']);

      await clearAllTenantsAuthData();

      expect(mockAsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled();
    });

    it('should handle getAllKeys error', async () => {
      mockAsyncStorage.getAllKeys.mockRejectedValue(new Error('Storage error'));

      await expect(clearAllTenantsAuthData()).rejects.toThrow('Storage error');
    });
  });

  describe('Tenant Isolation', () => {
    it('should isolate tokens between different tenants', async () => {
      // Save tokens for different tenants
      await saveAuthToken('token_evolve', 'evolve');
      await saveAuthToken('token_sparta', 'sparta');

      // Load evolve token
      mockAsyncStorage.getItem.mockResolvedValueOnce('token_evolve');
      const evolveToken = await loadAuthToken('evolve');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@omoplata/auth_token:evolve');
      expect(evolveToken).toBe('token_evolve');

      // Load sparta token
      mockAsyncStorage.getItem.mockResolvedValueOnce('token_sparta');
      const spartaToken = await loadAuthToken('sparta');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@omoplata/auth_token:sparta');
      expect(spartaToken).toBe('token_sparta');
    });

    it('should not affect other tenants when clearing one tenant', async () => {
      // Clear evolve tenant
      await clearAllAuthData('evolve');

      // Verify only evolve keys were cleared
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/auth_token:evolve');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/refresh_token:evolve');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@omoplata/user:evolve');

      // Verify sparta keys were not cleared
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalledWith('@omoplata/auth_token:sparta');
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalledWith(
        '@omoplata/refresh_token:sparta'
      );
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalledWith('@omoplata/user:sparta');
    });
  });

  describe('Switching Tenants', () => {
    it('should allow storing different users for different tenants', async () => {
      const evolveUser: StoredUser = { ...testUser, id: '1', email: 'evolve@example.com' };
      const spartaUser: StoredUser = { ...testUser, id: '2', email: 'sparta@example.com' };

      // Save users for different tenants
      await saveUser(evolveUser, 'evolve');
      await saveUser(spartaUser, 'sparta');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@omoplata/user:evolve',
        JSON.stringify(evolveUser)
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@omoplata/user:sparta',
        JSON.stringify(spartaUser)
      );

      // Load evolve user
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(evolveUser));
      const loadedEvolveUser = await loadUser('evolve');
      expect(loadedEvolveUser).toEqual(evolveUser);

      // Load sparta user
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(spartaUser));
      const loadedSpartaUser = await loadUser('sparta');
      expect(loadedSpartaUser).toEqual(spartaUser);
    });
  });
});
