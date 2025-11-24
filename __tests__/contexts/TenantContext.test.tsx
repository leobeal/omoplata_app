import { renderHook, act, waitFor } from '@testing-library/react-native';
import Constants from 'expo-constants';
import React from 'react';

import * as apiConfig from '../../api/config';
import { TenantProvider, useTenant } from '../../contexts/TenantContext';
import * as tenantStorage from '../../utils/tenant-storage';

// Mock dependencies
jest.mock('../../utils/tenant-storage');
jest.mock('../../api/config');
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {},
  },
}));

describe('TenantContext', () => {
  const mockTenantStorage = tenantStorage as jest.Mocked<typeof tenantStorage>;
  const mockApiConfig = apiConfig as jest.Mocked<typeof apiConfig>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockTenantStorage.loadTenant.mockResolvedValue(null);
    mockTenantStorage.saveTenant.mockResolvedValue();
    mockTenantStorage.clearTenant.mockResolvedValue();
    mockApiConfig.setTenant.mockImplementation(() => {});

    // Reset expo config
    (Constants.expoConfig as any) = { extra: {} };
  });

  describe('Initialization - Generic Build', () => {
    beforeEach(() => {
      // Generic build has no tenant configured
      (Constants.expoConfig as any) = { extra: { env: 'development' } };
    });

    it('should initialize with loading state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isTenantRequired).toBe(true);
      expect(result.current.tenant).toBeNull();
    });

    it('should load saved tenant from storage', async () => {
      const mockTenant = {
        slug: 'testgym',
        name: 'Test Gym',
        domain: 'testgym.sportsmanager.test',
      };

      mockTenantStorage.loadTenant.mockResolvedValue(mockTenant);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tenant).toEqual(mockTenant);
      expect(result.current.isTenantRequired).toBe(true);
      expect(mockApiConfig.setTenant).toHaveBeenCalledWith('testgym');
    });

    it('should remain without tenant when no saved tenant exists', async () => {
      mockTenantStorage.loadTenant.mockResolvedValue(null);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tenant).toBeNull();
      expect(result.current.isTenantRequired).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      mockTenantStorage.loadTenant.mockRejectedValue(new Error('Storage error'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tenant).toBeNull();
    });
  });

  describe('Initialization - Tenant-Specific Build', () => {
    beforeEach(() => {
      // Tenant-specific build has tenant configured
      (Constants.expoConfig as any) = {
        extra: {
          tenant: 'specificgym',
          env: 'development',
        },
      };
    });

    it('should use configured tenant from build', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tenant).toEqual({
        slug: 'specificgym',
        name: 'Specificgym',
        domain: 'specificgym.sportsmanager.test',
      });
      expect(result.current.isTenantRequired).toBe(false);
      expect(mockApiConfig.setTenant).toHaveBeenCalledWith('specificgym');
      expect(mockTenantStorage.loadTenant).not.toHaveBeenCalled();
    });

    it('should not load from storage when tenant is configured', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(mockTenantStorage.loadTenant).not.toHaveBeenCalled();
      });
    });
  });

  describe('Domain Generation', () => {
    it('should generate development domain', async () => {
      (Constants.expoConfig as any) = {
        extra: {
          tenant: 'testgym',
          env: 'development',
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tenant?.domain).toBe('testgym.sportsmanager.test');
    });

    it('should generate staging domain', async () => {
      (Constants.expoConfig as any) = {
        extra: {
          tenant: 'testgym',
          env: 'staging',
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tenant?.domain).toBe('testgym.omoplata.eu');
    });

    it('should generate production domain', async () => {
      (Constants.expoConfig as any) = {
        extra: {
          tenant: 'testgym',
          env: 'production',
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tenant?.domain).toBe('testgym.omoplata.de');
    });

    it('should default to development domain when env is not specified', async () => {
      (Constants.expoConfig as any) = {
        extra: {
          tenant: 'testgym',
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tenant?.domain).toBe('testgym.sportsmanager.test');
    });
  });

  describe('Set Tenant', () => {
    beforeEach(() => {
      // Generic build for these tests
      (Constants.expoConfig as any) = { extra: { env: 'development' } };
    });

    it('should set tenant and persist to storage', async () => {
      const newTenant = {
        slug: 'newgym',
        name: 'New Gym',
        domain: 'newgym.sportsmanager.test',
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setTenant(newTenant);
      });

      expect(mockTenantStorage.saveTenant).toHaveBeenCalledWith(newTenant);
      expect(result.current.tenant).toEqual(newTenant);
      expect(mockApiConfig.setTenant).toHaveBeenCalledWith('newgym');
    });

    it('should handle storage errors when setting tenant', async () => {
      const newTenant = {
        slug: 'newgym',
        name: 'New Gym',
        domain: 'newgym.sportsmanager.test',
      };

      mockTenantStorage.saveTenant.mockRejectedValue(new Error('Storage error'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.setTenant(newTenant);
        })
      ).rejects.toThrow('Storage error');
    });
  });

  describe('Clear Tenant', () => {
    beforeEach(() => {
      // Generic build for these tests
      (Constants.expoConfig as any) = { extra: { env: 'development' } };
    });

    it('should clear tenant from storage and state', async () => {
      const mockTenant = {
        slug: 'testgym',
        name: 'Test Gym',
        domain: 'testgym.sportsmanager.test',
      };

      mockTenantStorage.loadTenant.mockResolvedValue(mockTenant);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.tenant).toEqual(mockTenant);
      });

      await act(async () => {
        await result.current.clearTenant();
      });

      expect(mockTenantStorage.clearTenant).toHaveBeenCalled();
      expect(result.current.tenant).toBeNull();
    });

    it('should handle errors when clearing tenant', async () => {
      const mockTenant = {
        slug: 'testgym',
        name: 'Test Gym',
        domain: 'testgym.sportsmanager.test',
      };

      mockTenantStorage.loadTenant.mockResolvedValue(mockTenant);
      mockTenantStorage.clearTenant.mockRejectedValue(new Error('Storage error'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.tenant).toEqual(mockTenant);
      });

      await expect(
        act(async () => {
          await result.current.clearTenant();
        })
      ).rejects.toThrow('Storage error');
    });
  });

  describe('isTenantRequired Flag', () => {
    it('should be true for generic build', async () => {
      (Constants.expoConfig as any) = { extra: {} };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isTenantRequired).toBe(true);
    });

    it('should be false for tenant-specific build', async () => {
      (Constants.expoConfig as any) = {
        extra: {
          tenant: 'specificgym',
          env: 'development',
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TenantProvider>{children}</TenantProvider>
      );

      const { result } = renderHook(() => useTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isTenantRequired).toBe(false);
    });
  });

  describe('Hook usage', () => {
    it('should throw error when used outside TenantProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useTenant());
      }).toThrow('useTenant must be used within a TenantProvider');

      console.error = originalError;
    });
  });
});
