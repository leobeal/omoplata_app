import '@testing-library/jest-native/extend-expect';

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    name: 'Omoplata',
    extra: {
      tenant: 'evolve',
      env: 'development',
    },
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  Link: ({ children, href, ...props }) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  Stack: {
    Screen: () => null,
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
  NavigationContainer: ({ children }) => children,
}));

// Mock nativewind
jest.mock('nativewind', () => ({
  colorScheme: {
    set: jest.fn(),
    get: jest.fn(() => 'dark'),
  },
  vars: jest.fn((vars) => vars),
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === '__esModule') return true;
        return (props) => <View testID={`icon-${prop}`} {...props} />;
      },
    }
  );
});

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock DevMenu to prevent TurboModule errors
jest.mock('react-native/Libraries/Utilities/DevMenu', () => ({}), { virtual: true });

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Silence the warning about act()
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
