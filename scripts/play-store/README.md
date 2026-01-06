# Play Store Automation

Playwright-based automation for Google Play Console - create new apps and update existing app metadata.

## Features

- **Create new apps** with all questionnaires automated
- **Update existing apps** metadata, screenshots, and descriptions
- **Multi-tenant support** for managing multiple apps
- **Multi-language** localized store listings
- **Dry-run mode** to preview changes
- **Session management** with saved authentication

## Prerequisites

### 1. Install Dependencies

```bash
npm install playwright
npx playwright install chromium
```

### 2. Project Structure

```
scripts/play-store/
├── README.md                    # This documentation
├── .env.example                 # Environment variables template
├── config/
│   ├── auth.json               # Saved browser session (auto-generated)
│   ├── apps/                   # App creation configurations
│   │   └── evolve-new.json     # Example: create Evolve app
│   └── tenants/                # Existing app update configurations
│       ├── evolve.json         # Example: update Evolve metadata
│       └── sparta.json         # Example: update Sparta metadata
├── assets/
│   └── {tenant}/
│       ├── icon.png            # 512x512 app icon
│       ├── feature.png         # 1024x500 feature graphic
│       └── screenshots/
│           ├── phone-1.png     # Phone screenshots (min 2)
│           └── ...
├── src/
│   ├── index.ts                # CLI entry point
│   ├── PlayStoreAutomation.ts  # Metadata update automation
│   ├── AppCreationAutomation.ts # App creation automation
│   ├── types.ts                # Update types
│   ├── types/
│   │   └── app-creation.ts     # App creation types
│   ├── selectors.ts            # Play Console selectors
│   └── selectors/
│       └── questionnaires.ts   # Questionnaire selectors
└── logs/
    └── {timestamp}/            # Execution logs and screenshots
```

## Quick Start

```bash
# 1. Setup environment
cp scripts/play-store/.env.example scripts/play-store/.env
# Edit .env with your credentials

# 2. Login (first time only)
npx ts-node scripts/play-store/src/index.ts login

# 3. Create a new app
npx ts-node scripts/play-store/src/index.ts create --config evolve-new

# 4. Or update existing app
npx ts-node scripts/play-store/src/index.ts update --tenant evolve
```

## Commands Reference

### Login

Authenticate with Google and save session:

```bash
npx ts-node scripts/play-store/src/index.ts login
```

This opens a browser for you to complete 2FA. Session is saved for future use.

### Create App

Create a new app with all questionnaires:

```bash
# Create single app
npx ts-node scripts/play-store/src/index.ts create --config evolve-new

# Create all configured apps
npx ts-node scripts/play-store/src/index.ts create --all

# Preview without making changes
npx ts-node scripts/play-store/src/index.ts create --config evolve-new --dry-run

# Debug mode (pause on error)
npx ts-node scripts/play-store/src/index.ts create --config evolve-new --pause-on-error
```

### Update Metadata

Update existing app metadata:

```bash
# Update single tenant
npx ts-node scripts/play-store/src/index.ts update --tenant evolve

# Update all tenants
npx ts-node scripts/play-store/src/index.ts update --all

# Update only specific sections
npx ts-node scripts/play-store/src/index.ts update --tenant evolve --only listing,screenshots
```

### Validate Configuration

Check configuration files for errors:

```bash
# Validate app creation config
npx ts-node scripts/play-store/src/index.ts validate --config evolve-new

# Validate tenant config
npx ts-node scripts/play-store/src/index.ts validate --tenant evolve

# Validate all configs
npx ts-node scripts/play-store/src/index.ts validate --all
```

### Take Screenshots

Capture current store listing:

```bash
npx ts-node scripts/play-store/src/index.ts screenshot --tenant evolve
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Google Account (for initial login)
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_PASSWORD=your-password

# Play Console Developer ID
# Find in URL: play.google.com/console/developers/XXXXXXXXXX
PLAY_CONSOLE_DEVELOPER_ID=1234567890

# Options
HEADLESS=false
SLOW_MO=100
```

### App Creation Configuration

