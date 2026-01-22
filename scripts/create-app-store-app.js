#!/usr/bin/env node
/**
 * Playwright script to create and set up a new app in App Store Connect
 *
 * Usage:
 * TENANT=iron-oak node scripts/create-app-store-app.js
 *
 * The script automatically saves progress to the tenant JSON file.
 * On retry, it will resume from the last completed step.
 *
 * Prerequisites:
 * - Bundle ID must be registered in Apple Developer Portal first
 * - You need an Apple Developer account with App Manager role or higher
 *
 * Environment variables:
 * - TENANT: The tenant slug (required)
 * - TEAM_ID: Apple Developer Team ID (optional, has default)
 * - RESUME_APP_ID: Override app ID to resume (optional, reads from JSON if not set)
 * - START_STEP: Override start step (optional, reads from JSON if not set)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

// Configuration
const TEAM_ID = process.env.TEAM_ID || '';
const TENANT = process.env.TENANT || 'iron-oak';

// Load tenant config - use same JSON as Play Store
const configPath = path.join(__dirname, `play-store/config/tenants/${TENANT}.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Ensure stores.appStore structure exists
if (!config.stores) {
  config.stores = {};
}
if (!config.stores.appStore) {
  config.stores.appStore = {
    primaryCategory: 'HEALTH_FITNESS',
    secondaryCategory: null,
    sku: TENANT,
    progress: { appId: null, lastCompletedStep: 0, lastUpdated: null },
  };
}

// Progress tracking - read from config or environment
const savedProgress = config.stores.appStore.progress || {};
const RESUME_APP_ID = process.env.RESUME_APP_ID || savedProgress.appId || '';
const START_STEP = parseInt(
  process.env.START_STEP ||
    (savedProgress.lastCompletedStep ? savedProgress.lastCompletedStep + 1 : 1).toString(),
  10
);

// Helper function to save progress to tenant JSON
function saveProgress(step, appId) {
  config.stores.appStore.progress = {
    appId,
    lastCompletedStep: step,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`    Progress saved: Step ${step} completed`);
}

const BASE_URL = 'https://appstoreconnect.apple.com';

// Use a fresh profile directory (user will log in manually)
const userDataDir = path.join(os.tmpdir(), 'playwright-app-store-connect');

// Helper to log step progress
function logStep(step, name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Step ${step}: ${name}`);
  console.log('='.repeat(60));
}

// Get localized value with fallback
function getLocalizedValue(field, lang) {
  // Try exact match first
  if (config.localizations?.[lang]?.[field]) {
    return config.localizations[lang][field];
  }
  // Try language without region (e.g., 'de' from 'de-DE')
  const baseLang = lang.split('-')[0];
  for (const key of Object.keys(config.localizations || {})) {
    if (key.startsWith(baseLang) && config.localizations[key]?.[field]) {
      return config.localizations[key][field];
    }
  }
  // Fallback to default listing
  return config.listing?.[field] || '';
}

// Map language codes between formats
function mapLanguageCode(lang) {
  const mapping = {
    'de-DE': 'German',
    'en-US': 'English (U.S.)',
    'en-GB': 'English (U.K.)',
    'pt-BR': 'Portuguese (Brazil)',
    'es-ES': 'Spanish (Spain)',
    'fr-FR': 'French',
    'it-IT': 'Italian',
    ja: 'Japanese',
    ko: 'Korean',
    'zh-Hans': 'Chinese (Simplified)',
    'zh-Hant': 'Chinese (Traditional)',
  };
  return mapping[lang] || lang;
}

async function main() {
  console.log(`\nApp Store Connect Setup: ${config.listing.title}`);
  console.log(`Tenant: ${TENANT}`);
  console.log(`Bundle ID: ${config.bundleId}`);
  if (TEAM_ID) console.log(`Team ID: ${TEAM_ID}`);
  if (RESUME_APP_ID) console.log(`Resuming app ID: ${RESUME_APP_ID}`);
  if (START_STEP > 1) console.log(`Starting from step: ${START_STEP}`);
  if (savedProgress.lastUpdated) console.log(`Last progress: ${savedProgress.lastUpdated}`);
  console.log('');

  // Launch browser with fresh profile and stealth settings
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1400, height: 900 },
    slowMo: 300,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--no-first-run',
      '--no-default-browser-check',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  // Remove webdriver property to avoid detection
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  // Set default timeout to 15 seconds
  page.setDefaultTimeout(15000);

  let appId = RESUME_APP_ID;

  try {
    // Navigate to App Store Connect - user needs to log in
    console.log('\nNavigating to App Store Connect...');
    console.log('Please log in with your Apple ID when prompted.');
    console.log('You may need to complete 2FA verification.');
    console.log('The script will continue automatically once you reach the apps list.\n');

    await page.goto(`${BASE_URL}/apps`);

    // Wait for user to log in and reach the apps list (up to 5 minutes)
    // Use locator.or() to wait for any of these elements
    await page
      .locator('[class*="app-list"]')
      .or(page.locator('[data-testid="apps-list"]'))
      .or(page.getByText('My Apps'))
      .or(page.getByRole('button', { name: /new app/i }))
      .or(page.locator('button:has-text("Add")'))
      .first()
      .waitFor({ timeout: 300000 });
    console.log('Login successful!\n');
    await page.waitForTimeout(2000);

    // Step 1: Create new app (or skip if resuming)
    if (START_STEP <= 1 && !RESUME_APP_ID) {
      logStep(1, 'Create new app');

      // Click the "New App" button - this opens a dropdown menu first
      const newAppButton = page.getByRole('button', { name: 'New App' });
      await newAppButton.click();
      await page.waitForTimeout(1000);

      // Click "New App" in the dropdown menu to open the dialog
      const newAppMenuItem = page.getByRole('menuitem', { name: 'New App' }).getByRole('button');
      if ((await newAppMenuItem.count()) > 0) {
        await newAppMenuItem.click();
        await page.waitForTimeout(1000);
      }

      // Wait for the new app dialog
      await page.getByRole('dialog', { name: 'New App' }).waitFor({ timeout: 10000 });
      await page.waitForTimeout(500);

      // Select platform - iOS
      console.log('  Selecting iOS platform...');
      const iosCheckbox = page.getByRole('checkbox', { name: 'iOS' });
      if ((await iosCheckbox.count()) > 0 && !(await iosCheckbox.isChecked())) {
        await iosCheckbox.click();
        await page.waitForTimeout(500);
      }

      // Fill app name
      console.log('  Filling app name...');
      const nameInput = page.getByRole('textbox', { name: 'Name' });
      await nameInput.fill(config.listing.title);
      await page.waitForTimeout(300);

      // Select primary language
      console.log('  Selecting primary language...');
      const langDropdown = page.getByLabel('Primary Language');
      const langName = mapLanguageCode(config.defaultLanguage);
      await langDropdown.selectOption({ label: langName });
      await page.waitForTimeout(300);

      // Select bundle ID
      console.log('  Selecting bundle ID...');
      const bundleIdDropdown = page.getByLabel('Bundle ID');

      // Check if bundle ID exists in dropdown
      const bundleOptions = await bundleIdDropdown.locator('option').allTextContents();
      const hasBundleId = bundleOptions.some((opt) => opt.includes(config.bundleId));

      if (hasBundleId) {
        await bundleIdDropdown.selectOption({ label: new RegExp(config.bundleId) });
        await page.waitForTimeout(300);
      } else {
        console.log(`\n  WARNING: Bundle ID ${config.bundleId} not found in dropdown.`);
        console.log('  Available options:', bundleOptions.join(', '));
        console.log('  Please register it in the Apple Developer Portal first:');
        console.log('  https://developer.apple.com/account/resources/identifiers/bundleId/add/\n');
        console.log('  After registering, run this script again.\n');

        // Cancel and exit
        const cancelButton = page.getByRole('button', { name: 'Cancel' });
        await cancelButton.click();
        throw new Error(
          `Bundle ID ${config.bundleId} not registered. Register it first, then retry.`
        );
      }

      // Fill SKU
      console.log('  Filling SKU...');
      const skuInput = page.getByRole('textbox', { name: 'SKU' });
      await skuInput.fill(config.stores.appStore.sku || TENANT);
      await page.waitForTimeout(300);

      // User Access is already set to Full Access by default

      // Click Create button
      console.log('  Creating app...');
      const createButton = page.getByRole('button', { name: 'Create' });

      // Check if Create button is enabled
      if (await createButton.isDisabled()) {
        console.log(
          '  ERROR: Create button is disabled. Check that all fields are filled correctly.'
        );
        await page.screenshot({ path: `/tmp/appstore-create-disabled-${Date.now()}.png` });
        throw new Error('Create button is disabled - missing required fields');
      }

      await createButton.click();
      await page.waitForTimeout(3000);

      // Extract app ID from URL
      await page.waitForURL(/\/apps\/\d+/, { timeout: 30000 });
      const url = page.url();
      const match = url.match(/\/apps\/(\d+)/);
      appId = match ? match[1] : '';
      console.log(`App created with ID: ${appId}`);
      saveProgress(1, appId);
    } else {
      console.log(`Using existing app ID: ${appId}`);
      if (appId) {
        await page.goto(`${BASE_URL}/apps/${appId}/appstore`);
        await page.waitForTimeout(2000);
      }
    }

    // Ensure we have an app ID
    if (!appId) {
      throw new Error('No app ID available. Please create an app first or provide RESUME_APP_ID.');
    }

    // Step 2: Set app information (Privacy Policy URL, Category)
    if (START_STEP <= 2) {
      logStep(2, 'Set app information');

      await page.goto(`${BASE_URL}/apps/${appId}/appstore/info`);
      await page.waitForTimeout(2000);

      // Set primary category
      console.log('  Setting primary category...');
      const categoryDropdown = page.locator(
        '[aria-label*="Primary Category"], select[name*="category"]'
      );
      if ((await categoryDropdown.count()) > 0) {
        await categoryDropdown.click();
        await page.waitForTimeout(500);

        // Map category
        const categoryMap = {
          HEALTH_FITNESS: 'Health & Fitness',
          LIFESTYLE: 'Lifestyle',
          SPORTS: 'Sports',
          SOCIAL_NETWORKING: 'Social Networking',
        };
        const categoryName =
          categoryMap[config.stores.appStore.primaryCategory] || 'Health & Fitness';
        const categoryOption = page.locator(`text="${categoryName}"`).first();
        if ((await categoryOption.count()) > 0) {
          await categoryOption.click();
        }
        await page.waitForTimeout(300);
      }

      // Set secondary category if specified
      if (config.stores.appStore.secondaryCategory) {
        console.log('  Setting secondary category...');
        const secondaryDropdown = page.locator(
          '[aria-label*="Secondary Category"], select[name*="secondary"]'
        );
        if ((await secondaryDropdown.count()) > 0) {
          await secondaryDropdown.click();
          await page.waitForTimeout(500);

          const categoryMap = {
            HEALTH_FITNESS: 'Health & Fitness',
            LIFESTYLE: 'Lifestyle',
            SPORTS: 'Sports',
          };
          const categoryName = categoryMap[config.stores.appStore.secondaryCategory] || 'Lifestyle';
          const categoryOption = page.locator(`text="${categoryName}"`).first();
          if ((await categoryOption.count()) > 0) {
            await categoryOption.click();
          }
          await page.waitForTimeout(300);
        }
      }

      // Set privacy policy URL
      console.log('  Setting privacy policy URL...');
      const privacyInput = page.locator(
        'input[name*="privacyPolicy"], input[placeholder*="Privacy Policy"]'
      );
      if ((await privacyInput.count()) > 0) {
        await privacyInput.fill(config.contact.privacyPolicyUrl);
        await page.waitForTimeout(300);
      }

      // Save
      const saveButton = page.locator('button:has-text("Save")');
      if ((await saveButton.count()) > 0) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }

      console.log('App information saved');
      saveProgress(2, appId);
    }

    // Step 3: Set age rating
    if (START_STEP <= 3) {
      logStep(3, 'Set age rating');

      await page.goto(`${BASE_URL}/apps/${appId}/ageratings`);
      await page.waitForTimeout(2000);

      // Click "Set Age Rating" or "Edit" if rating exists
      const setRatingButton = page.locator(
        'button:has-text("Set Age Rating"), button:has-text("Edit")'
      );
      if ((await setRatingButton.count()) > 0) {
        await setRatingButton.click();
        await page.waitForTimeout(1500);
      }

      // Answer age rating questionnaire - select "None" for all questions
      console.log('  Answering age rating questionnaire...');

      const ageRatingConfig = config.stores.appStore.ageRating || {};
      const ratingQuestions = [
        { key: 'violenceCartoonOrFantasy', label: 'Cartoon or Fantasy Violence' },
        { key: 'violenceRealistic', label: 'Realistic Violence' },
        { key: 'violenceRealisticProlongedGraphicOrSadistic', label: 'Prolonged Graphic' },
        { key: 'sexualContentOrNudity', label: 'Sexual Content or Nudity' },
        { key: 'sexualContentGraphicAndNudity', label: 'Graphic Sexual Content' },
        { key: 'profanityOrCrudeHumor', label: 'Profanity or Crude Humor' },
        { key: 'matureOrSuggestiveThemes', label: 'Mature/Suggestive Themes' },
        { key: 'horrorOrFearThemes', label: 'Horror/Fear Themes' },
        { key: 'medicalOrTreatmentInformation', label: 'Medical Information' },
        { key: 'alcoholTobaccoOrDrugUseOrReferences', label: 'Alcohol, Tobacco, or Drugs' },
        { key: 'gamblingSimulated', label: 'Simulated Gambling' },
        { key: 'contests', label: 'Contests' },
      ];

      for (const question of ratingQuestions) {
        const value = ageRatingConfig[question.key] || 'NONE';
        const radioValue =
          value === 'NONE'
            ? 'None'
            : value === 'INFREQUENT_OR_MILD'
              ? 'Infrequent/Mild'
              : 'Frequent/Intense';

        const radioButton = page.locator(`input[value="${radioValue}"]`).first();
        if ((await radioButton.count()) > 0) {
          await radioButton.click();
          await page.waitForTimeout(200);
        }
      }

      // Handle boolean questions
      if (ageRatingConfig.gambling === false) {
        const noGambling = page.locator('input[value="false"][name*="gambling"]');
        if ((await noGambling.count()) > 0) {
          await noGambling.click();
        }
      }

      if (ageRatingConfig.unrestrictedWebAccess === false) {
        const noWebAccess = page.locator('input[value="false"][name*="webAccess"]');
        if ((await noWebAccess.count()) > 0) {
          await noWebAccess.click();
        }
      }

      // Save age rating
      const saveAgeButton = page.locator('button:has-text("Done"), button:has-text("Save")');
      if ((await saveAgeButton.count()) > 0) {
        await saveAgeButton.click();
        await page.waitForTimeout(2000);
      }

      console.log('Age rating configured');
      saveProgress(3, appId);
    }

    // Step 4: Configure App Privacy
    if (START_STEP <= 4) {
      logStep(4, 'Configure App Privacy');

      await page.goto(`${BASE_URL}/apps/${appId}/privacy`);
      await page.waitForTimeout(2000);

      // Click "Get Started" or "Edit" if already configured
      const startPrivacyButton = page.locator(
        'button:has-text("Get Started"), button:has-text("Edit")'
      );
      if ((await startPrivacyButton.count()) > 0) {
        await startPrivacyButton.click();
        await page.waitForTimeout(1500);
      }

      // Answer "Does your app collect any data?" - Yes if we collect data
      if (config.dataSafety?.collectsData) {
        console.log('  Declaring data collection...');
        const collectsDataYes = page.locator('input[value="true"], button:has-text("Yes")');
        if ((await collectsDataYes.count()) > 0) {
          await collectsDataYes.click();
          await page.waitForTimeout(1000);
        }

        // Select data types collected
        if (config.dataSafety.dataTypes) {
          // Contact Info
          if (
            config.dataSafety.dataTypes.name ||
            config.dataSafety.dataTypes.email ||
            config.dataSafety.dataTypes.phone
          ) {
            console.log('  Selecting Contact Info...');
            const contactInfoCheckbox = page.locator(
              'input[value="CONTACT_INFO"], label:has-text("Contact Info")'
            );
            if ((await contactInfoCheckbox.count()) > 0) {
              await contactInfoCheckbox.click();
              await page.waitForTimeout(500);
            }
          }
        }

        // Continue through the wizard
        const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
        while ((await nextButton.count()) > 0 && (await nextButton.isEnabled())) {
          await nextButton.click();
          await page.waitForTimeout(1500);

          // Check if we're on a data purpose page
          const appFunctionalityCheckbox = page.locator('label:has-text("App Functionality")');
          if ((await appFunctionalityCheckbox.count()) > 0) {
            await appFunctionalityCheckbox.click();
            await page.waitForTimeout(300);
          }

          // Select "linked to user" if required
          const linkedCheckbox = page.locator('input[value="LINKED"], label:has-text("linked to")');
          if ((await linkedCheckbox.count()) > 0) {
            await linkedCheckbox.click();
            await page.waitForTimeout(300);
          }
        }
      } else {
        // No data collected
        const collectsDataNo = page.locator('input[value="false"], button:has-text("No")');
        if ((await collectsDataNo.count()) > 0) {
          await collectsDataNo.click();
          await page.waitForTimeout(1000);
        }
      }

      // Publish/Save
      const publishButton = page.locator(
        'button:has-text("Publish"), button:has-text("Save"), button:has-text("Done")'
      );
      if ((await publishButton.count()) > 0) {
        await publishButton.click();
        await page.waitForTimeout(2000);
      }

      console.log('App Privacy configured');
      saveProgress(4, appId);
    }

    // Step 5: Set up store listing (version info)
    if (START_STEP <= 5) {
      logStep(5, 'Set up store listing');

      // Navigate to the app store version page
      await page.goto(`${BASE_URL}/apps/${appId}/appstore`);
      await page.waitForTimeout(2000);

      // Click on the version to edit (e.g., "Prepare for Submission" or version number)
      const versionLink = page.locator(
        'a:has-text("Prepare for Submission"), [class*="version-link"]'
      );
      if ((await versionLink.count()) > 0) {
        await versionLink.click();
        await page.waitForTimeout(2000);
      }

      // Fill promotional text (170 chars)
      console.log('  Setting promotional text...');
      const promoInput = page.locator(
        'textarea[name*="promotionalText"], [aria-label*="Promotional Text"]'
      );
      if ((await promoInput.count()) > 0) {
        // Use short description as promotional text
        const promoText = config.listing.shortDescription.substring(0, 170);
        await promoInput.fill(promoText);
        await page.waitForTimeout(300);
      }

      // Fill description
      console.log('  Setting description...');
      const descInput = page.locator('textarea[name*="description"], [aria-label*="Description"]');
      if ((await descInput.count()) > 0) {
        await descInput.fill(config.listing.fullDescription);
        await page.waitForTimeout(300);
      }

      // Fill keywords (100 chars, comma-separated)
      console.log('  Setting keywords...');
      const keywordsInput = page.locator('input[name*="keywords"], [aria-label*="Keywords"]');
      if ((await keywordsInput.count()) > 0) {
        const keywords =
          getLocalizedValue('keywords', config.defaultLanguage) ||
          config.listing.tags?.join(',').substring(0, 100) ||
          '';
        await keywordsInput.fill(keywords);
        await page.waitForTimeout(300);
      }

      // Fill support URL
      console.log('  Setting support URL...');
      const supportInput = page.locator('input[name*="supportUrl"], [aria-label*="Support URL"]');
      if ((await supportInput.count()) > 0) {
        await supportInput.fill(config.contact.supportUrl || config.contact.website);
        await page.waitForTimeout(300);
      }

      // Fill marketing URL (optional)
      if (config.contact.marketingUrl) {
        console.log('  Setting marketing URL...');
        const marketingInput = page.locator(
          'input[name*="marketingUrl"], [aria-label*="Marketing URL"]'
        );
        if ((await marketingInput.count()) > 0) {
          await marketingInput.fill(config.contact.marketingUrl);
          await page.waitForTimeout(300);
        }
      }

      // Save
      const saveButton = page.locator('button:has-text("Save")');
      if ((await saveButton.count()) > 0) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }

      console.log('Store listing saved');
      saveProgress(5, appId);
    }

    // Step 6: Set subtitle
    if (START_STEP <= 6) {
      logStep(6, 'Set subtitle');

      // Navigate to app information
      await page.goto(`${BASE_URL}/apps/${appId}/appstore/info`);
      await page.waitForTimeout(2000);

      // Find and fill subtitle (30 chars)
      const subtitle = getLocalizedValue('subtitle', config.defaultLanguage);
      if (subtitle) {
        console.log('  Setting subtitle...');
        const subtitleInput = page.locator('input[name*="subtitle"], [aria-label*="Subtitle"]');
        if ((await subtitleInput.count()) > 0) {
          await subtitleInput.fill(subtitle.substring(0, 30));
          await page.waitForTimeout(300);

          // Save
          const saveButton = page.locator('button:has-text("Save")');
          if ((await saveButton.count()) > 0) {
            await saveButton.click();
            await page.waitForTimeout(2000);
          }
        }
      } else {
        console.log('  No subtitle configured, skipping...');
      }

      console.log('Subtitle saved');
      saveProgress(6, appId);
    }

    // Step 7: Set up App Review information
    if (START_STEP <= 7) {
      logStep(7, 'Set up App Review information');

      await page.goto(`${BASE_URL}/apps/${appId}/appstore/review`);
      await page.waitForTimeout(2000);

      // Set sign-in required
      if (config.appAccess?.restricted && config.appAccess?.testCredentials) {
        console.log('  Configuring demo account...');

        // Check "Sign-in required"
        const signInRequired = page.locator(
          'input[type="checkbox"][name*="signIn"], label:has-text("Sign-in required")'
        );
        if ((await signInRequired.count()) > 0) {
          const isChecked = await signInRequired.isChecked().catch(() => false);
          if (!isChecked) {
            await signInRequired.click();
            await page.waitForTimeout(500);
          }
        }

        // Fill demo account username
        const usernameInput = page.locator(
          'input[name*="demoAccountName"], input[placeholder*="Username"]'
        );
        if ((await usernameInput.count()) > 0) {
          await usernameInput.fill(config.appAccess.testCredentials.username);
          await page.waitForTimeout(300);
        }

        // Fill demo account password
        const passwordInput = page.locator(
          'input[name*="demoAccountPassword"], input[type="password"]'
        );
        if ((await passwordInput.count()) > 0) {
          await passwordInput.fill(config.appAccess.testCredentials.password);
          await page.waitForTimeout(300);
        }
      }

      // Fill contact information
      console.log('  Setting contact info...');
      const contactFirstName = page.locator('input[name*="firstName"]');
      if ((await contactFirstName.count()) > 0) {
        await contactFirstName.fill('App');
        await page.waitForTimeout(200);
      }

      const contactLastName = page.locator('input[name*="lastName"]');
      if ((await contactLastName.count()) > 0) {
        await contactLastName.fill('Support');
        await page.waitForTimeout(200);
      }

      const contactPhone = page.locator('input[name*="phone"]');
      if ((await contactPhone.count()) > 0 && config.contact.phone) {
        await contactPhone.fill(config.contact.phone);
        await page.waitForTimeout(200);
      }

      const contactEmail = page.locator('input[name*="email"]');
      if ((await contactEmail.count()) > 0) {
        await contactEmail.fill(config.contact.email);
        await page.waitForTimeout(200);
      }

      // Save
      const saveButton = page.locator('button:has-text("Save")');
      if ((await saveButton.count()) > 0) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }

      console.log('App Review information saved');
      saveProgress(7, appId);
    }

    // Step 8: Add localizations
    if (START_STEP <= 8 && config.localizations) {
      logStep(8, 'Add localizations');

      const languages = Object.keys(config.localizations);
      console.log(`  Adding ${languages.length} localizations...`);

      for (const lang of languages) {
        // Skip default language as it's already configured
        if (lang === config.defaultLanguage) continue;

        console.log(`  Adding ${lang}...`);

        // Navigate to localizations
        await page.goto(`${BASE_URL}/apps/${appId}/appstore/localizations`);
        await page.waitForTimeout(2000);

        // Click "Add Language" or similar
        const addLangButton = page.locator(
          'button:has-text("Add"), button:has-text("Add Language")'
        );
        if ((await addLangButton.count()) > 0) {
          await addLangButton.click();
          await page.waitForTimeout(1000);

          // Select language from dropdown
          const langName = mapLanguageCode(lang);
          const langOption = page.locator(`text="${langName}"`).first();
          if ((await langOption.count()) > 0) {
            await langOption.click();
            await page.waitForTimeout(500);
          }

          // Confirm
          const confirmButton = page.locator('button:has-text("Add"), button:has-text("Confirm")');
          if ((await confirmButton.count()) > 0) {
            await confirmButton.click();
            await page.waitForTimeout(2000);
          }
        }

        // Fill localized content
        const localization = config.localizations[lang];

        // Description
        const descInput = page.locator('textarea[name*="description"]');
        if ((await descInput.count()) > 0 && localization.fullDescription) {
          await descInput.fill(localization.fullDescription);
          await page.waitForTimeout(300);
        }

        // Keywords
        const keywordsInput = page.locator('input[name*="keywords"]');
        if ((await keywordsInput.count()) > 0 && localization.keywords) {
          await keywordsInput.fill(localization.keywords);
          await page.waitForTimeout(300);
        }

        // Promotional text
        const promoInput = page.locator('textarea[name*="promotionalText"]');
        if ((await promoInput.count()) > 0 && localization.shortDescription) {
          await promoInput.fill(localization.shortDescription.substring(0, 170));
          await page.waitForTimeout(300);
        }

        // Save
        const saveButton = page.locator('button:has-text("Save")');
        if ((await saveButton.count()) > 0) {
          await saveButton.click();
          await page.waitForTimeout(1500);
        }
      }

      console.log('Localizations added');
      saveProgress(8, appId);
    }

    console.log('\n' + '='.repeat(60));
    console.log('SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\nApp ID: ${appId}`);
    console.log(`App Store Connect: ${BASE_URL}/apps/${appId}/appstore`);
    console.log('\nManual tasks remaining:');
    console.log('  - Upload app icon (1024x1024 PNG without alpha)');
    console.log('  - Upload screenshots for each device size:');
    console.log('    - iPhone 6.7" display (1290 x 2796 or 1284 x 2778)');
    console.log('    - iPhone 6.5" display (1242 x 2688 or 1284 x 2778)');
    console.log('    - iPhone 5.5" display (1242 x 2208)');
    console.log('    - iPad Pro 12.9" (2048 x 2732) - if supporting iPad');
    console.log('  - Upload build via Xcode or Transporter');
    console.log('  - Configure pricing and availability');
    console.log('  - Submit for review\n');
  } catch (error) {
    console.error('\nError during setup:', error);
    console.log(`\nCurrent URL: ${page.url()}`);
    console.log(`App ID so far: ${appId}`);

    // Log retry instructions
    console.log('\n' + '='.repeat(60));
    console.log('TO RETRY FROM LAST SAVED STEP:');
    console.log('='.repeat(60));
    const lastStep = config.stores.appStore.progress?.lastCompletedStep || 0;
    console.log(`Progress saved: Step ${lastStep} completed`);
    console.log(`\nRun again with: TENANT=${TENANT} node scripts/create-app-store-app.js`);
    console.log(`(Script will auto-resume from step ${lastStep + 1})`);
    if (appId) {
      console.log(
        `\nOr manually specify step: START_STEP=${lastStep + 1} RESUME_APP_ID=${appId} TENANT=${TENANT} node scripts/create-app-store-app.js`
      );
    }

    throw error;
  } finally {
    // Keep browser open for inspection
    console.log('\nBrowser will stay open. Close it manually when done.');
    await page.waitForTimeout(300000); // Wait 5 minutes before auto-close
    await context.close();
  }
}

main().catch(console.error);
