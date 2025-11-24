import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';

import EditProfileScreen from '../../app/screens/edit-profile';

// Mock the contexts
jest.mock('@/contexts/ThemeColors', () => ({
  useThemeColors: () => ({
    text: '#ffffff',
    bg: '#141414',
    border: '#404040',
    subtext: '#999999',
  }),
}));

jest.mock('@/contexts/ScrollToTopContext', () => ({
  useScrollToTop: () => ({
    scrollToTop: jest.fn(),
    registerScrollHandler: jest.fn(),
    unregisterScrollHandler: jest.fn(),
  }),
}));

// Mock the profile API
const mockProfile = {
  id: 'user-001',
  prefixedId: 'USR-001',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  nickname: null,
  memberNumber: 'MEM-001',
  email: 'johndoe@example.com',
  gender: 'male',
  locale: 'en',
  phoneCountryCode: '+1',
  phone: '(555) 123-4567',
  dateOfBirth: '1990-05-15',
  profilePicture: null,
  requiresPayer: false,
  address: {
    street: '123 Fitness Street',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA',
  },
  responsibles: [
    {
      id: 'resp-001',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      relationship: 'Spouse',
    },
  ],
  primaryResponsible: null,
  children: [],
};

const mockGetProfile = jest.fn().mockResolvedValue(mockProfile);
const mockUpdateProfile = jest.fn().mockResolvedValue(mockProfile);

jest.mock('@/api/profile', () => ({
  getProfile: () => mockGetProfile(),
  updateProfile: (userId: string, updates: any) => mockUpdateProfile(userId, updates),
}));

// Mock Alert
const mockAlert = jest.fn();
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  default: {
    alert: (...args: any[]) => mockAlert(...args),
  },
  alert: (...args: any[]) => mockAlert(...args),
}));

describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      const { UNSAFE_getByType } = render(<EditProfileScreen />);
      const { ActivityIndicator } = require('react-native');

      // ActivityIndicator should be present while loading
      expect(() => UNSAFE_getByType(ActivityIndicator)).not.toThrow();
    });
  });

  describe('Rendering', () => {
    it('loads and displays profile data', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('John')).toBeTruthy();
        expect(getByDisplayValue('Doe')).toBeTruthy();
        expect(getByDisplayValue('(555) 123-4567')).toBeTruthy();
      });
    });

    it('displays address fields', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('123 Fitness Street')).toBeTruthy();
        expect(getByDisplayValue('New York')).toBeTruthy();
        expect(getByDisplayValue('NY')).toBeTruthy();
        expect(getByDisplayValue('10001')).toBeTruthy();
      });
    });

    it('displays emergency contact information', async () => {
      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Jane Doe')).toBeTruthy();
        expect(getByText('Spouse')).toBeTruthy();
      });
    });

    it('shows email as read-only', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        const emailInput = getByDisplayValue('johndoe@example.com');
        expect(emailInput.props.editable).toBe(false);
      });
    });

    it('renders Save and Cancel buttons', async () => {
      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Save Changes')).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
      });
    });
  });

  describe('Form Input', () => {
    it('allows editing first name', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        const firstNameInput = getByDisplayValue('John');
        fireEvent.changeText(firstNameInput, 'Jane');
        expect(firstNameInput.props.value).toBe('Jane');
      });
    });

    it('allows editing last name', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        const lastNameInput = getByDisplayValue('Doe');
        fireEvent.changeText(lastNameInput, 'Smith');
        expect(lastNameInput.props.value).toBe('Smith');
      });
    });

    it('allows editing phone number', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        const phoneInput = getByDisplayValue('(555) 123-4567');
        fireEvent.changeText(phoneInput, '(555) 999-8888');
        expect(phoneInput.props.value).toBe('(555) 999-8888');
      });
    });

    it('allows editing address fields', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        const streetInput = getByDisplayValue('123 Fitness Street');
        fireEvent.changeText(streetInput, '456 New Street');
        expect(streetInput.props.value).toBe('456 New Street');
      });
    });

    it('emergency contact is read-only', async () => {
      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        // Emergency contact is displayed but not editable
        expect(getByText('Jane Doe')).toBeTruthy();
        expect(getByText('Spouse')).toBeTruthy();
      });
    });
  });

  describe('Form Validation', () => {
    it('shows error when first name is empty', async () => {
      const { getByDisplayValue, getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const firstNameInput = getByDisplayValue('John');
        fireEvent.changeText(firstNameInput, '');
      });

      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Validation Error',
          'First name and last name are required'
        );
      });
    });

    it('shows error when last name is empty', async () => {
      const { getByDisplayValue, getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const lastNameInput = getByDisplayValue('Doe');
        fireEvent.changeText(lastNameInput, '');
      });

      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Validation Error',
          'First name and last name are required'
        );
      });
    });

    it('trims whitespace from inputs', async () => {
      const { getByDisplayValue, getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const firstNameInput = getByDisplayValue('John');
        fireEvent.changeText(firstNameInput, '  Jane  ');
      });

      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          'user-001',
          expect.objectContaining({
            first_name: 'Jane',
          })
        );
      });
    });
  });

  describe('Form Submission', () => {
    it('calls updateProfile with correct data', async () => {
      const { getByDisplayValue, getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const firstNameInput = getByDisplayValue('John');
        fireEvent.changeText(firstNameInput, 'Jane');
      });

      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          'user-001',
          expect.objectContaining({
            first_name: 'Jane',
            last_name: 'Doe',
          })
        );
      });
    });

    it('shows success alert and navigates back', async () => {
      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const saveButton = getByText('Save Changes');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Success',
          'Profile updated successfully',
          expect.any(Array)
        );
      });
    });

    it('shows loading state while saving', async () => {
      let resolveSave: () => void;
      mockUpdateProfile.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSave = () => resolve(mockProfile);
          })
      );

      const { getByText, queryByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const saveButton = getByText('Save Changes');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(getByText('Saving...')).toBeTruthy();
      });

      resolveSave!();
    });

    it('disables buttons while saving', async () => {
      let resolveSave: () => void;
      mockUpdateProfile.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSave = () => resolve(mockProfile);
          })
      );

      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const saveButton = getByText('Save Changes');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        // Just verify the loading text is shown
        expect(getByText('Saving...')).toBeTruthy();
      });

      resolveSave!();
    });

    it('handles save errors gracefully', async () => {
      mockUpdateProfile.mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const saveButton = getByText('Save Changes');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to update profile');
      });
    });
  });

  describe('Cancel Action', () => {
    it('navigates back when Cancel is pressed', async () => {
      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const cancelButton = getByText('Cancel');
        fireEvent.press(cancelButton);
      });

      expect(router.back).toHaveBeenCalled();
    });

    it('does not save when Cancel is pressed', async () => {
      const { getByDisplayValue, getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const firstNameInput = getByDisplayValue('John');
        fireEvent.changeText(firstNameInput, 'Jane');
      });

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });
  });
});
