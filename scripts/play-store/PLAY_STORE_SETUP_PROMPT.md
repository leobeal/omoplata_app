# Play Store App Setup - AI Assistant Prompt

Use this prompt to have Claude complete the Google Play Console app setup using MCP Playwright.

---

## Quick Start Prompt

Copy and paste this to start the setup process:

```
Set up the Play Store app for [TENANT_NAME] using MCP Playwright.

Tenant config: scripts/play-store/config/tenants/[TENANT].json
Developer ID: 5739281656511061086

Steps to complete:
1. Navigate to https://play.google.com/console/u/0/developers/5739281656511061086/app-list
2. Wait for me to log in (I'll tell you when ready)
3. Click on the app or create a new one
4. Complete each task from the dashboard:
   - Set privacy policy
   - App access (with test credentials if restricted)
   - Ads declaration
   - Content rating questionnaire
   - Target audience
   - Data safety
   - Government apps
   - Financial features
   - Health apps
   - App category and contact details
   - Store listing

Use browser_snapshot to see the page, browser_click to interact, and browser_type to fill forms.
```

---

## Detailed Process

### Prerequisites
- Google Play Console account logged in
- Tenant JSON config file ready in `scripts/play-store/config/tenants/`

### Step-by-Step Instructions for Claude

1. **Navigate to Play Console**
   ```
   Use mcp__playwright__browser_navigate to go to:
   https://play.google.com/console/u/0/developers/5739281656511061086/app-list
   ```

2. **Wait for Login**
   - Take a snapshot and wait for user to confirm they're logged in
   - User will say "ready" or "logged in"

3. **Access the App**
   - If new app: Click "Create app" and fill details from config
   - If existing: Click on the app name to open dashboard

4. **Complete Dashboard Tasks**
   From the dashboard, click each task button and complete:

   | Task | Config Field | Notes |
   |------|-------------|-------|
   | Privacy policy | `contact.privacyPolicyUrl` | Just paste URL and save |
   | App access | `appAccess.restricted`, `appAccess.testCredentials` | Add instructions if restricted |
   | Ads | `declarations.containsAds` | Select Yes/No radio |
   | Content rating | `contact.email` | Start questionnaire, select Utility, answer No to all |
   | Target audience | `targetAudience` | Select age checkbox (e.g., "13 and over") |
   | Data safety | `dataSafety` | Multi-step wizard, configure data types |
   | Government apps | `declarations.isGovernmentApp` | Usually No |
   | Financial features | `declarations.hasFinancialFeatures` | Usually No |
   | Health | `declarations.hasHealthFeatures` | Usually No |
   | App category | `appCategory`, `contact` | Edit category and contact details |
   | Store listing | `listing.title`, `listing.shortDescription`, `listing.fullDescription` | Fill all text fields |

5. **Manual Tasks Remaining**
   After automation, user must manually:
   - Upload app icon (512x512 PNG)
   - Upload feature graphic (1024x500 PNG)
   - Upload phone screenshots (2-8 images)
   - Upload AAB and create release

---

## Example Tenant Config Structure

```json
{
  "packageName": "com.omoplata.tenantname",
  "defaultLanguage": "de-DE",
  "listing": {
    "title": "App Name",
    "shortDescription": "Short description (max 80 chars)",
    "fullDescription": "Full description..."
  },
  "contact": {
    "email": "contact@example.com",
    "website": "https://example.com",
    "privacyPolicyUrl": "https://example.com/privacy"
  },
  "appCategory": "Health & fitness",
  "targetAudience": "13 and over",
  "appAccess": {
    "restricted": true,
    "instructions": "Login required",
    "testCredentials": {
      "username": "reviewer@example.com",
      "password": "TestPassword123!"
    }
  },
  "dataSafety": {
    "collectsData": true,
    "encryptedInTransit": true
  },
  "declarations": {
    "containsAds": false,
    "isGovernmentApp": false,
    "hasFinancialFeatures": false,
    "hasHealthFeatures": false
  }
}
```

---

## Resume Prompt

If the process was interrupted, use this:

```
Resume Play Store setup for [TENANT_NAME].
App ID: [APP_ID]
Last completed step: [STEP_NAME]

Continue from the dashboard by clicking on the next incomplete task.
```

---

## Troubleshooting

- **Page redirects to app-list**: Navigate to dashboard first, then click task buttons
- **Element not found**: Take a new snapshot with browser_snapshot
- **Save button disabled**: Check if all required fields are filled
- **Timeout errors**: Use browser_wait_for to wait for page load
