# Universal Links Setup

This document explains how to set up universal links for each tenant.

## Overview

| Tenant | Domain | Bundle ID |
|--------|--------|-----------|
| Main | `omoplata.omoplata.de` | `de.omoplata.app` |
| Evolve Grappling | `evolve-grappling.omoplata.de` | `de.omoplata.evolvegrappling` |
| Sparta Aachen | `sparta-aachen.omoplata.de` | `de.omoplata.spartaaachen` |

## Required Information (TODO)

Before deploying, you need:

1. **Apple Team ID**: Get from [Apple Developer Portal](https://developer.apple.com/account) → Membership
2. **Android SHA-256 fingerprints**: Run `eas credentials` to get signing certificate fingerprints

---

## iOS: Apple App Site Association (AASA)

For each subdomain, host this file at:
```
https://{subdomain}/.well-known/apple-app-site-association
```

**Important**: Serve with `Content-Type: application/json` (no file extension).

### Main App (`omoplata.omoplata.de`)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "{TEAM_ID}.de.omoplata.app",
        "paths": ["*"]
      }
    ]
  }
}
```

### Evolve Grappling (`evolve-grappling.omoplata.de`)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "{TEAM_ID}.de.omoplata.evolvegrappling",
        "paths": ["*"]
      }
    ]
  }
}
```

### Sparta Aachen (`sparta-aachen.omoplata.de`)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "{TEAM_ID}.de.omoplata.spartaaachen",
        "paths": ["*"]
      }
    ]
  }
}
```

---

## Android: Digital Asset Links

For each subdomain, host this file at:
```
https://{subdomain}/.well-known/assetlinks.json
```

### Main App (`omoplata.omoplata.de`)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "de.omoplata.app",
      "sha256_cert_fingerprints": [
        "{SHA256_FINGERPRINT}"
      ]
    }
  }
]
```

### Evolve Grappling (`evolve-grappling.omoplata.de`)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "de.omoplata.evolvegrappling",
      "sha256_cert_fingerprints": [
        "{SHA256_FINGERPRINT}"
      ]
    }
  }
]
```

### Sparta Aachen (`sparta-aachen.omoplata.de`)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "de.omoplata.spartaaachen",
      "sha256_cert_fingerprints": [
        "{SHA256_FINGERPRINT}"
      ]
    }
  }
]
```

---

## Getting SHA-256 Fingerprints

Run this command to get your Android signing certificate fingerprints:

```bash
eas credentials -p android
```

You'll need fingerprints for both:
- **Production** keystore (for Play Store builds)
- **Google Play App Signing** certificate (if using Play App Signing)

---

## Verification

### iOS
Use Apple's validator:
```
https://app-site-association.cdn-apple.com/a/v1/{your-domain}
```

### Android
Use Google's validator:
```
https://developers.google.com/digital-asset-links/tools/generator
```

---

## Handling Deep Links in the App

Deep links are handled by Expo Router automatically. Create routes that match your URL paths:

```
app/
├── class/
│   └── [id].tsx      → handles /class/123
├── invite/
│   └── [code].tsx    → handles /invite/abc
└── checkin.tsx       → handles /checkin
```

### Reading URL parameters

```typescript
import { useLocalSearchParams } from 'expo-router';

export default function ClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // id = "123" when opening https://evolve-grappling.omoplata.de/class/123
}
```

---

## DNS Setup

Add A/AAAA or CNAME records for each subdomain:

```
omoplata.omoplata.de        → your-server-ip
evolve-grappling.omoplata.de → your-server-ip
sparta-aachen.omoplata.de   → your-server-ip
```

Ensure HTTPS is configured with valid SSL certificates for each subdomain.
