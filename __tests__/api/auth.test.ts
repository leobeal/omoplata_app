import { api, setAuthToken, getAuthToken } from '../../api/client';
import { ENDPOINTS } from '../../api/config';

// Mock fetch globally
global.fetch = jest.fn();

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthToken(null);
  });

  describe('Token Management', () => {
    it('should set auth token', () => {
      setAuthToken('test-token-123');
      expect(getAuthToken()).toBe('test-token-123');
    });

    it('should clear auth token when set to null', () => {
      setAuthToken('test-token-123');
      setAuthToken(null);
      expect(getAuthToken()).toBeNull();
    });

    it('should include auth token in request headers', async () => {
      setAuthToken('bearer-token-123');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      await api.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer bearer-token-123',
          }),
        })
      );
    });
  });

  describe('API Client', () => {
    it('should make GET request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Test' }),
      });

      const response = await api.get('/users/1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(response.data).toEqual({ id: 1, name: 'Test' });
      expect(response.error).toBeNull();
    });

    it('should make POST request with body', async () => {
      const requestBody = { email: 'test@example.com', password: 'password123' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'jwt-token' }),
      });

      const response = await api.post('/auth/login', requestBody);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
      expect(response.data).toEqual({ token: 'jwt-token' });
    });

    it('should make PUT request', async () => {
      const updateData = { firstName: 'John', lastName: 'Doe' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, ...updateData }),
      });

      const response = await api.put('/users/1', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(response.data).toEqual({ id: 1, ...updateData });
    });

    it('should make DELETE request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await api.delete('/users/1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(response.data).toEqual({ success: true });
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      });

      const response = await api.post('/auth/login', {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(response.data).toBeNull();
      expect(response.error).toBe('Invalid credentials');
      expect(response.status).toBe(401);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const response = await api.get('/test');

      expect(response.data).toBeNull();
      expect(response.error).toBe('Network error');
      expect(response.status).toBe(0);
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const response = await api.get('/test');

      expect(response.data).toBeNull();
    });
  });

  describe('API Endpoints', () => {
    it('should have correct auth endpoints', () => {
      expect(ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
      expect(ENDPOINTS.AUTH.REGISTER).toBe('/auth/register');
      expect(ENDPOINTS.AUTH.LOGOUT).toBe('/auth/logout');
      expect(ENDPOINTS.AUTH.REFRESH).toBe('/auth/refresh');
      expect(ENDPOINTS.AUTH.FORGOT_PASSWORD).toBe('/auth/forgot-password');
      expect(ENDPOINTS.AUTH.RESET_PASSWORD).toBe('/auth/reset-password');
    });

    it('should have correct user endpoints', () => {
      expect(ENDPOINTS.USER.PROFILE).toBe('/user/profile');
      expect(ENDPOINTS.USER.UPDATE_PROFILE).toBe('/user/profile');
      expect(ENDPOINTS.USER.CHANGE_PASSWORD).toBe('/user/change-password');
    });

    it('should have correct membership endpoints', () => {
      expect(ENDPOINTS.MEMBERSHIPS.LIST).toBe('/memberships');
      expect(ENDPOINTS.MEMBERSHIPS.PLANS).toBe('/memberships/plans');
      expect(ENDPOINTS.MEMBERSHIPS.SUBSCRIBE).toBe('/memberships/subscribe');
      expect(ENDPOINTS.MEMBERSHIPS.DETAILS('123')).toBe('/memberships/123');
      expect(ENDPOINTS.MEMBERSHIPS.CANCEL('123')).toBe('/memberships/123/cancel');
    });

    it('should have correct class endpoints', () => {
      expect(ENDPOINTS.CLASSES.LIST).toBe('/classes');
      expect(ENDPOINTS.CLASSES.SCHEDULE).toBe('/classes/schedule');
      expect(ENDPOINTS.CLASSES.DETAILS('456')).toBe('/classes/456');
      expect(ENDPOINTS.CLASSES.BOOK('456')).toBe('/classes/456/book');
    });
  });
});

describe('Login Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthToken(null);
  });

  it('should login successfully and store token', async () => {
    const mockLoginResponse = {
      user: {
        id: 'usr_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      token: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLoginResponse),
    });

    const response = await api.post(ENDPOINTS.AUTH.LOGIN, {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.data).toEqual(mockLoginResponse);
    expect(response.error).toBeNull();

    // Simulate token storage
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    expect(getAuthToken()).toBe('jwt-access-token');
  });

  it('should handle invalid credentials', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid email or password' }),
    });

    const response = await api.post(ENDPOINTS.AUTH.LOGIN, {
      email: 'wrong@example.com',
      password: 'wrongpassword',
    });

    expect(response.data).toBeNull();
    expect(response.error).toBe('Invalid email or password');
    expect(response.status).toBe(401);
    expect(getAuthToken()).toBeNull();
  });

  it('should handle too many login attempts', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ message: 'Too many login attempts. Please try again later.' }),
    });

    const response = await api.post(ENDPOINTS.AUTH.LOGIN, {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.error).toBe('Too many login attempts. Please try again later.');
    expect(response.status).toBe(429);
  });
});

describe('Logout Flow', () => {
  it('should logout and clear token', async () => {
    setAuthToken('existing-token');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await api.post(ENDPOINTS.AUTH.LOGOUT);

    expect(response.data).toEqual({ success: true });

    // Simulate token clearing on logout
    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
  });
});
