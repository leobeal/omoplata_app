# Store App Creation Scripts

Scripts to automate app creation and setup in Google Play Store and Apple App Store.

## Prerequisites

### Play Store
- Google Developer account with App Manager access
- Developer ID (default: `5739281656511061086`)

### App Store
- Apple Developer account with App Manager role or higher
- **Bundle ID must be registered first** in the Apple Developer Portal

## Registering a Bundle ID (App Store)

Before running the App Store script, you must register the Bundle ID:

1. Go to [Apple Developer Portal - Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Click the **+** button to register a new identifier
3. Select **App IDs** and click Continue
4. Select **App** (not App Clip) and click Continue
5. Fill in:
   - **Description**: e.g., "Iron Oak Ostalb"
   - **Bundle ID**: Select "Explicit" and enter: `com.omoplata.ironoak`
6. Scroll down and enable any capabilities needed (Push Notifications, etc.)
7. Click **Continue**, then **Register**

After registration, the Bundle ID will appear in App Store Connect's dropdown.

## Tenant Configuration

Both scripts use the same JSON configuration files located at:
```
scripts/play-store/config/tenants/{tenant}.json
```

### JSON Structure

```json
{
  "packageName": "com.omoplata.example",
  "bundleId": "com.omoplata.example",
  "defaultLanguage": "de-DE",

  "listing": {
    "title": "App Name",
    "shortDescription": "Short description (80 chars for Play, 170 for App Store)",
    "fullDescription": "Full description...",
    "tags": ["fitness", "gym"]
  },

  "localizations": {
    "en-US": {
      "title": "App Name",
      "shortDescription": "...",
      "fullDescription": "...",
      "subtitle": "App Store subtitle (30 chars)",
      "keywords": "comma,separated,keywords (100 chars)"
    }
  },

  "contact": {
    "email": "support@example.com",
    "website": "https://example.com",
    "privacyPolicyUrl": "https://example.com/privacy",
    "supportUrl": "https://example.com/support",
    "marketingUrl": "https://example.com"
  },

  "appAccess": {
    "restricted": true,
    "testCredentials": {
      "username": "test@example.com",
      "password": "testpassword"
    }
  },

  "stores": {
    "playStore": {
      "appCategory": "Health & fitness",
      "targetAudience": "18 and over",
      "progress": { "appId": null, "lastCompletedStep": 0 }
    },
    "appStore": {
      "primaryCategory": "HEALTH_FITNESS",
      "secondaryCategory": "LIFESTYLE",
      "sku": "example",
      "progress": { "appId": null, "lastCompletedStep": 0 }
    }
  }
}
```

## Usage

### Play Store
```bash
TENANT=iron-oak node scripts/create-play-store-app.js
```

### App Store
```bash
TENANT=iron-oak node scripts/create-app-store-app.js
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TENANT` | Tenant slug (required) | `evolve` |
| `DEVELOPER_ID` | Google Play Developer ID | `5739281656511061086` |
| `TEAM_ID` | Apple Developer Team ID | - |
| `RESUME_APP_ID` | Resume from existing app ID | From JSON |
| `START_STEP` | Start from specific step | From JSON |

## Script Steps

### Play Store (14 steps)
1. Create new app
2. Set privacy policy
3. Configure app access
4. Configure ads
5. Complete content rating
6. Set target audience
7. Configure data safety
8. Government apps declaration
9. Financial features declaration
10. Health apps declaration
11. Advertising ID declaration
12. Set app category and contacts
13. Set up store listing
14. Upload app icon

### App Store (8 steps)
1. Create new app
2. Set app information (category, privacy policy)
3. Set age rating
4. Configure App Privacy
5. Set up store listing
6. Set subtitle
7. Set up App Review information
8. Add localizations

## Progress Tracking

Both scripts automatically save progress to the tenant JSON file. If a script fails, simply run it again - it will resume from the last completed step.

To force restart from a specific step:
```bash
START_STEP=3 TENANT=iron-oak node scripts/create-play-store-app.js
```

## Manual Steps After Script

### Play Store
- Upload feature graphic (1024x500 PNG)
- Upload phone screenshots (2-8 images)
- Upload AAB and create release

### App Store
- Upload app icon (1024x1024 PNG without alpha)
- Upload screenshots for each device size:
  - iPhone 6.7" display (1290 x 2796)
  - iPhone 6.5" display (1242 x 2688)
  - iPhone 5.5" display (1242 x 2208)
  - iPad Pro 12.9" (2048 x 2732) - if supporting iPad
- Upload build via Xcode or Transporter
- Configure pricing and availability
- Submit for review

## Troubleshooting

### "Bundle ID not found" (App Store)
Register the Bundle ID in the Apple Developer Portal first. See "Registering a Bundle ID" above.

### Script timeout on login
The scripts wait up to 5 minutes for manual login. If you need more time, run the script again - it will resume from where it left off.

### Progress not saving
Ensure the tenant JSON file is writable. Check file permissions.
