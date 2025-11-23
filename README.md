# Omoplata - Fitness Club Management App

A comprehensive fitness club/gym management mobile application built with React Native and Expo.

## Overview

Omoplata is a multi-tenant React Native mobile application designed for fitness club members and administrators. It provides member portal features including class booking, check-in capabilities, membership management, and billing integration.

## Tech Stack

- **React Native** (0.81.4) with **Expo** (v54)
- **TypeScript** for type safety
- **Expo Router** for file-based navigation
- **NativeWind** (Tailwind CSS for React Native)
- **Lucide Icons** for iconography
- **Jest** & **React Native Testing Library** for testing

## Features

- ✅ User authentication (login/register)
- ✅ Dark/light mode with multi-tenant theming
- ✅ Form validation and error handling
- ✅ API client with token management
- ✅ Comprehensive test suite (50+ tests)
- 🚧 Member profile management
- 🚧 Membership plans and subscriptions
- 🚧 Class scheduling and booking
- 🚧 QR code check-in system
- 🚧 Payment processing
- 🚧 Push notifications

## Getting Started

```bash
# Use Node.js v20 (or v16+ with structuredClone support)
nvm use 20

# Install dependencies
npm install --legacy-peer-deps

# Start the Expo development server with a clean cache
npx expo start -c

# Or run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo development server |
| `npm run ios` | Run iOS development build |
| `npm run android` | Run Android development build |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check code quality |
| `npm run format` | Auto-format code |

## Tenant Configuration

The app is **single-tenant** from the user's perspective but supports two deployment modes:

### 1. Club-Specific Build
- Tenant hard-coded in `app.config.js` (e.g., `tenant: "evolve"`)
- White-labeled app for a specific gym
- Users skip tenant selection - it's pre-configured
- Perfect for gym-branded apps

### 2. Generic Build with One-Time Selection
- Tenant NOT set in `app.config.js` (or set to `undefined`)
- Users select their gym once on first launch
- Selection is permanent until app reinstall
- Perfect for SaaS model with single App Store listing

**Important:** Once a tenant is selected (either way), the app is locked to that tenant. Users cannot switch gyms within the app.

### Testing Tenant Selection in Development

To see the tenant selection screen:

```bash
# 1. Comment out 'tenant' in app.config.js
# 2. Clear cache and start
npx expo start -c
# 3. If you've previously selected a tenant, clear AsyncStorage via Expo dev menu
```

Configure in `app.config.js`:
```javascript
// Club-specific build
extra: {
  tenant: "evolve",  // Hard-coded tenant
  env: "development"
}

// Generic build
extra: {
  // tenant: undefined,  // Users select at first launch
  env: "development"
}
```

📖 **[Full Tenant Configuration Guide](./docs/TENANT_CONFIGURATION.md)**

## Testing

Comprehensive test suite with 50+ tests covering:
- ✅ Component rendering
- ✅ Form validation
- ✅ User interactions
- ✅ API client functionality
- ✅ Navigation flows

Run tests:
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

## Important: React Version Constraint

⚠️ **CRITICAL**: This project requires **React 19.1.0** (not 19.2.0+)

React Native 0.81.4 includes `react-native-renderer@19.1.0`, which requires an **exact version match** with React. Using React 19.2.0 will cause runtime errors:

```
Error: Incompatible React versions: The "react" and "react-native-renderer"
packages must have the exact same version.
```

**Current locked versions:**
- `react@19.1.0` ✅
- `react-test-renderer@19.1.0` ✅
- `react-native@0.81.4` (includes react-native-renderer@19.1.0) ✅

**When installing new packages, always use:**
```bash
npm install <package> --legacy-peer-deps
```

You may see peer dependency warnings about React 19.2.0 from upstream packages - these can be safely ignored as long as the tests pass.

## Project Structure

```
omoplata_app/
├── app/                    # Application screens (Expo Router)
│   ├── _layout.tsx        # Root layout with theme provider
│   ├── index.tsx          # Home/Dashboard
│   └── screens/
│       ├── login.tsx               # Login screen
│       └── tenant-selection.tsx    # Gym selection (generic builds)
├── api/                   # API client and services
│   ├── config.ts         # API config with dynamic tenant support
│   ├── client.ts         # HTTP client with auth
│   ├── auth.ts           # Authentication service
│   ├── classes.ts        # Classes API
│   ├── checkin.ts        # Check-in API
│   └── invoices.ts       # Invoices API
├── components/           # Reusable UI components
│   ├── Button.tsx
│   ├── Icon.tsx
│   ├── ThemedText.tsx
│   ├── AnimatedView.tsx
│   └── forms/
│       └── Input.tsx
├── contexts/            # React contexts
│   ├── ThemeContext.tsx   # Theme provider
│   ├── ThemeColors.tsx    # Theme colors hook
│   └── TenantContext.tsx  # Tenant state management
├── utils/              # Utility functions
│   ├── color-theme.ts      # Theme definitions
│   └── tenant-storage.ts   # Persistent tenant storage
├── backend_apis/       # Backend API documentation
├── configs/            # Multi-tenant configurations
│   ├── evolve.js      # Evolve brand
│   └── sparta.js      # Sparta brand
├── __tests__/         # Test suite
│   ├── screens/
│   ├── navigation/
│   └── api/
└── docs/              # Documentation
    └── TENANT_CONFIGURATION.md  # Tenant setup guide
```

## API Integration

Backend API documentation is in `backend_apis/`:

- **Authentication**: Login, register, password reset
- **User Management**: Profile, settings
- **Memberships**: Plans, subscriptions, pauses
- **Classes**: Scheduling, booking, waitlists
- **Check-in**: QR code system, history
- **Payments**: Methods, invoices, processing
- **Notifications**: Push notifications, preferences

API client configuration: `api/config.ts`

## Development

### Adding New Screens

1. Create screen in `app/screens/`
2. Add navigation route if needed
3. Write tests in `__tests__/screens/`
4. Run tests: `npm test`

### Theme Customization

Themes defined in `utils/color-theme.ts`:
- Light/dark mode support
- CSS variables for consistency
- Per-tenant color schemes

### Form Components

Use components from `components/forms/`:
- `Input` - Text input with variants (inline, classic, animated)
- Validation support
- Error handling
- Password toggle

## Troubleshooting

### Common Issues

**"structuredClone is not defined"**
- Use Node.js 17+ or the polyfill is applied in `jest.setupBefore.js`

**"Incompatible React versions"**
- Ensure React 19.1.0 is installed (not 19.2.0)
- Run: `npm install react@19.1.0 react-test-renderer@19.1.0 --legacy-peer-deps`

**Tests failing**
- Clear Jest cache: `npx jest --clearCache`
- Reinstall dependencies: `rm -rf node_modules && npm install --legacy-peer-deps`

## Deployment

Build for production with EAS:

```bash
# iOS
npx eas build --platform ios

# Android
npx eas build --platform android
```

Configure EAS in `app.config.js`.

## License

[Add your license information]

