# Omoplata - Fitness Club Management App

A multi-tenant fitness club mobile application built with React Native and Expo.

## Tech Stack

- **React Native** with **Expo** (SDK 54)
- **TypeScript** / **Expo Router** / **NativeWind**
- **Jest** for testing

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server (TENANT is required)
TENANT=evolve npx expo start -c

# Run on simulator
TENANT=evolve npm run ios
TENANT=evolve npm run android
```

## Tenant Configuration

The app supports two deployment modes:

| Mode | Command | Description |
|------|---------|-------------|
| Club-specific | `TENANT=evolve npx expo start` | White-labeled for a specific gym |
| Generic | `TENANT=main npx expo start` | Users select gym on first launch |

Available tenants: `main`, `evolve`, `sparta`

📖 See [Tenant Configuration Guide](./docs/TENANT_CONFIGURATION.md) for details.

## Scripts

> ⚠️ **Important:** Always specify a tenant when running Expo commands.

| Script | Description |
|--------|-------------|
| `TENANT=main npx expo start` | Start Expo dev server |
| `TENANT=main npx expo start -c` | Start with cache cleared |
| `TENANT=main npm run ios` / `android` | Run on simulator |
| `npm test` | Run tests |
| `npm run lint:fix` | Fix lint issues |
| `npm run build:main:android` | Build Android with EAS |
| `npm run build:main:ios` | Build iOS with EAS |
| `npm run submit:android:internal` | Submit to Play Store internal testing |
| `npm run release:android:internal` | Build + submit to internal testing |

## Pre-Production TODO

Before deploying to production:

### Cache Durations
- [ ] `api/graduations.ts` - Change cache from `1000ms` back to `CACHE_DURATIONS.MEDIUM`

### Other Checks
- [ ] Remove debug `console.log` statements
- [ ] Verify API endpoints point to production
- [ ] Test push notifications with production credentials
- [ ] Update app version numbers


## Setup push notifications on Android
- Create a new firebase project.
- Click on settings, project settings, service accounts, create new service account https://docs.expo.dev/push-notifications/fcm-credentials/


## Submit an app - 
need to set up google service account
https://github.com/expo/fyi/blob/main/creating-google-service-account.md

## Deployment

### Build Commands

```bash
npm run build:main:android    # Build Android
npm run build:main:ios        # Build iOS
npm run build:main:all        # Build both platforms
```

### Google Play Testing Tracks

| Track | Who Can Access | Approval Time | Use Case |
|-------|---------------|---------------|----------|
| **Internal** | Up to 100 invited testers | Instant | QA team, developers |
| **Closed (alpha)** | Invite-only via email lists | Minutes | Beta testers, early adopters |
| **Open (beta)** | Anyone via opt-in link | Minutes | Public beta, wider feedback |
| **Production** | Everyone on Play Store | Hours to days (review) | Live release |

### Release Flow

```
Internal → Closed → Open → Production
   ↓         ↓        ↓         ↓
  QA      Beta     Public    Live!
 team    testers    beta
```

### Submit Commands

| Command | Description |
|---------|-------------|
| `TENANT=main npm run submit:android:internal` | Submit to internal testing |
| `TENANT=main npm run submit:android:alpha` | Submit to closed testing |
| `TENANT=main npm run submit:android:beta` | Submit to open testing |
| `TENANT=main npm run submit:android:production` | Submit to production |
| `TENANT=main npm run submit:ios` | Submit to App Store Connect |

### Combined Build + Submit

```bash
TENANT=main npm run release:android:internal     # Build & submit to internal testing
TENANT=main npm run release:android:production   # Build & submit to production
```

### Before Production Release

Complete these in Google Play Console:
- [ ] App title & description
- [ ] Screenshots (phone + tablet)
- [ ] Feature graphic (1024x500)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Target audience & content
- [ ] App category

### Version Management

Version codes auto-increment on each EAS build (configured in `eas.json`).

## Important Notes

- **Always specify TENANT** when running Expo commands (e.g., `TENANT=main npx expo start`)
- Always use `--legacy-peer-deps` when installing packages
- Requires **React 19.1.0** (not 19.2.0+) due to React Native compatibility
- Clear Metro cache with `TENANT=main npx expo start -c` if issues arise
