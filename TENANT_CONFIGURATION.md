# Multi-Tenant Configuration Guide

This guide explains how to configure the Omoplata app for different deployment modes.

## Overview

The Omoplata app supports two deployment modes:

1. **Tenant-Specific Mode** - App is built for a specific gym/tenant (e.g., "Evolve BJJ App")
2. **Generic Mode** - Generic "Omoplata" app where users select their gym on first launch

---

## Mode 1: Tenant-Specific App

Use this mode when building a white-labeled app for a specific gym.

### Configuration

Edit `app.config.js` and set the `tenant` field in `extra`:

```javascript
module.exports = {
  expo: {
    name: "Evolve BJJ",
    slug: "evolve-bjj-app",
    // ... other config
    extra: {
      tenant: "evolve",  // Set to your gym's slug
      env: process.env.APP_ENV || "development",
    },
  },
};
```

### Behavior

- App name and branding are specific to the tenant
- Users don't need to select a gym - it's pre-configured
- API calls automatically use the configured tenant
- More streamlined onboarding experience

### Use Cases

- White-label apps for individual gyms
- Franchise-specific apps
- Apps distributed through private channels

---

## Mode 2: Generic Multi-Tenant App

Use this mode for a single app that supports multiple gyms.

### Configuration

Edit `app.config.js` and **remove** or **leave empty** the `tenant` field:

```javascript
module.exports = {
  expo: {
    name: "Omoplata",
    slug: "omoplata-app",
    // ... other config
    extra: {
      // tenant: undefined,  // Don't set this, or set to undefined
      env: process.env.APP_ENV || "development",
    },
  },
};
```

### Behavior

- Generic "Omoplata" branding
- Users are prompted to enter their gym identifier on first launch
- Tenant selection is saved locally and persists across sessions
- Users can change gyms by clearing app data

### Tenant Selection Flow

1. User opens app for the first time
2. Sees "Welcome to Omoplata" screen
3. Enters gym identifier (e.g., "evolve")
4. Selection is saved to device storage
5. Redirected to login screen
6. All subsequent API calls use selected tenant

### Use Cases

- Public App Store distribution
- Single app supporting multiple gyms
- Gym networks or franchises with shared app

---

## Technical Implementation

### API Configuration

The API automatically adapts based on tenant configuration:

```typescript
// Tenant-specific mode (tenant set in app.config.js)
API URL: https://evolve.omoplata.de/api

// Generic mode (user selected "evolve")
API URL: https://evolve.omoplata.de/api
```

### Environment-Specific URLs

The app uses different base URLs per environment:

| Environment | URL Pattern |
|-------------|-------------|
| Development | `http://{tenant}.sportsmanager.test/api` |
| Staging | `https://{tenant}.omoplata.eu/api` |
| Production | `https://{tenant}.omoplata.de/api` |

### Storage

In generic mode, the selected tenant is stored using AsyncStorage:

```typescript
// Storage key
@omoplata/tenant

// Stored data
{
  "slug": "evolve",
  "name": "Evolve",
  "domain": "evolve.omoplata.de"
}
```

---

## How to Switch Modes

### From Tenant-Specific to Generic

1. Edit `app.config.js`
2. Remove or comment out the `tenant` field in `extra`
3. Update app name/branding to "Omoplata"
4. Rebuild the app

```bash
# Clear build cache
rm -rf .expo node_modules

# Reinstall dependencies
npm install

# Rebuild
npm run ios  # or npm run android
```

### From Generic to Tenant-Specific

1. Edit `app.config.js`
2. Add `tenant: "your-gym-slug"` to `extra`
3. Update app name/branding to gym name
4. Rebuild the app

```bash
# Clear build cache
rm -rf .expo node_modules

# Reinstall dependencies
npm install

# Rebuild
npm run ios  # or npm run android
```

---

## Provider Setup

To enable multi-tenant functionality, wrap your app with `TenantProvider`:

```typescript
// app/_layout.tsx
import { TenantProvider } from '@/contexts/TenantContext';

export default function RootLayout() {
  return (
    <TenantProvider>
      {/* Your app components */}
    </TenantProvider>
  );
}
```

---

## Using Tenant Context

