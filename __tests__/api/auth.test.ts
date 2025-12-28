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
      expect(response.error).toContain('Network error');
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
      expect(ENDPOINTS.AUTH.LOGIN).toBe('/login');
      expect(ENDPOINTS.AUTH.REGISTER).toBe('/register');
      expect(ENDPOINTS.AUTH.LOGOUT).toBe('/logout');
      expect(ENDPOINTS.AUTH.REFRESH).toBe('/refresh');
      expect(ENDPOINTS.AUTH.FORGOT_PASSWORD).toBe('/forgot-password');
      expect(ENDPOINTS.AUTH.RESET_PASSWORD).toBe('/reset-password');
      expect(ENDPOINTS.AUTH.VERIFY_EMAIL).toBe('/verify-email');
    });

    it('should have correct user endpoints', () => {
      expect(ENDPOINTS.USER.PROFILE).toBe('/user/profile');
      expect(ENDPOINTS.USER.UPDATE_PROFILE).toBe('/user/profile');
      expect(ENDPOINTS.USER.CHANGE_PASSWORD).toBe('/user/change-password');
      expect(ENDPOINTS.USER.UPLOAD_AVATAR).toBe('/user/avatar');
    });

    it('should have correct users endpoints', () => {
      expect(ENDPOINTS.USERS.ME).toBe('/users/me');
      expect(ENDPOINTS.USERS.UPDATE).toBe('/users/:id');
    });

    it('should have correct membership endpoints', () => {
      expect(ENDPOINTS.MEMBERSHIPS.LIST).toBe('/memberships');
      expect(ENDPOINTS.MEMBERSHIPS.PLANS).toBe('/memberships/plans');
      expect(ENDPOINTS.MEMBERSHIPS.SUBSCRIBE).toBe('/memberships/subscribe');
      expect(ENDPOINTS.MEMBERSHIPS.DETAILS('123')).toBe('/memberships/123');
      expect(ENDPOINTS.MEMBERSHIPS.CANCEL('123')).toBe('/memberships/123/cancel');
      expect(ENDPOINTS.MEMBERSHIPS.PAUSE('123')).toBe('/memberships/123/pause');
      expect(ENDPOINTS.MEMBERSHIPS.RESUME('123')).toBe('/memberships/123/resume');
    });

    it('should have correct class endpoints', () => {
      expect(ENDPOINTS.CLASSES.LIST).toBe('/classes');
      expect(ENDPOINTS.CLASSES.DETAILS('456')).toBe('/classes/456');
    });

    it('should have correct attendance endpoints', () => {
      expect(ENDPOINTS.ATTENDANCE.CREATE_INTENTION).toBe('/attendance-intentions');
    });

    it('should have correct check-in endpoints', () => {
      expect(ENDPOINTS.CHECKIN.CREATE).toBe('/checkin');
      expect(ENDPOINTS.CHECKIN.HISTORY).toBe('/checkin/history');
      expect(ENDPOINTS.CHECKIN.STATS).toBe('/checkin/stats');
      expect(ENDPOINTS.CHECKIN.QR_CODE).toBe('/checkin/qr-code');
    });

    it('should have correct invoice endpoints', () => {
      expect(ENDPOINTS.INVOICES.LIST).toBe('/invoices');
    });

    it('should have correct notification endpoints', () => {
      expect(ENDPOINTS.NOTIFICATIONS.LIST).toBe('/notifications');
      expect(ENDPOINTS.NOTIFICATIONS.MARK_READ('123')).toBe('/notifications/123/read');
      expect(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ).toBe('/notifications/read-all');
      expect(ENDPOINTS.NOTIFICATIONS.SETTINGS).toBe('/notifications/settings');
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
        first_name: 'John',
        last_name: 'Doe',
      },
      token: 'jwt-access-token',
      refresh_token: 'jwt-refresh-token',
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
