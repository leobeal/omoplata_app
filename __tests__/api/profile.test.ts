import { getProfile, updateProfile } from '../../api/profile';

// Mock the API client
const mockApiGet = jest.fn();
const mockApiPut = jest.fn();

jest.mock('../../api/client', () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
    put: (...args: any[]) => mockApiPut(...args),
  },
}));

// Mock user data matching the API response format
const mockApiUserResponse = {
  id: 'user-001',
  prefixed_id: 'USR-001',
  first_name: 'John',
  last_name: 'Doe',
  full_name: 'John Doe',
  nickname: null,
  member_number: 'MEM-001',
  email: 'johndoe@example.com',
  gender: 'male',
  locale: 'en',
  phone_country_code: '+1',
  phone: '(555) 123-4567',
  date_of_birth: '1990-05-15',
  profile_picture: null,
  requires_payer: false,
  address: {
    street: '123 Fitness Street',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'USA',
  },
  responsibles: [],
  primary_responsible: null,
  children: [],
};

describe('Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock responses
    mockApiGet.mockResolvedValue({
      data: { user: mockApiUserResponse },
      error: null,
      status: 200,
    });
    mockApiPut.mockResolvedValue({
      data: { user: mockApiUserResponse },
      error: null,
      status: 200,
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const profile = await getProfile();

      expect(profile).toBeDefined();
      expect(profile.id).toBe('user-001');
      expect(profile.firstName).toBe('John');
      expect(profile.lastName).toBe('Doe');
      expect(profile.email).toBe('johndoe@example.com');
      expect(profile.fullName).toBe('John Doe');
      expect(profile.memberNumber).toBe('MEM-001');
    });

    it('should have valid address information', async () => {
      const profile = await getProfile();

      expect(profile.address).toBeDefined();
      expect(profile.address?.street).toBe('123 Fitness Street');
      expect(profile.address?.city).toBe('New York');
      expect(profile.address?.state).toBe('NY');
      expect(profile.address?.postalCode).toBe('10001');
      expect(profile.address?.country).toBe('USA');
    });

    it('should transform API response to internal format', async () => {
      const profile = await getProfile();

      // Check camelCase transformation
      expect(profile.firstName).toBe('John');
      expect(profile.lastName).toBe('Doe');
      expect(profile.fullName).toBe('John Doe');
      expect(profile.memberNumber).toBe('MEM-001');
      expect(profile.phoneCountryCode).toBe('+1');
      expect(profile.dateOfBirth).toBe('1990-05-15');
    });

    it('should handle responsibles array', async () => {
      const mockWithResponsibles = {
        ...mockApiUserResponse,
        responsibles: [
          {
            id: 'resp-001',
            first_name: 'Jane',
            last_name: 'Doe',
            email: 'jane@example.com',
            relationship: 'Spouse',
          },
        ],
      };

      mockApiGet.mockResolvedValueOnce({
        data: { user: mockWithResponsibles },
        error: null,
        status: 200,
      });

      const profile = await getProfile();

      expect(profile.responsibles).toHaveLength(1);
      expect(profile.responsibles[0].firstName).toBe('Jane');
      expect(profile.responsibles[0].lastName).toBe('Doe');
      expect(profile.responsibles[0].relationship).toBe('Spouse');
    });

    it('should handle primary responsible', async () => {
      const mockWithPrimaryResponsible = {
        ...mockApiUserResponse,
        primary_responsible: {
          id: 'resp-001',
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          relationship: 'Spouse',
        },
      };

      mockApiGet.mockResolvedValueOnce({
        data: { user: mockWithPrimaryResponsible },
        error: null,
        status: 200,
      });

      const profile = await getProfile();

      expect(profile.primaryResponsible).toBeDefined();
      expect(profile.primaryResponsible?.firstName).toBe('Jane');
      expect(profile.primaryResponsible?.relationship).toBe('Spouse');
    });

  });

  describe('updateProfile', () => {
    it('should update profile with new data', async () => {
      const userId = 'user-001';
      const updates = {
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '(555) 111-2222',
      };

      const mockUpdatedUser = {
        ...mockApiUserResponse,
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith',
        phone: '(555) 111-2222',
      };

      mockApiPut.mockResolvedValueOnce({
        data: { user: mockUpdatedUser },
        error: null,
        status: 200,
      });

      const updatedProfile = await updateProfile(userId, updates);

      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.firstName).toBe('Jane');
      expect(updatedProfile.lastName).toBe('Smith');
      expect(updatedProfile.phone).toBe('(555) 111-2222');
      expect(mockApiPut).toHaveBeenCalledWith(
        expect.stringContaining(userId),
        updates
      );
    });

    it('should update address fields', async () => {
      const userId = 'user-001';
      const updates = {
        address: {
          street: '456 New Street',
          city: 'Los Angeles',
          state: 'CA',
          postal_code: '90001',
          country: 'USA',
        },
      };

      const mockUpdatedUser = {
        ...mockApiUserResponse,
        address: {
          street: '456 New Street',
          city: 'Los Angeles',
          state: 'CA',
          postal_code: '90001',
          country: 'USA',
        },
      };

      mockApiPut.mockResolvedValueOnce({
        data: { user: mockUpdatedUser },
        error: null,
        status: 200,
      });

      const updatedProfile = await updateProfile(userId, updates);

      expect(updatedProfile.address?.street).toBe('456 New Street');
      expect(updatedProfile.address?.city).toBe('Los Angeles');
      expect(updatedProfile.address?.state).toBe('CA');
      expect(updatedProfile.address?.postalCode).toBe('90001');
    });

    it('should call correct API endpoint', async () => {
      const userId = 'user-123';
      const updates = {
        first_name: 'UpdatedName',
      };

      await updateProfile(userId, updates);

      expect(mockApiPut).toHaveBeenCalledWith(
        expect.stringContaining(userId),
        updates
      );
    });

    it('should handle empty updates object', async () => {
      const userId = 'user-001';
      const updatedProfile = await updateProfile(userId, {});

      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.firstName).toBe('John');
      expect(updatedProfile.lastName).toBe('Doe');
    });

    it('should transform updated API response correctly', async () => {
      const userId = 'user-001';
      const updates = {
        phone_country_code: '+44',
        phone: '1234567890',
      };

      const mockUpdatedUser = {
        ...mockApiUserResponse,
        phone_country_code: '+44',
        phone: '1234567890',
      };

      mockApiPut.mockResolvedValueOnce({
        data: { user: mockUpdatedUser },
        error: null,
        status: 200,
      });

      const updatedProfile = await updateProfile(userId, updates);

      expect(updatedProfile.phoneCountryCode).toBe('+44');
      expect(updatedProfile.phone).toBe('1234567890');
    });
  });
});