Create configs in `config/apps/{name}.json`:

```json
{
  "basicInfo": {
    "name": "My App",
    "defaultLanguage": "en-US",
    "appType": "app",
    "pricingType": "free"
  },

  "contentRating": {
    "email": "support@myapp.com",
    "category": "health_fitness",
    "violence": { "hasViolence": false },
    "sexualContent": { "hasSexualContent": false },
    "language": { "hasProfanity": false },
    "substances": { "hasDrugReferences": false },
    "gambling": { "hasGambling": false },
    "interactive": {
      "hasUserInteraction": true,
      "canShareInfo": false,
      "canShareLocation": false,
      "hasUnfilteredContent": false,
      "hasDigitalPurchases": false
    }
  },

  "dataSafety": {
    "collectsOrSharesData": true,
    "dataCollection": {
      "personalInfo": {
        "collects": true,
        "shares": false,
        "required": true,
        "purpose": ["app_functionality", "account_management"]
      }
    },
    "securityPractices": {
      "dataEncryptedInTransit": true,
      "canRequestDeletion": true
    }
  },

  "targetAudience": {
    "ageGroups": ["18_plus"],
    "appealsToChildren": false
  },

  "ads": {
    "containsAds": false
  },

  "categoryAndContact": {
    "category": "HEALTH_AND_FITNESS",
    "contact": {
      "email": "support@myapp.com",
      "website": "https://myapp.com"
    },
    "privacyPolicyUrl": "https://myapp.com/privacy"
  },

  "storeListing": {
    "title": "My App",
    "shortDescription": "Short description (max 80 chars)",
    "fullDescription": "Full description...",
    "localizations": {
      "de-DE": {
        "title": "Meine App",
        "shortDescription": "Kurzbeschreibung"
      }
    }
  },

  "assets": {
    "icon": "assets/myapp/icon.png",
    "featureGraphic": "assets/myapp/feature.png",
    "phoneScreenshots": [
      "assets/myapp/screenshots/phone-1.png",
      "assets/myapp/screenshots/phone-2.png"
    ]
  }
}
```

### Tenant Update Configuration

Create configs in `config/tenants/{name}.json`:

```json
{
  "packageName": "com.mycompany.myapp",
  "defaultLanguage": "en-US",

  "listing": {
    "title": "My App",
    "shortDescription": "Short description",
    "fullDescription": "Full description..."
  },

  "localizations": {
    "de-DE": {
      "title": "Meine App",
      "shortDescription": "Kurzbeschreibung"
    }
  },

  "contact": {
    "email": "support@myapp.com",
    "website": "https://myapp.com"
  },

  "assets": {
    "icon": "assets/myapp/icon.png",
    "featureGraphic": "assets/myapp/feature.png",
    "screenshots": {
      "phone": ["assets/myapp/screenshots/phone-1.png"]
    }
  }
}
```

## What Gets Automated

### App Creation Flow

| Step | What It Does |
|------|--------------|
| 1. Create App | Name, language, app type, pricing |
| 2. Store Listing | Title, descriptions, localizations |
| 3. Assets | Icon, feature graphic, screenshots |
| 4. Content Rating | IARC questionnaire (violence, sexual, etc.) |
| 5. Data Safety | Data collection, sharing, security practices |
| 6. Target Audience | Age groups, child appeal |
| 7. Ads Declaration | Contains ads yes/no |
| 8. Category & Contact | App category, email, website, privacy policy |

### Metadata Update Sections

| Section | What It Updates |
|---------|-----------------|
| `listing` | Title, short/full descriptions |
| `localizations` | Multi-language descriptions |
| `graphics` | App icon, feature graphic |
| `screenshots` | Phone/tablet screenshots |
| `contact` | Email, website, phone, privacy URL |

## Content Rating Categories

For the `contentRating.category` field:

| Value | Description |
|-------|-------------|
| `reference` | Reference apps (dictionaries, etc.) |
| `news` | News apps |
| `social_networking` | Social networking |
| `communication` | Communication (chat, email) |
| `entertainment` | Entertainment |
| `games` | Games |
| `education` | Educational apps |
| `utilities` | Utility apps |
| `lifestyle` | Lifestyle apps |
| `health_fitness` | Health & Fitness |
| `business` | Business apps |
| `other` | Other |

