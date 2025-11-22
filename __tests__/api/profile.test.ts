import { getProfile, updateProfile } from '../../api/profile';

describe('Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const profile = await getProfile();

      expect(profile).toBeDefined();
      expect(profile.id).toBe('user-001');
      expect(profile.firstName).toBe('John');
      expect(profile.lastName).toBe('Doe');
      expect(profile.email).toBe('johndoe@example.com');
    });

    it('should have valid address information', async () => {
      const profile = await getProfile();

      expect(profile.address).toBeDefined();
      expect(profile.address.street).toBe('123 Fitness Street');
      expect(profile.address.city).toBe('New York');
      expect(profile.address.state).toBe('NY');
      expect(profile.address.zipCode).toBe('10001');
      expect(profile.address.country).toBe('USA');
    });

    it('should have emergency contact details', async () => {
      const profile = await getProfile();

      expect(profile.emergencyContact).toBeDefined();
      expect(profile.emergencyContact.name).toBe('Jane Doe');
      expect(profile.emergencyContact.relationship).toBe('Spouse');
      expect(profile.emergencyContact.phone).toBe('+1 (555) 987-6543');
    });

    it('should have medical information', async () => {
      const profile = await getProfile();

      expect(profile.medicalInfo).toBeDefined();
      expect(profile.medicalInfo.bloodType).toBe('O+');
      expect(profile.medicalInfo.allergies).toBe('None');
      expect(profile.medicalInfo.conditions).toBe('None');
      expect(profile.medicalInfo.medications).toBe('None');
    });

    it('should have user preferences', async () => {
      const profile = await getProfile();

      expect(profile.preferences).toBeDefined();
      expect(profile.preferences.language).toBe('en');
      expect(profile.preferences.notifications).toBeDefined();
      expect(profile.preferences.notifications.email).toBe(true);
      expect(profile.preferences.notifications.push).toBe(true);
      expect(profile.preferences.notifications.sms).toBe(false);
      expect(profile.preferences.newsletter).toBe(true);
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      await getProfile();
      const endTime = Date.now();

      const delay = endTime - startTime;
      expect(delay).toBeGreaterThanOrEqual(300);
    });
  });

  describe('updateProfile', () => {
    it('should update profile with new data', async () => {
      const updates = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1 (555) 111-2222',
      };

      const updatedProfile = await updateProfile(updates);

      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.firstName).toBe('Jane');
      expect(updatedProfile.lastName).toBe('Smith');
      expect(updatedProfile.phone).toBe('+1 (555) 111-2222');
    });

    it('should update address fields', async () => {
      const updates = {
        address: {
          street: '456 New Street',
          city: 'Los Angeles',
        },
      };

      const updatedProfile = await updateProfile(updates);

      expect(updatedProfile.address.street).toBe('456 New Street');
      expect(updatedProfile.address.city).toBe('Los Angeles');
      // Original address fields should remain
      expect(updatedProfile.address.state).toBe('NY');
      expect(updatedProfile.address.zipCode).toBe('10001');
    });

    it('should update emergency contact', async () => {
      const updates = {
        emergencyContact: {
          name: 'Bob Smith',
          phone: '+1 (555) 333-4444',
        },
      };

      const updatedProfile = await updateProfile(updates);

      expect(updatedProfile.emergencyContact.name).toBe('Bob Smith');
      expect(updatedProfile.emergencyContact.phone).toBe('+1 (555) 333-4444');
      // Original relationship should remain
      expect(updatedProfile.emergencyContact.relationship).toBe('Spouse');
    });

    it('should update medical information', async () => {
      const updates = {
        medicalInfo: {
          bloodType: 'A+',
          allergies: 'Peanuts',
        },
      };

      const updatedProfile = await updateProfile(updates);

      expect(updatedProfile.medicalInfo.bloodType).toBe('A+');
      expect(updatedProfile.medicalInfo.allergies).toBe('Peanuts');
      // Original fields should remain
      expect(updatedProfile.medicalInfo.conditions).toBe('None');
      expect(updatedProfile.medicalInfo.medications).toBe('None');
    });

    it('should update preferences', async () => {
      const updates = {
        preferences: {
          language: 'de',
          newsletter: false,
        },
      };

      const updatedProfile = await updateProfile(updates);

      expect(updatedProfile.preferences.language).toBe('de');
      expect(updatedProfile.preferences.newsletter).toBe(false);
      // Original notification settings should remain
      expect(updatedProfile.preferences.notifications.email).toBe(true);
    });

    it('should preserve unchanged fields', async () => {
      const updates = {
        firstName: 'UpdatedName',
      };

      const updatedProfile = await updateProfile(updates);

      expect(updatedProfile.firstName).toBe('UpdatedName');
      expect(updatedProfile.lastName).toBe('Doe');
      expect(updatedProfile.email).toBe('johndoe@example.com');
      expect(updatedProfile.id).toBe('user-001');
    });

    it('should simulate API delay for updates', async () => {
      const startTime = Date.now();
      await updateProfile({ firstName: 'Test' });
      const endTime = Date.now();

      const delay = endTime - startTime;
      expect(delay).toBeGreaterThanOrEqual(500);
    });

    it('should handle empty updates object', async () => {
      const updatedProfile = await updateProfile({});

      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.firstName).toBe('John');
      expect(updatedProfile.lastName).toBe('Doe');
    });
  });
});
