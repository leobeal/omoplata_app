# Tenant Configuration Guide

This guide explains how to configure the Omoplata app for different deployment modes.

## Overview

The Omoplata app is **always single-tenant from the user's perspective**. It supports two deployment modes:

1. **Club-Specific Build** - App is built for a specific gym/tenant (e.g., "Evolve BJJ App")
2. **Generic Build with Tenant Selection** - Generic "Omoplata" app where users select their gym **once** during first launch

**Important:** Once a tenant is selected (either pre-configured or chosen by the user), the app is locked to that tenant. Users cannot switch between different gyms within the app. All features and data belong to the selected tenant.

---

## Quick Start: Testing Tenant Selection

Want to see the tenant selection screen in development?

1. **Set TENANT environment variable to MAIN**:
   ```bash
   TENANT=MAIN npm start
   ```

2. **Clear cached tenant** (if you've run a tenant-specific build before):
   ```bash
   # In Expo dev menu: Shake device → Debug → Clear AsyncStorage
   # Or reinstall the app
   ```

3. **Open the app** - You should now see the tenant selection screen!

📖 For detailed instructions, see [Testing Different Modes](#testing-different-modes)

---

## Mode 1: Club-Specific Build

Use this mode when building a white-labeled app for a specific gym.

### Configuration

Set the `TENANT` environment variable to your gym's slug:

```bash
# For Evolve gym
TENANT=evolve npm start

# For production builds
TENANT=evolve eas build --platform ios
```

The `app.config.js` automatically loads the corresponding config file from `configs/{tenant}.js` (e.g., `configs/evolve-grappling.js`).

### Behavior

- Tenant is configured via `TENANT` environment variable
- App name and branding are specific to the gym (from config file)
- Users skip tenant selection - it's pre-configured
- API calls automatically use the configured tenant
- More streamlined onboarding experience
- Users never see tenant selection

### Use Cases

- White-label apps for individual gyms
- Franchise-specific apps
- Apps distributed through private channels
- Gyms with their own App Store presence

---

## Mode 2: Generic Build with One-Time Tenant Selection

Use this mode for a single app binary that can be used by multiple gyms.

### Configuration

Set the `TENANT` environment variable to `MAIN`:

```bash
# For development
TENANT=MAIN npm start

# For production builds
TENANT=MAIN eas build --platform ios
```

The `app.config.js` automatically loads the generic config file `configs/main.js` which uses generic "Omoplata" branding.

### Behavior

- Generic "Omoplata" branding
- On first launch, users enter their gym identifier
- Tenant selection is saved permanently to device storage
- All subsequent screens and features belong to that tenant
- Users cannot switch gyms within the app
- To change gyms, users must reinstall the app or clear app data

### First Launch Flow

1. User downloads and opens app
2. Sees "Welcome to Omoplata" screen
3. Enters gym identifier (e.g., "evolve")
4. Selection is permanently saved to device
5. Redirected to login screen
6. All features now belong to "Evolve" gym
7. User cannot access other gyms without reinstalling

### Use Cases

- Public App Store distribution
- Single app supporting multiple independent gyms
- SaaS model where each gym gets the same app
- Reducing App Store maintenance (one app vs. many)

---

## Key Differences

| Aspect | Club-Specific | Generic with Selection |
|--------|---------------|------------------------|
| **Tenant Configuration** | Hard-coded in build | Selected at first launch |
| **App Branding** | Gym-specific | Generic "Omoplata" |
| **User Experience** | Skip tenant selection | One-time gym selection |
| **Switching Gyms** | Not applicable | Requires app reinstall |
| **Distribution** | One app per gym | One app for all gyms |
| **App Store Presence** | Separate listing per gym | Single listing |

---

## Important: This is NOT a Multi-Tenant App

**Common Misconception:** Users can switch between different gyms.

**Reality:** Each app installation is locked to a single tenant (gym). The "generic build" mode just defers the tenant selection from build-time to first-launch, but once selected, it's permanent.

### Why Single-Tenant?

1. **Security**: All data belongs to one gym - no cross-tenant data access
2. **Simplicity**: No complex tenant switching UI or logic
3. **Performance**: No need to clear/reload data when switching
4. **User Experience**: Members belong to one gym, not multiple

### Changing Gyms

If a user needs to switch to a different gym (rare scenario):

**iOS:**
1. Delete the app
2. Reinstall from App Store
3. Select new gym on first launch

**Android:**
1. Go to Settings → Apps → Omoplata
2. Tap "Clear Data" or "Clear Storage"
3. Reopen app
4. Select new gym on first launch

---

## Technical Implementation

### API Configuration

The API is locked to a single tenant per installation:

```typescript
// Club-specific build (tenant in app.config.js)
API URL: https://evolve.omoplata.de/api
Headers: { "X-Tenant": "evolve" }

// Generic build (user selected "evolve")
API URL: https://evolve.omoplata.de/api
Headers: { "X-Tenant": "evolve" }

// Result is identical - both are locked to one tenant
```

### Environment-Specific URLs

The app uses different base URLs per environment:

| Environment | URL Pattern |
|-------------|-------------|
| Development | `http://{tenant}.sportsmanager.test/api` |
| Staging | `https://{tenant}.omoplata.eu/api` |
| Production | `https://{tenant}.omoplata.de/api` |

### Storage

In generic build mode, the selected tenant is stored permanently:

```typescript
// Storage key
@omoplata/tenant

// Stored data (permanent)
{
  "slug": "evolve",
  "name": "Evolve",
  "domain": "evolve.omoplata.de"
}

// This data persists across app sessions
// Only cleared by app reinstall or clearing app data
```

---

## How to Switch Modes

Switching between modes is as simple as changing the `TENANT` environment variable!

### From Club-Specific to Generic

Simply change the `TENANT` variable from a gym slug to `MAIN`:

```bash
# Was running club-specific:
TENANT=evolve npm start

# Now run generic:
TENANT=MAIN npm start
```

**Note:** You may need to clear AsyncStorage to remove any cached tenant selection.

### From Generic to Club-Specific

Change `TENANT` from `MAIN` to your gym slug:

```bash
# Was running generic:
TENANT=MAIN npm start

# Now run club-specific:
TENANT=evolve npm start
```

No code changes, no rebuilds needed during development! Just change the environment variable.

---

## Provider Setup

Wrap your app with `TenantProvider` in your root layout:

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

## Routing Logic

Implement tenant selection gate at the app entry point:

```typescript
// In your root layout or index file
import { useTenant } from '@/contexts/TenantContext';
import { router } from 'expo-router';
import { useEffect } from 'react';

function AppGate() {
  const { tenant, isLoading, isTenantRequired } = useTenant();

  useEffect(() => {
    if (!isLoading) {
      if (isTenantRequired && !tenant) {
        // Generic build, no tenant selected yet
        router.replace('/screens/tenant-selection');
      } else if (tenant) {
        // Tenant is set (either pre-configured or selected)
        // User can proceed to login or main app
        // Note: You'll need to check auth status here
      }
    }
  }, [isLoading, tenant, isTenantRequired]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <YourAppContent />;
}
```

---

## Using Tenant Context

Access tenant information anywhere in your app:

```typescript
import { useTenant } from '@/contexts/TenantContext';

function MyComponent() {
  const { tenant, isLoading, isTenantRequired } = useTenant();

  // tenant is null only during initial loading or before selection
  // Once set, it's permanent for this app installation

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
- Permanent storage
- Error handling

### When It's Shown

**Club-Specific Build:** Never shown - tenant is pre-configured

**Generic Build:**
- Shown once on first app launch
- User enters gym identifier
- Selection is permanently saved
- Never shown again (unless app is reinstalled)

---

## Testing Different Modes

### Test Club-Specific Mode

Set `TENANT` to a specific gym slug:

```bash
# Start development server
TENANT=evolve npm start

# Or run on device
TENANT=evolve npm run ios
TENANT=evolve npm run android
```

**Expected behavior:**
1. Open app - should skip tenant selection
2. Should go straight to login
3. Check console - API calls should use `evolve.sportsmanager.test`
4. Tenant selection screen should never appear

### Test Generic Mode

Set `TENANT` to `MAIN`:

```bash
# Start development server
TENANT=MAIN npm start

# Or run on device
TENANT=MAIN npm run ios
TENANT=MAIN npm run android
```

#### Clear Previous Tenant Selection (if any)

If you've previously selected a tenant, you need to clear it before testing:

**Option A: Clear AsyncStorage via Expo Dev Menu**
1. Open app in Expo
2. Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
3. Tap "Debug" → Clear AsyncStorage
4. Reload app

**Option B: Programmatically clear (for testing)**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Run once to clear tenant
await AsyncStorage.removeItem('@omoplata/tenant');
```

**Option C: Reinstall the app**
```bash
# Delete and reinstall
TENANT=MAIN npm run ios  # or npm run android
```

#### Expected Behavior

1. Open app - should show tenant selection screen
2. Enter "testgym" (or any gym identifier)
3. Should redirect to login
4. Check console - API calls should use `testgym.sportsmanager.test`
5. Close and reopen app - should NOT show tenant selection again
6. Should remember "testgym" permanently

#### Troubleshooting

**Issue: Tenant selection screen doesn't show**

Possible causes:
1. `TENANT` is not set to `MAIN` → Check environment variable
2. Previous tenant is cached → Clear AsyncStorage
3. Need to restart → Stop and run `TENANT=MAIN npm start` again

**Issue: Screen shows but API still uses old tenant**

Solution: Clear AsyncStorage and restart app

**Issue: Error "TENANT environment variable is required"**

Solution: Always set `TENANT` when starting the app:
```bash
TENANT=MAIN npm start     # Generic build
TENANT=evolve npm start   # Club-specific build
```

---

## "Resetting" Tenant Selection

### For Development/Testing

```typescript
import { useTenant } from '@/contexts/TenantContext';

// This should only be used for testing/development
const { clearTenant } = useTenant();

const resetTenant = async () => {
  await clearTenant();
  router.replace('/screens/tenant-selection');
};
```

### For End Users

**iOS:**
```
Settings → General → iPhone Storage → Omoplata → Delete App
Then reinstall from App Store
```

**Android:**
```
Settings → Apps → Omoplata → Storage → Clear Data
Then reopen app
```

**Important:** This is intentionally not exposed in the app UI. Users should not need to change gyms. If they do, it's a support case, not a regular feature.

---

## Build Configurations

### Building for App Store (Generic)

```bash
# Generic build with tenant selection
TENANT=MAIN eas build --platform ios --profile production
```

Result: One app that works for all gyms. Users select their gym on first launch.

### Building for Specific Gym

```bash
# Gym-specific build (Evolve example)
TENANT=evolve eas build --platform ios --profile production

# Another gym
TENANT=sparta eas build --platform ios --profile production
```

Result: Gym-branded app with tenant pre-configured. No tenant selection screen.

### Managing Multiple Club Builds

Create separate build profiles for different gyms in `eas.json`:

```json
{
  "build": {
    "production-generic": {
      "env": {
        "TENANT": "MAIN"
      }
    },
    "production-evolve": {
      "env": {
        "TENANT": "evolve"
      }
    },
    "production-sparta": {
      "env": {
        "TENANT": "sparta"
      }
    }
  }
}
```

Then build using the profile:

```bash
# Generic build
eas build --platform ios --profile production-generic

# Evolve build
eas build --platform ios --profile production-evolve

# Sparta build
eas build --platform ios --profile production-sparta
```

---

## API Integration

All API calls automatically include the correct tenant information:

```typescript
// Headers automatically include
{
  "X-Tenant": "evolve",  // Never changes after selection
  "Content-Type": "application/json"
}

// Base URL automatically set to
https://evolve.omoplata.de/api  // Always this tenant
```

No code changes needed - the API client handles everything.

---

## Troubleshooting

### Issue: Tenant selection screen shows in club-specific build

**Solution**: Ensure `tenant` is properly set in `app.config.js` and rebuild the app completely.

### Issue: API calls go to wrong tenant

**Solution**:
1. Check `app.config.js` configuration
2. For generic build, clear app data and reselect tenant
3. Rebuild app from scratch

### Issue: Cannot change tenant after selection

**This is not a bug - this is intentional behavior.**

**Solution**: This is by design. To use a different gym:
- iOS: Delete and reinstall the app
- Android: Clear app data

### Issue: "Gym identifier not found" error

**Solution**: The gym identifier (tenant slug) must match exactly what's configured in the backend. Contact the gym for the correct identifier.

---

## Best Practices

### 1. **Clear Communication**
- In generic build, clearly explain that gym selection is permanent
- Provide support contact if users need help finding their gym identifier
- Make it clear this is not a "gym finder" or "multi-gym" app

### 2. **Validation**
- Always validate tenant slugs on the backend
- Return clear error messages for invalid gym identifiers
- Consider providing a tenant lookup/search API

### 3. **User Guidance**
- Provide examples of gym identifiers
- Link to help documentation
- Offer support contact for uncertain users

### 4. **Distribution Strategy**
- **Club-Specific**: Better for larger gyms with strong brand identity
- **Generic**: Better for SaaS model or gym networks

### 5. **Analytics**
- Track which tenants are most active
- Monitor tenant selection errors
- Track user retention per tenant

---

## Security Considerations

1. **Tenant Isolation**: Each installation is locked to one tenant - no cross-tenant data access
2. **Backend Validation**: Always validate tenant on the backend, never trust client
3. **Authentication**: Users authenticate within their tenant's domain
4. **Data Separation**: User data is completely separated by tenant
5. **No Switching**: Inability to switch tenants prevents accidental cross-tenant access

---

## Decision Matrix: Which Mode to Choose?

### Choose Club-Specific Build If:

✅ Building for a single large gym
✅ Gym has strong brand identity
✅ Gym wants their own App Store presence
✅ Gym wants custom branding and colors
✅ You're building multiple separate apps

### Choose Generic Build If:

✅ Supporting multiple independent gyms
✅ SaaS/platform business model
✅ Want single app for all gyms
✅ Easier App Store maintenance (one listing)
✅ Lower development overhead
✅ Gyms are okay with generic "Omoplata" branding

---

## Support

For questions or issues:
- Check backend API documentation
- Verify tenant configuration in app.config.js
- Confirm tenant slug matches backend configuration
- Contact your gym administrator for the correct identifier
- For development issues, check the console logs for tenant-related errors
