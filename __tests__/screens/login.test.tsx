import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';

import LoginScreen from '../../app/screens/login';

// Mock the contexts
jest.mock('@/contexts/ThemeColors', () => ({
  useThemeColors: () => ({
    text: '#ffffff',
    bg: '#141414',
    placeholder: 'rgba(255,255,255,0.4)',
    border: '#404040',
    isDark: true,
  }),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: jest.fn(),
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn().mockResolvedValue({ success: true }),
    isLoading: false,
    isAuthenticated: false,
  }),
}));

jest.mock('@/contexts/TenantContext', () => ({
  useTenant: () => ({
    isTenantRequired: true,
    tenant: null,
  }),
}));

// Mock the API
jest.mock('@/api', () => ({
  authApi: {
    login: jest.fn(),
  },
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders the login form correctly', () => {
      const { getByText, getAllByText } = render(<LoginScreen />);

      const loginElements = getAllByText('Login');
      expect(loginElements.length).toBeGreaterThanOrEqual(1); // At least button
      expect(getByText('Sign in to your account')).toBeTruthy();
      expect(getByText('Forgot Password?')).toBeTruthy();
    });

    it('renders email and password input fields', () => {
      const { getAllByText } = render(<LoginScreen />);

      // Check for input labels (they appear multiple times due to label + placeholder)
      const emailLabels = getAllByText('Email');
      const passwordLabels = getAllByText('Password');

      expect(emailLabels.length).toBeGreaterThan(0);
      expect(passwordLabels.length).toBeGreaterThan(0);
    });

    it('renders the login button', () => {
      const { getAllByText } = render(<LoginScreen />);

      const loginElements = getAllByText('Login');
      expect(loginElements[1]).toBeTruthy(); // The button is the second element
    });
  });

  describe('Form Validation', () => {
    it('shows error when email is empty on submit', async () => {
      const { getAllByText, findByText } = render(<LoginScreen />);

      const loginButton = getAllByText('Login')[1]; // Get the button
      fireEvent.press(loginButton);

      const emailError = await findByText('Email is required');
      expect(emailError).toBeTruthy();
    });

    it('shows error when email format is invalid', async () => {
      const { getAllByText, getByPlaceholderText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'invalid-email');

      const loginButton = getAllByText('Login')[1]; // Get the button
      fireEvent.press(loginButton);

      const emailError = await findByText('Please enter a valid email');
      expect(emailError).toBeTruthy();
    });

    it('shows error when password is empty', async () => {
      const { getAllByText, getByPlaceholderText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');

      const loginButton = getAllByText('Login')[1]; // Get the button
      fireEvent.press(loginButton);

      const passwordError = await findByText('Password is required');
      expect(passwordError).toBeTruthy();
    });

    it('shows error when password is too short', async () => {
      const { getAllByText, getByPlaceholderText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '12345');

      const loginButton = getAllByText('Login')[1]; // Get the button
      fireEvent.press(loginButton);

      const passwordError = await findByText('Password must be at least 6 characters');
      expect(passwordError).toBeTruthy();
    });

    it('clears email error when valid email is entered', async () => {
      const { getAllByText, getByPlaceholderText, findByText, queryByText } = render(
        <LoginScreen />
      );

      const emailInput = getByPlaceholderText('Email');
      const loginButton = getAllByText('Login')[1]; // Get the button

      // Trigger error
      fireEvent.press(loginButton);
      await findByText('Email is required');

      // Fix the error
      fireEvent.changeText(emailInput, 'test@example.com');

      // Error should be cleared
      expect(queryByText('Email is required')).toBeNull();
      expect(queryByText('Please enter a valid email')).toBeNull();
    });
  });

  describe('Form Submission', () => {
    it('calls login when form is valid', async () => {
      const mockLogin = jest.fn().mockResolvedValue({ success: true });

      // Override the mock for this test
      jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
        login: mockLogin,
        isLoading: false,
        isAuthenticated: false,
      });

      const { getAllByText, getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getAllByText('Login')[1]; // Get the button

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // Wait for the login function to be called
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('does not submit when email is invalid', () => {
      const { getAllByText, getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getAllByText('Login')[1]; // Get the button

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('does not submit when password is too short', () => {
      const { getAllByText, getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getAllByText('Login')[1]; // Get the button

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(loginButton);

      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('navigates to tenant selection when back button is pressed', () => {
      const { getByTestId } = render(<LoginScreen />);

      // Find the back icon and press it
      const backButton = getByTestId('icon-ArrowLeft');
      fireEvent.press(backButton);

      expect(router.push).toHaveBeenCalledWith('/screens/tenant-selection');
    });
  });

  describe('Input Interactions', () => {
    it('updates email input value', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');

      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('updates password input value', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const passwordInput = getByPlaceholderText('Password');
      fireEvent.changeText(passwordInput, 'secretpassword');

      expect(passwordInput.props.value).toBe('secretpassword');
    });
  });
});
