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
| Club-specific | `TENANT=evolve npm start` | White-labeled for a specific gym |
| Generic | `TENANT=MAIN npm start` | Users select gym on first launch |

Available tenants: `evolve`, `sparta`, `MAIN`

📖 See [Tenant Configuration Guide](./docs/TENANT_CONFIGURATION.md) for details.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` / `android` | Run on simulator |
| `npm test` | Run tests |
| `npm run lint:fix` | Fix lint issues |

## Pre-Production TODO

Before deploying to production:

### Cache Durations
- [ ] `api/graduations.ts` - Change cache from `1000ms` back to `CACHE_DURATIONS.MEDIUM`

### Other Checks
- [ ] Remove debug `console.log` statements
- [ ] Verify API endpoints point to production
- [ ] Test push notifications with production credentials
- [ ] Update app version numbers

## Deployment

```bash
# Build with EAS
npx eas build --platform ios
npx eas build --platform android
```

## Important Notes

- Always use `--legacy-peer-deps` when installing packages
- Requires **React 19.1.0** (not 19.2.0+) due to React Native compatibility
- Clear Metro cache with `npx expo start -c` if issues arise
