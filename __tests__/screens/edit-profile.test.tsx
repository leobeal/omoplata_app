import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import EditProfileScreen from '../../app/screens/edit-profile';
import { router } from 'expo-router';

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
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@example.com',
  phone: '+1 (555) 123-4567',
  dateOfBirth: '1990-05-15',
  gender: 'male',
  address: {
    street: '123 Fitness Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
  },
  emergencyContact: {
    name: 'Jane Doe',
    relationship: 'Spouse',
    phone: '+1 (555) 987-6543',
  },
  medicalInfo: {
    bloodType: 'O+',
    allergies: 'None',
    conditions: 'None',
    medications: 'None',
  },
  preferences: {
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    newsletter: true,
  },
  avatar: null,
};

const mockGetProfile = jest.fn().mockResolvedValue(mockProfile);
const mockUpdateProfile = jest.fn().mockResolvedValue(mockProfile);

jest.mock('@/api/profile', () => ({
  getProfile: () => mockGetProfile(),
  updateProfile: (updates: any) => mockUpdateProfile(updates),
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      const { getByTestId, getAllByTestId } = render(<EditProfileScreen />);

      // ActivityIndicator should be present
      const indicators = getAllByTestId(/activity-indicator/i);
      expect(indicators.length).toBeGreaterThan(0);
    });
  });

  describe('Rendering', () => {
    it('loads and displays profile data', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('John')).toBeTruthy();
        expect(getByDisplayValue('Doe')).toBeTruthy();
        expect(getByDisplayValue('+1 (555) 123-4567')).toBeTruthy();
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

    it('displays emergency contact fields', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('Jane Doe')).toBeTruthy();
        expect(getByDisplayValue('Spouse')).toBeTruthy();
        expect(getByDisplayValue('+1 (555) 987-6543')).toBeTruthy();
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
        const phoneInput = getByDisplayValue('+1 (555) 123-4567');
        fireEvent.changeText(phoneInput, '+1 (555) 999-8888');
        expect(phoneInput.props.value).toBe('+1 (555) 999-8888');
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

    it('allows editing emergency contact', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        const emergencyNameInput = getByDisplayValue('Jane Doe');
        fireEvent.changeText(emergencyNameInput, 'Bob Smith');
        expect(emergencyNameInput.props.value).toBe('Bob Smith');
      });
    });
  });

  describe('Form Validation', () => {
    it('shows error when first name is empty', async () => {
      const Alert = require('react-native/Libraries/Alert/Alert');
      const { getByDisplayValue, getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const firstNameInput = getByDisplayValue('John');
        fireEvent.changeText(firstNameInput, '');
      });

      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          'First name and last name are required'
        );
      });
    });

    it('shows error when last name is empty', async () => {
      const Alert = require('react-native/Libraries/Alert/Alert');
      const { getByDisplayValue, getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const lastNameInput = getByDisplayValue('Doe');
        fireEvent.changeText(lastNameInput, '');
      });

      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
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
          expect.objectContaining({
            firstName: 'Jane',
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
          expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Doe',
            phone: '+1 (555) 123-4567',
          })
        );
      });
    });

    it('shows success alert and navigates back', async () => {
      const Alert = require('react-native/Libraries/Alert/Alert');
      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const saveButton = getByText('Save Changes');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Profile updated successfully',
          expect.any(Array)
        );
      });
    });

    it('shows loading state while saving', async () => {
      let resolveSave: () => void;
      mockUpdateProfile.mockImplementationOnce(
        () => new Promise((resolve) => { resolveSave = () => resolve(mockProfile); })
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
        () => new Promise((resolve) => { resolveSave = () => resolve(mockProfile); })
      );

      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const saveButton = getByText('Save Changes');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        const savingButton = getByText('Saving...');
        const cancelButton = getByText('Cancel');
        expect(savingButton.parent?.props.disabled).toBe(true);
        expect(cancelButton.parent?.props.disabled).toBe(true);
      });

      resolveSave!();
    });

    it('handles save errors gracefully', async () => {
      const Alert = require('react-native/Libraries/Alert/Alert');
      mockUpdateProfile.mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        const saveButton = getByText('Save Changes');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update profile');
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