Access tenant information anywhere in your app:

```typescript
import { useTenant } from '@/contexts/TenantContext';

function MyComponent() {
  const { tenant, isLoading, isTenantRequired } = useTenant();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isTenantRequired && !tenant) {
    // Show tenant selection screen
    return <TenantSelectionScreen />;
  }

  // Tenant is available
  console.log(tenant.slug);     // "evolve"
  console.log(tenant.name);     // "Evolve"
  console.log(tenant.domain);   // "evolve.omoplata.de"
}
```

---

## Tenant Selection Screen

The tenant selection screen is located at:
```
app/screens/tenant-selection.tsx
```

### Features

- Input validation (lowercase, alphanumeric, hyphens only)
- Helpful guidance for users
- Automatic domain construction
- Persistent storage
- Error handling

### Accessing the Screen

```typescript
import { router } from 'expo-router';

// Navigate to tenant selection
router.push('/screens/tenant-selection');
```

---

## Testing Different Modes

### Test Tenant-Specific Mode

```javascript
// app.config.js
extra: {
  tenant: "evolve",
  env: "development"
}
```

1. Rebuild app
2. Open app - should go straight to login
3. Check API calls - should use `evolve.sportsmanager.test`

### Test Generic Mode

```javascript
// app.config.js
extra: {
  // tenant: undefined,
  env: "development"
}
```

1. Rebuild app
2. Open app - should show tenant selection
3. Enter "testgym"
4. Check API calls - should use `testgym.sportsmanager.test`

---

## Clearing Tenant Selection (Generic Mode)

Users can reset their tenant selection by:

1. Clearing app data (iOS: Delete and reinstall, Android: Clear app data)
2. Or programmatically:

```typescript
import { useTenant } from '@/contexts/TenantContext';

function SettingsScreen() {
  const { clearTenant } = useTenant();

  const handleChangeTenant = async () => {
    await clearTenant();
    router.replace('/screens/tenant-selection');
  };
}
```

---

## Build Configurations

### Building for App Store (Generic)

```bash
# Ensure tenant is NOT set in app.config.js
eas build --platform ios --profile production
```

### Building for Specific Gym

```bash
# Set tenant in app.config.js
# Then build
eas build --platform ios --profile production
```

You can create separate build profiles for different tenants:

```json
// eas.json
{
  "build": {
    "production-generic": {
      "env": {
        "APP_TENANT": ""
      }
    },
    "production-evolve": {
      "env": {
        "APP_TENANT": "evolve"
      }
    }
  }
}
```

---

## API Integration

All API calls automatically include the correct tenant information:

```typescript
// Headers automatically include
{
  "X-Tenant": "evolve",
  "Content-Type": "application/json"
}

// Base URL automatically set to
https://evolve.omoplata.de/api
```

No code changes needed - the API client handles everything.

---

## Troubleshooting

### Issue: Tenant selection screen shows in tenant-specific mode

**Solution**: Ensure `tenant` is properly set in `app.config.js` and rebuild the app.

### Issue: API calls go to wrong tenant

**Solution**:
1. Check `app.config.js` configuration
2. Clear AsyncStorage: `AsyncStorage.clear()`
3. Rebuild app

### Issue: Cannot change tenant in generic mode

**Solution**: Call `clearTenant()` from TenantContext, then navigate to tenant selection screen.

### Issue: "Gym identifier not found" error

**Solution**: The gym identifier (tenant slug) must match exactly what's configured in the backend.

---

## Best Practices

1. **Validation**: Always validate tenant slugs on the backend
2. **Error Handling**: Handle invalid tenant selections gracefully
3. **User Guidance**: Provide clear instructions for finding gym identifier
4. **Offline Support**: Cache tenant selection for offline use
5. **Analytics**: Track which tenants are using your app

---

## Security Considerations

1. Tenant slugs are not secrets - they're part of the domain
2. Always authenticate users before showing tenant-specific data
3. Backend must validate tenant permissions for each request
4. Don't store sensitive tenant info in AsyncStorage

---

## Support

For questions or issues:
- Check backend API documentation
- Review tenant configuration in app.config.js
- Verify tenant slug matches backend configuration
- Contact your gym administrator for the correct identifier