## App Categories

For the `categoryAndContact.category` field:

| Apps | Games |
|------|-------|
| `ART_AND_DESIGN` | `GAME_ACTION` |
| `AUTO_AND_VEHICLES` | `GAME_ADVENTURE` |
| `BEAUTY` | `GAME_ARCADE` |
| `BOOKS_AND_REFERENCE` | `GAME_BOARD` |
| `BUSINESS` | `GAME_CARD` |
| `COMMUNICATION` | `GAME_CASINO` |
| `EDUCATION` | `GAME_CASUAL` |
| `ENTERTAINMENT` | `GAME_EDUCATIONAL` |
| `FINANCE` | `GAME_PUZZLE` |
| `FOOD_AND_DRINK` | `GAME_RACING` |
| `HEALTH_AND_FITNESS` | `GAME_ROLE_PLAYING` |
| `LIFESTYLE` | `GAME_SIMULATION` |
| `MEDICAL` | `GAME_SPORTS` |
| `MUSIC_AND_AUDIO` | `GAME_STRATEGY` |
| `PRODUCTIVITY` | `GAME_TRIVIA` |
| `SHOPPING` | `GAME_WORD` |
| `SOCIAL` | |
| `SPORTS` | |
| `TOOLS` | |
| `TRAVEL_AND_LOCAL` | |

## Asset Requirements

### App Icon
- Size: 512 x 512 pixels
- Format: PNG (32-bit, with alpha)
- Max file size: 1 MB

### Feature Graphic
- Size: 1024 x 500 pixels
- Format: PNG or JPEG
- Max file size: 1 MB

### Screenshots
- Phone: 16:9 or 9:16 aspect ratio
- Minimum: 2 screenshots
- Maximum: 8 screenshots
- Min dimensions: 320px
- Max dimensions: 3840px
- Format: PNG or JPEG

## Troubleshooting

### Session Expired

```bash
npx ts-node scripts/play-store/src/index.ts login
```

### Selectors Not Working

Google occasionally updates the Play Console UI. If automation fails:

1. Run with `--verbose` for detailed logs
2. Check `logs/` folder for error screenshots
3. Update selectors in `src/selectors/` if needed

### Rate Limiting

Add delays between operations:

```bash
npx ts-node scripts/play-store/src/index.ts create --all --delay 5000
```

### Debug Mode

Pause on errors for debugging:

```bash
npx ts-node scripts/play-store/src/index.ts create --config evolve-new --pause-on-error
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Create Play Store App

on:
  workflow_dispatch:
    inputs:
      config:
        description: 'App config name'
        required: true

jobs:
  create-app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci && npm install playwright && npx playwright install chromium

      - name: Restore auth session
        run: echo '${{ secrets.PLAY_CONSOLE_AUTH }}' > scripts/play-store/config/auth.json

      - name: Create app
        env:
          PLAY_CONSOLE_DEVELOPER_ID: ${{ secrets.PLAY_CONSOLE_DEVELOPER_ID }}
        run: npx ts-node scripts/play-store/src/index.ts create --config ${{ inputs.config }} --headless

      - name: Upload logs
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-logs
          path: scripts/play-store/logs/
```

## Security Notes

1. **Never commit `auth.json`** - Already in `.gitignore`
2. **Use secrets for CI/CD** - Store auth session as encrypted secret
3. **Rotate sessions regularly** - Re-login periodically
4. **Use service accounts when possible** - For API-based operations

## Limitations

This automation handles **app creation and metadata updates**. For these tasks, use the Google Play Developer API or EAS:

- Uploading APK/AAB builds → Use `eas build` + `eas submit`
- Managing releases and rollouts → Use Google Play Developer API
- Replying to reviews → Use Google Play Developer API
- Financial reports → Use Google Play Developer API

## Related Documentation

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [EAS Submit (Expo)](https://docs.expo.dev/submit/android/)
