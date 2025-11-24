import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { TenantProvider } from '../../contexts/TenantContext';
import * as authStorage from '../../utils/auth-storage';
import * as apiClient from '../../api/client';
import { authApi } from '../../api/auth';

// Mock dependencies
jest.mock('../../utils/auth-storage');
jest.mock('../../api/client');
jest.mock('../../api/auth');

describe('AuthContext', () => {
  const mockAuthStorage = authStorage as jest.Mocked<typeof authStorage>;
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
  const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockAuthStorage.loadAuthToken.mockResolvedValue(null);
    mockAuthStorage.loadUser.mockResolvedValue(null);
    mockAuthStorage.loadRefreshToken.mockResolvedValue(null);
    mockAuthStorage.saveAuthToken.mockResolvedValue();
    mockAuthStorage.saveUser.mockResolvedValue();
    mockAuthStorage.saveRefreshToken.mockResolvedValue();
    mockAuthStorage.clearAllAuthData.mockResolvedValue();
    mockApiClient.setAuthToken.mockImplementation(() => {});
  });

  // Helper to create wrapper with providers
  const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
    <TenantProvider>
      <AuthProvider>{children}</AuthProvider>
    </TenantProvider>
  );

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('should load existing auth data on mount', async () => {
      const mockToken = 'stored-token-123';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockAuthStorage.loadAuthToken.mockResolvedValue(mockToken);
      mockAuthStorage.loadUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.token).toBe(mockToken);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(mockToken);
    });

    it('should remain unauthenticated when no stored data exists', async () => {
      mockAuthStorage.loadAuthToken.mockResolvedValue(null);
      mockAuthStorage.loadUser.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      mockAuthStorage.loadAuthToken.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Login', () => {
    it('should login successfully with refresh token', async () => {
      // Mock API response returns camelCase (because auth.ts transforms it)
      const mockLoginResponse = {
        data: {
          token: 'new-auth-token',
          refreshToken: 'new-refresh-token',
          user: {
            id: 'usr_456',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Smith',
            phone: '1234567890',
            avatar: 'https://example.com/avatar.jpg',
            membershipId: 'mem-123',
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
        error: null,
      };

      mockAuthApi.login.mockResolvedValue(mockLoginResponse as any);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; error?: string } | undefined;
      await act(async () => {
        loginResult = await result.current.login('john@example.com', 'password123');
      });

      expect(loginResult?.success).toBe(true);
      expect(mockAuthStorage.saveAuthToken).toHaveBeenCalledWith('new-auth-token', 'evolve');
      expect(mockAuthStorage.saveRefreshToken).toHaveBeenCalledWith('new-refresh-token', 'evolve');
      expect(mockAuthStorage.saveUser).toHaveBeenCalledWith({
        id: 'usr_456',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Smith',
        phone: '1234567890',
        avatar: 'https://example.com/avatar.jpg',
        membershipId: 'mem-123',
      }, 'evolve');

      expect(result.current.token).toBe('new-auth-token');
      expect(result.current.user?.email).toBe('john@example.com');
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('new-auth-token');
    });

    it('should login successfully without refresh token', async () => {
      const mockLoginResponse = {
        data: {
          token: 'new-auth-token',
          refreshToken: undefined, // No refresh token
          user: {
            id: 'usr_456',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Smith',
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
        error: null,
      };

      mockAuthApi.login.mockResolvedValue(mockLoginResponse as any);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; error?: string } | undefined;
      await act(async () => {
        loginResult = await result.current.login('john@example.com', 'password123');
      });

      expect(loginResult?.success).toBe(true);
      expect(mockAuthStorage.saveAuthToken).toHaveBeenCalledWith('new-auth-token', 'evolve');
      expect(mockAuthStorage.saveRefreshToken).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login failure with error message', async () => {
      const mockLoginResponse = {
        data: null,
        error: 'Invalid credentials',
      };

      mockAuthApi.login.mockResolvedValue(mockLoginResponse as any);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; error?: string } | undefined;
      await act(async () => {
        loginResult = await result.current.login('wrong@example.com', 'wrongpassword');
      });

      expect(loginResult?.success).toBe(false);
      expect(loginResult?.error).toBe('Invalid credentials');
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockAuthStorage.saveAuthToken).not.toHaveBeenCalled();
    });

    it('should handle login network errors', async () => {
      mockAuthApi.login.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; error?: string } | undefined;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult?.success).toBe(false);
      expect(loginResult?.error).toBe('Network error');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should logout successfully and clear all data', async () => {
      const mockToken = 'existing-token';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockAuthStorage.loadAuthToken.mockResolvedValue(mockToken);
      mockAuthStorage.loadUser.mockResolvedValue(mockUser);
      mockAuthApi.logout.mockResolvedValue({ data: { success: true }, error: null } as any);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthApi.logout).toHaveBeenCalled();
      expect(mockAuthStorage.clearAllAuthData).toHaveBeenCalled();
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
    });

    it('should clear local data even if API logout fails', async () => {
      const mockToken = 'existing-token';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockAuthStorage.loadAuthToken.mockResolvedValue(mockToken);
      mockAuthStorage.loadUser.mockResolvedValue(mockUser);
      mockAuthApi.logout.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthStorage.clearAllAuthData).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Refresh Session', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = 'old-refresh-token';
      const mockNewToken = 'new-auth-token';

      mockAuthStorage.loadRefreshToken.mockResolvedValue(mockRefreshToken);
      mockAuthApi.refreshToken.mockResolvedValue({
        data: { token: mockNewToken },
        error: null,
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockAuthApi.refreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockAuthStorage.saveAuthToken).toHaveBeenCalledWith(mockNewToken, 'evolve');
      expect(result.current.token).toBe(mockNewToken);
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(mockNewToken);
    });

    it('should logout user when refresh token is missing', async () => {
      mockAuthStorage.loadRefreshToken.mockResolvedValue(null);
      mockAuthApi.logout.mockResolvedValue({ data: { success: true }, error: null } as any);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockAuthStorage.clearAllAuthData).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should logout user when refresh fails', async () => {
      const mockRefreshToken = 'invalid-refresh-token';

      mockAuthStorage.loadRefreshToken.mockResolvedValue(mockRefreshToken);
      mockAuthApi.refreshToken.mockResolvedValue({
        data: null,
        error: 'Invalid refresh token',
      } as any);
      mockAuthApi.logout.mockResolvedValue({ data: { success: true }, error: null } as any);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockAuthStorage.clearAllAuthData).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Hook usage', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });
});
