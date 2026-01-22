#!/usr/bin/env node
/**
 * Playwright script to create and set up a new app in Google Play Console
 *
 * Usage:
 * TENANT=iron-oak node scripts/create-play-store-app.js
 *
 * The script automatically saves progress to the tenant JSON file.
 * On retry, it will resume from the last completed step.
 *
 * Environment variables:
 * - TENANT: The tenant slug (required)
 * - DEVELOPER_ID: Google Play developer ID (optional, has default)
 * - RESUME_APP_ID: Override app ID to resume (optional, reads from JSON if not set)
 * - START_STEP: Override start step (optional, reads from JSON if not set)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

// Configuration
const DEVELOPER_ID = process.env.DEVELOPER_ID || '5739281656511061086';
const TENANT = process.env.TENANT || 'evolve';

// Load tenant config
const configPath = path.join(__dirname, `play-store/config/tenants/${TENANT}.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Ensure stores.playStore structure exists (backward compatibility)
if (!config.stores) {
  config.stores = {};
}
if (!config.stores.playStore) {
  config.stores.playStore = {
    appCategory: config.appCategory || 'Health & fitness',
    targetAudience: config.targetAudience || '18 and over',
    progress: config.playStoreProgress || { appId: null, lastCompletedStep: 0, lastUpdated: null },
  };
}

// Get store-specific config with fallback to root level for backward compatibility
const playStoreConfig = {
  appCategory: config.stores.playStore.appCategory || config.appCategory || 'Health & fitness',
  targetAudience: config.stores.playStore.targetAudience || config.targetAudience || '18 and over',
};

// Progress tracking - read from new structure or legacy location
const savedProgress = config.stores.playStore.progress || config.playStoreProgress || {};
const RESUME_APP_ID = process.env.RESUME_APP_ID || savedProgress.appId || '';
const START_STEP = parseInt(
  process.env.START_STEP ||
    (savedProgress.lastCompletedStep ? savedProgress.lastCompletedStep + 1 : 1).toString(),
  10
);

// Helper function to save progress to tenant JSON (new structure)
function saveProgress(step, appId) {
  config.stores.playStore.progress = {
    appId,
    lastCompletedStep: step,
    lastUpdated: new Date().toISOString(),
  };
  // Remove legacy location if it exists
  delete config.playStoreProgress;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`    Progress saved: Step ${step} completed`);
}

const BASE_URL = `https://play.google.com/console/u/0/developers/${DEVELOPER_ID}`;

// Use a fresh profile directory (user will log in manually)
const userDataDir = path.join(os.tmpdir(), 'playwright-play-console-v2');

// Helper function to save and wait for confirmation
async function saveAndWait(page) {
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForSelector('text=Change saved', { timeout: 15000 });
  await page.waitForTimeout(1000);
}

// Helper to log step progress
function logStep(step, name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Step ${step}: ${name}`);
  console.log('='.repeat(60));
}

// Navigate to app dashboard and click on a task button
async function navigateToTask(page, appId, taskPattern) {
  const dashboardUrl = `${BASE_URL}/app/${appId}/app-dashboard`;

  // Only navigate if not already on dashboard
  if (!page.url().includes('/app-dashboard')) {
    await page.goto(dashboardUrl);
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Ignore timeout, page might still be loading background resources
    }
    await page.waitForTimeout(2000);
  }

  // Click on the task button (these are the "Start" buttons in the task list)
  // Tasks are shown with button pattern like "Start Privacy policy" or just the task name
  const taskButton = page.getByRole('button', { name: taskPattern });

  if ((await taskButton.count()) > 0) {
    await taskButton.first().click();
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Ignore timeout
    }
    await page.waitForTimeout(2000);
    return true;
  }

  // Try clicking a link with the task name instead
  const taskLink = page.getByRole('link', { name: taskPattern });
  if ((await taskLink.count()) > 0) {
    await taskLink.first().click();
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Ignore timeout
    }
    await page.waitForTimeout(2000);
    return true;
  }

  // Fallback: try direct URL navigation
  return false;
}

async function main() {
  console.log(`\nPlay Store App Setup: ${config.listing.title}`);
  console.log(`Tenant: ${TENANT}`);
  console.log(`Developer ID: ${DEVELOPER_ID}`);
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

  // Set default timeout to 10 seconds instead of 30
  page.setDefaultTimeout(10000);

  let appId = RESUME_APP_ID;

  try {
    // Navigate to Play Console - user needs to log in
    console.log('\nNavigating to Google Play Console...');
    console.log('Please log in with your Google account when prompted.');
    console.log('The script will continue automatically once you reach the app list.\n');

    await page.goto(`${BASE_URL}/app-list`);

    // Wait for user to log in and reach the app list (up to 5 minutes)
    await page.waitForSelector('text=/apps/i', { timeout: 300000 });
    console.log('Login successful!\n');

    // Step 1: Create new app (or skip if resuming)
    if (START_STEP <= 1 && !RESUME_APP_ID) {
      logStep(1, 'Create new app');

      await page.getByRole('link', { name: 'Create app' }).click();
      await page.waitForSelector('text=Create app', { timeout: 10000 });

      // Fill app name
      await page.getByRole('textbox').first().fill(config.listing.title);

      // Select language if different from default
      if (config.defaultLanguage !== 'en-GB') {
        await page.getByRole('button', { name: /Choose default language|English/ }).click();
        await page.waitForTimeout(500);

        // Type to search for language
        const langCode = config.defaultLanguage.split('-')[0]; // 'de' from 'de-DE'
        await page
          .getByRole('option', { name: new RegExp(langCode, 'i') })
          .first()
          .click();
      }

      // Select App type and Free
      await page.getByRole('radio', { name: 'App' }).click();
      await page.getByRole('radio', { name: 'Free' }).click();

      // Accept policies
      await page.getByRole('checkbox', { name: /Developer Programme Policies/i }).click();
      await page.getByRole('checkbox', { name: /US export laws/i }).click();

      // Create app
      await page.getByRole('button', { name: 'Create app' }).click();
      await page.waitForURL(/\/app\/\d+\/app-dashboard/, { timeout: 30000 });

      // Extract app ID
      const url = page.url();
      const match = url.match(/\/app\/(\d+)\//);
      appId = match ? match[1] : '';
      console.log(`App created with ID: ${appId}`);
      saveProgress(1, appId);
    } else {
      console.log(`Using existing app ID: ${appId}`);
    }

    // Ensure we have an app ID
    if (!appId) {
      throw new Error('No app ID available. Please create an app first or provide RESUME_APP_ID.');
    }

    // Step 2: Set privacy policy
    if (START_STEP <= 2) {
      logStep(2, 'Set privacy policy');

      // Navigate via dashboard task button
      const navigated = await navigateToTask(page, appId, /privacy policy/i);
      if (!navigated) {
        // Fallback to direct URL
        await page.goto(`${BASE_URL}/app/${appId}/app-content/privacy-policy`);
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(2000);

      // Fill privacy policy URL in the textbox
      await page.getByRole('textbox').first().fill(config.contact.privacyPolicyUrl);
      await saveAndWait(page);
      console.log('Privacy policy set');
      saveProgress(2, appId);
    }

    // Step 3: Configure app access
    if (START_STEP <= 3) {
      logStep(3, 'Configure app access');

      // Navigate via dashboard task button
      const navigated = await navigateToTask(page, appId, /app access/i);
      if (!navigated) {
        await page.goto(`${BASE_URL}/app/${appId}/app-content/app-access`);
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(2000);

      if (config.appAccess?.restricted) {
        await page.getByRole('radio', { name: /All or some functionality.*restricted/i }).click();
        await page.waitForTimeout(500);

        // Add test instructions
        await page.getByRole('button', { name: 'Add instructions' }).click();
        await page.waitForTimeout(1000);

        // Fill instruction name
        await page
          .getByRole('group', { name: 'Instruction name' })
          .getByRole('textbox')
          .fill('Login required');

        // Add test credentials
        if (config.appAccess.testCredentials) {
          await page
            .getByRole('textbox', { name: /Username, email address or phone/i })
            .fill(config.appAccess.testCredentials.username);
          await page
            .getByRole('textbox', { name: 'Password' })
            .fill(config.appAccess.testCredentials.password);
        }

        // Check "No other information required"
        await page.getByRole('checkbox', { name: /No other information is required/i }).click();
        await page.waitForTimeout(500);

        // Click Add button in dialog
        await page.getByRole('button', { name: 'Add', exact: true }).click();
        await page.waitForTimeout(1000);
      } else {
        await page.getByRole('radio', { name: /All functionality.*available.*without/i }).click();
      }

      await saveAndWait(page);
      console.log('App access configured');
      saveProgress(3, appId);
    }

    // Step 4: Configure ads
    if (START_STEP <= 4) {
      logStep(4, 'Configure ads');

      // Navigate via dashboard task button
      const navigated = await navigateToTask(page, appId, /ads/i);
      if (!navigated) {
        await page.goto(`${BASE_URL}/app/${appId}/app-content/ads`);
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(2000);

      if (config.declarations?.containsAds) {
        await page.getByRole('radio', { name: /Yes.*contains ads/i }).click();
      } else {
        await page.getByRole('radio', { name: /No.*does not contain ads/i }).click();
      }

      await saveAndWait(page);
      console.log('Ads declaration set');
      saveProgress(4, appId);
    }

    // Step 5: Complete content rating
    if (START_STEP <= 5) {
      logStep(5, 'Complete content rating');

      // Navigate via dashboard task button
      const navigated = await navigateToTask(page, appId, /content rating/i);
      if (!navigated) {
        await page.goto(`${BASE_URL}/app/${appId}/app-content/content-rating-overview`);
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(2000);

      // Check if there's an incomplete questionnaire or need to start new
      const editButton = page.getByRole('button', { name: 'Edit' });
      const startButton = page.getByRole('button', { name: /Start.*questionnaire/i });

      if ((await editButton.count()) > 0) {
        await editButton.click();
      } else if ((await startButton.count()) > 0) {
        await startButton.click();
      }
      await page.waitForTimeout(2000);

      // Step 1: Category - fill email
      console.log('    Step 5.1: Filling category info...');
      await page
        .getByRole('group', { name: 'Email address' })
        .getByRole('textbox')
        .fill(config.contact.email);

      // Select "All other app types" for fitness/utility apps
      await page.getByRole('radio', { name: /All other app types/i }).click();

      // Accept terms
      await page.getByRole('checkbox', { name: /I agree to the Terms/i }).click();
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(3000);

      // Step 2: Questionnaire - Answer No to each question
      // The questions are displayed dynamically. Click all "No" radios that are visible.
      console.log('    Step 5.2: Answering questionnaire...');

      // Helper function to answer all visible No radios
      async function answerAllVisibleQuestions() {
        let answeredCount = 0;
        const maxAttempts = 20; // Safety limit

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          // Find all "No" radio buttons (they have label "No")
          const noRadios = page.getByRole('radio', { name: 'No' });
          const count = await noRadios.count();

          if (count === 0) {
            console.log(`    No more questions found after ${answeredCount} answers`);
            break;
          }

          let foundUnchecked = false;
          for (let i = 0; i < count; i++) {
            const radio = noRadios.nth(i);
            try {
              const isVisible = await radio.isVisible({ timeout: 1000 });
              if (!isVisible) continue;

              const isChecked = await radio.isChecked();
              if (!isChecked) {
                console.log(`    Answering question ${answeredCount + 1}...`);
                await radio.click();
                answeredCount++;
                foundUnchecked = true;
                // Wait for dynamic content to potentially load new questions
                await page.waitForTimeout(1500);
                break; // Re-check from beginning after answering
              }
            } catch (e) {
              // Radio might have become stale, continue
              continue;
            }
          }

          if (!foundUnchecked) {
            // All visible radios are checked or we're done
            console.log(`    All questions answered (${answeredCount} total)`);
            break;
          }
        }
        return answeredCount;
      }

      await answerAllVisibleQuestions();

      // Try to save and proceed - handle various button states
      console.log('    Step 5.3: Saving questionnaire...');

      // Wait a bit for the UI to stabilize
      await page.waitForTimeout(2000);

      // Try clicking Save button
      const saveButton = page.getByRole('button', { name: 'Save' });
      if ((await saveButton.count()) > 0 && (await saveButton.isEnabled())) {
        await saveButton.click();
        await page.waitForTimeout(3000);
      }

      // Try clicking Next button
      const nextButton = page.getByRole('button', { name: 'Next' });
      if ((await nextButton.count()) > 0) {
        try {
          await nextButton.click({ timeout: 5000 });
          await page.waitForTimeout(3000);
        } catch (e) {
          console.log('    Next button not clickable, trying Save first...');
        }
      }

      // Step 3: Summary - Save (may be multiple save buttons or summary page)
      console.log('    Step 5.4: Saving final summary...');
      await page.waitForTimeout(2000);

      // Try to find and click the final Save or Submit button
      const finalSave = page.getByRole('button', { name: 'Save' });
      const submitButton = page.getByRole('button', { name: /Submit/i });

      if ((await submitButton.count()) > 0 && (await submitButton.isEnabled())) {
        await submitButton.click();
      } else if ((await finalSave.count()) > 0 && (await finalSave.isEnabled())) {
        await finalSave.click();
      }

      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await page.waitForTimeout(2000);
      console.log('Content rating completed');
      saveProgress(5, appId);
    }

    // Step 6: Set target audience
    if (START_STEP <= 6) {
      logStep(6, 'Set target audience');

      // Navigate via dashboard task button
      const navigated = await navigateToTask(page, appId, /target audience/i);
      if (!navigated) {
        await page.goto(`${BASE_URL}/app/${appId}/app-content/target-audience-content`);
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(2000);

      // Select age checkboxes based on config
      // Config can be "13 and over", "16 and over", "18 and over", etc.
      const targetAge = playStoreConfig.targetAudience;
      const ageMatch = targetAge.match(/(\d+)/);
      const minAge = ageMatch ? parseInt(ageMatch[1]) : 18;

      // Select appropriate age checkboxes
      if (minAge <= 13) {
        await page.getByRole('checkbox', { name: '13-15' }).click();
        await page.waitForTimeout(300);
      }
      if (minAge <= 16) {
        await page.getByRole('checkbox', { name: '16-17' }).click();
        await page.waitForTimeout(300);
      }
      await page.getByRole('checkbox', { name: '18 and over' }).click();
      await page.waitForTimeout(500);

      // Click Next - wizard may skip to Summary for adult-only apps
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(2000);

      // Save on Summary page
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(2000);
      console.log(`Target audience set: ${targetAge}`);
      saveProgress(6, appId);
    }

    // Step 7: Configure data safety (5-step wizard)
    if (START_STEP <= 7) {
      logStep(7, 'Configure data safety');

      // Navigate via dashboard task button
      const navigated = await navigateToTask(page, appId, /data safety/i);
      if (!navigated) {
        await page.goto(`${BASE_URL}/app/${appId}/app-content/data-privacy-security`);
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(2000);

      // Step 1: Overview - click Next
      console.log('  Step 1: Overview');
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(2000);

      // Step 2: Data collection and security
      console.log('  Step 2: Data collection and security');
      if (config.dataSafety?.collectsData) {
        // "Does your app collect or share any of the required user data types?" - Yes
        await page.getByRole('radio', { name: 'Yes' }).first().click();
        await page.waitForTimeout(1000);

        // "Is all of the user data collected by your app encrypted in transit?" - Yes
        await page
          .getByRole('radiogroup', { name: 'Is all of the user data' })
          .getByLabel('Yes')
          .click();
        await page.waitForTimeout(500);

        // "Which of the following methods of account creation does your app support?" - Username and password
        await page.getByRole('checkbox', { name: 'Username and password' }).click();
        await page.waitForTimeout(500);

        // Fill delete account URL
        const deleteUrl =
          config.dataSafety.deleteAccountUrl || `${config.contact.website}/konto-loeschen`;
        await page.getByRole('textbox', { name: 'Delete account URL' }).fill(deleteUrl);
        await page.waitForTimeout(500);

        // "Do you provide a way for users to request that some or all of their data be deleted?" - No
        await page
          .getByRole('radiogroup', { name: 'Do you provide a way for' })
          .getByLabel('No', { exact: true })
          .click();
        await page.waitForTimeout(500);
      }

      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(2000);

      // If there are URL warnings, click Next again to proceed
      const urlWarning = page.locator('text=The URL that you entered returned a 404');
      if ((await urlWarning.count()) > 0) {
        console.log('    URL warning detected, clicking Next again...');
        await page.getByRole('button', { name: 'Next' }).click();
        await page.waitForTimeout(2000);
      }

      // Step 3: Data types - expand Personal info section and select types
      console.log('  Step 3: Data types');

      // Wait for page to fully load and verify we're on Step 3
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if Step 3 tab is selected - if not, we're still on Step 2
      const step3Tab = page.getByRole('tab', { name: /Step 3.*Data types/i });
      if ((await step3Tab.count()) > 0) {
        const isSelected = await step3Tab.getAttribute('aria-selected');
        if (isSelected !== 'true') {
          console.log('    Not on Step 3 yet, clicking Next again...');
          await page.getByRole('button', { name: 'Next' }).click();
          await page.waitForTimeout(2000);
        }
      }

      // Expand "Personal info" section using the exact button name
      console.log('    Expanding Personal info section...');
      const showPersonalInfoBtn = page.getByRole('button', { name: 'Show content: Personal info' });
      if ((await showPersonalInfoBtn.count()) > 0) {
        await showPersonalInfoBtn.click();
        await page.waitForTimeout(1500);
        console.log('    Expanded Personal info section');
      } else {
        console.log('    Personal info section may already be expanded or not found');
      }

      // Select the data type checkboxes - use exact names from the UI
      const dataTypesToSelect = [
        { name: 'Name More information', description: 'Name' },
        { name: 'Email address', description: 'Email address' },
        { name: 'Phone number', description: 'Phone number' },
      ];

      for (const dataType of dataTypesToSelect) {
        try {
          const checkbox = page.getByRole('checkbox', { name: dataType.name });
          if ((await checkbox.count()) > 0) {
            const isChecked = await checkbox.isChecked();
            if (!isChecked) {
              await checkbox.click();
              console.log(`    Selected: ${dataType.description}`);
              await page.waitForTimeout(500);
            } else {
              console.log(`    Already selected: ${dataType.description}`);
            }
          } else {
            console.log(`    Checkbox not found: ${dataType.description}`);
          }
        } catch (e) {
          console.log(`    Error with ${dataType.description}: ${e.message}`);
        }
      }

      // Click Next to proceed to Step 4
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(2000);

      // Step 4: Data usage and handling - configure each data type
      console.log('  Step 4: Data usage and handling');

      // Wait for page to fully load and verify we're on Step 4
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if Step 4 tab is selected
      const step4Tab = page.getByRole('tab', { name: /Step 4.*Data usage/i });
      if ((await step4Tab.count()) > 0) {
        const isSelected = await step4Tab.getAttribute('aria-selected');
        if (isSelected !== 'true') {
          console.log('    Not on Step 4 yet, waiting...');
          await page.waitForTimeout(2000);
        }
      }

      // Configure each data type by clicking "Open X questions" button
      // Note: Buttons are nested (button > button), so we use .nth(1) to get the inner clickable button
      const dataTypeButtons = [
        { buttonName: 'Open Name questions', description: 'Name' },
        { buttonName: 'Open Email address questions', description: 'Email address' },
        { buttonName: 'Open Phone number questions', description: 'Phone number' },
      ];

      for (const dataType of dataTypeButtons) {
        console.log(`    Configuring ${dataType.description}...`);

        try {
          // Click the inner button (nth(1) because buttons are nested)
          const openBtn = page.getByRole('button', { name: dataType.buttonName });
          if ((await openBtn.count()) >= 2) {
            await openBtn.nth(1).click();
          } else if ((await openBtn.count()) > 0) {
            await openBtn.first().click();
          } else {
            console.log(`    Button not found for: ${dataType.description}`);
            continue;
          }
          await page.waitForTimeout(1500);

          // Fill in the dialog
          // 1. Check "Collected" checkbox
          const collectedCheckbox = page.getByRole('checkbox', { name: /Collected This data is/i });
          if ((await collectedCheckbox.count()) > 0 && !(await collectedCheckbox.isChecked())) {
            await collectedCheckbox.click();
            await page.waitForTimeout(500);
          }

          // 2. Select "No, not processed ephemerally"
          const notEphemeralRadio = page.getByRole('radio', {
            name: /No, this collected data is not/i,
          });
          if ((await notEphemeralRadio.count()) > 0) {
            await notEphemeralRadio.click();
            await page.waitForTimeout(300);
          }

          // 3. Select "Data collection is required"
          const requiredRadio = page.getByRole('radio', { name: /Data collection is required/i });
          if ((await requiredRadio.count()) > 0) {
            await requiredRadio.click();
            await page.waitForTimeout(300);
          }

          // 4. Check "App functionality" purpose
          const appFuncCheckbox = page.getByRole('checkbox', {
            name: /App functionality Used for/i,
          });
          if ((await appFuncCheckbox.count()) > 0 && !(await appFuncCheckbox.isChecked())) {
            await appFuncCheckbox.click();
            await page.waitForTimeout(300);
          }

          // 5. Check "Account management" purpose
          const acctMgmtCheckbox = page.getByRole('checkbox', {
            name: /Account management Used for/i,
          });
          if ((await acctMgmtCheckbox.count()) > 0 && !(await acctMgmtCheckbox.isChecked())) {
            await acctMgmtCheckbox.click();
            await page.waitForTimeout(300);
          }

          // 6. Click Save button in dialog
          const saveBtn = page.getByRole('button', { name: 'Save', exact: true });
          if ((await saveBtn.count()) > 0 && (await saveBtn.isEnabled())) {
            await saveBtn.click();
            await page.waitForTimeout(1500);
            console.log(`      ${dataType.description} saved`);
          }
        } catch (e) {
          console.log(`    Error filling dialog for ${dataType.description}: ${e.message}`);
        }
      }

      // Wait for all dialogs to close
      await page.waitForTimeout(1000);

      // Check if Next is enabled
      const nextBtnStep4 = page.getByRole('button', { name: 'Next' });
      if (!(await nextBtnStep4.isEnabled())) {
        console.log('    WARNING: Next button is disabled - taking screenshot');
        await page.screenshot({ path: `/tmp/step4-datausage-${Date.now()}.png`, fullPage: true });
      }

      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(2000);

      // Step 5: Preview - Save
      console.log('  Step 5: Preview - saving');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.waitForSelector('text=Change saved', { timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log('Data safety configured');
      saveProgress(7, appId);
    }

    // Step 8: Government apps declaration
    if (START_STEP <= 8) {
      logStep(8, 'Government apps declaration');

      // Navigate via dashboard task button
      const navigated = await navigateToTask(page, appId, /government apps/i);
      if (!navigated) {
        await page.goto(`${BASE_URL}/app/${appId}/app-content/government-apps`);
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(2000);

      if (config.declarations?.isGovernmentApp) {
        await page.getByRole('radio', { name: 'Yes' }).click();
      } else {
        await page.getByRole('radio', { name: 'No' }).click();
      }

      await saveAndWait(page);
      console.log('Government apps declaration set');
      saveProgress(8, appId);
    }

    // Step 9: Financial features declaration (2-step wizard)
    if (START_STEP <= 9) {
      logStep(9, 'Financial features declaration');

      // Navigate via dashboard task button
      const navigated = await navigateToTask(page, appId, /financial features/i);
      if (!navigated) {
        await page.goto(`${BASE_URL}/app/${appId}/app-content/finance`);
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(2000);

      // Step 1: Select financial features
      if (!config.declarations?.hasFinancialFeatures) {
        await page
          .getByRole('checkbox', { name: "My app doesn't provide any financial features" })
          .click();
        await page.waitForTimeout(500);
      }

      // Click Next to go to Step 2
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(2000);

      // Step 2: Save
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.waitForSelector('text=Change saved', { timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log('Financial features declaration set');
      saveProgress(9, appId);
    }

    // Step 10: Health apps declaration (2-step wizard)
    if (START_STEP <= 10) {
      logStep(10, 'Health apps declaration');

      // Navigate via dashboard task button
      const navigated = await navigateToTask(page, appId, /health/i);
      if (!navigated) {
        await page.goto(`${BASE_URL}/app/${appId}/app-content/health`);
        try {
          await page.waitForLoadState('networkidle', { timeout: 15000 });
        } catch (e) {
          // Ignore timeout
        }
      }
      await page.waitForTimeout(2000);

      // Step 1: Select health features
      // For Health & Fitness category apps, select "Activity and fitness"
      const activityCheckbox = page.getByRole('checkbox', { name: 'Activity and fitness' });
      if ((await activityCheckbox.count()) > 0 && !(await activityCheckbox.isChecked())) {
        await activityCheckbox.click();
        await page.waitForTimeout(500);
      }

      // Click Next to go to Step 2 (Regional requirements)
      const nextBtn = page.getByRole('button', { name: 'Next' });
      if ((await nextBtn.count()) > 0 && (await nextBtn.isEnabled())) {
        await nextBtn.click();
        await page.waitForTimeout(2000);
      }

      // Step 2: Save (Regional requirements page - usually nothing to select)
      const saveBtn = page.getByRole('button', { name: 'Save', exact: true });
      if ((await saveBtn.count()) > 0 && (await saveBtn.isEnabled())) {
        await saveBtn.click();
        await page.waitForSelector('text=Change saved', { timeout: 15000 });
        await page.waitForTimeout(1000);
      }
      console.log('Health apps declaration set');
      saveProgress(10, appId);
    }

    // Step 11: Advertising ID declaration
    if (START_STEP <= 11) {
      logStep(11, 'Advertising ID declaration');

      // Navigate to advertising ID declaration page
      await page.goto(`${BASE_URL}/app/${appId}/app-content/ad-id-declaration`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Select whether app uses advertising ID
      const usesAds = config.declarations?.containsAds || false;
      const adIdRadio = page.getByRole('radio', { name: usesAds ? 'Yes' : 'No' });
      if ((await adIdRadio.count()) > 0 && !(await adIdRadio.isChecked())) {
        await adIdRadio.click();
        await page.waitForTimeout(500);
      }

      // Save (if enabled)
      const saveBtn = page.getByRole('button', { name: 'Save' });
      if ((await saveBtn.count()) > 0 && (await saveBtn.isEnabled())) {
        await saveBtn.click();
        await page.waitForSelector('text=Change saved', { timeout: 15000 });
        await page.waitForTimeout(1000);
      }
      console.log('Advertising ID declaration set');
      saveProgress(11, appId);
    }

    // Step 12: Set app category and contact details
    if (START_STEP <= 12) {
      logStep(12, 'Set app category and contact details');

      // Navigate directly to store-settings
      await page.goto(`${BASE_URL}/app/${appId}/store-settings`);
      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (e) {
        // Ignore timeout
      }
      await page.waitForTimeout(2000);

      // Check if category needs to be set
      const editButtons = page.getByRole('button', { name: 'Edit' });
      const categoryText = page.locator('group[aria-label="Category"] >> text=Select a category');
      const needsCategory = (await categoryText.count()) > 0;

      if (needsCategory && playStoreConfig.appCategory) {
        console.log('  Setting app category...');
        await editButtons.first().click();
        await page.waitForTimeout(1500);

        // Select category from dropdown
        const categoryDropdown = page
          .getByRole('dialog')
          .getByRole('button', { name: /Select a category/i });
        if ((await categoryDropdown.count()) > 0) {
          await categoryDropdown.click();
          await page.waitForTimeout(500);
          const categoryOption = page.getByRole('option', { name: playStoreConfig.appCategory });
          if ((await categoryOption.count()) > 0) {
            await categoryOption.click();
            await page.waitForTimeout(500);
          }
        }

        // Save if enabled
        const saveCategoryBtn = page.getByRole('dialog').getByRole('button', { name: 'Save' });
        if ((await saveCategoryBtn.count()) > 0 && (await saveCategoryBtn.isEnabled())) {
          await saveCategoryBtn.click();
          await page.waitForTimeout(3000); // Wait for save to complete
        }

        // Close dialog
        const closeCategoryBtn = page.getByRole('dialog').getByRole('button', { name: 'Close' });
        if ((await closeCategoryBtn.count()) > 0) {
          await closeCategoryBtn.click();
          await page.waitForTimeout(500);
        }
        console.log(`  Category set to: ${playStoreConfig.appCategory}`);
      } else {
        console.log('  Category already set, skipping...');
      }

      // Edit contact details - click the Edit button next to "Store Listing contact details"
      console.log('  Setting contact details...');
      const contactEditBtn = page
        .locator('console-header')
        .filter({ hasText: 'Store Listing contact' })
        .getByRole('button', { name: 'Edit' });
      if ((await contactEditBtn.count()) > 0) {
        await contactEditBtn.click();
      } else {
        // Fallback: click second Edit button
        await editButtons.nth(1).click();
      }
      await page.waitForTimeout(1500);

      // Fill email - first textbox in dialog
      const emailInput = page.getByRole('dialog').getByRole('textbox').first();
      if ((await emailInput.count()) > 0) {
        await emailInput.fill(config.contact.email);
        await page.waitForTimeout(300);
      }

      // Fill phone number - second textbox in dialog
      if (config.contact.phone) {
        const phoneInput = page.getByRole('dialog').getByRole('textbox').nth(1);
        if ((await phoneInput.count()) > 0) {
          await phoneInput.fill(config.contact.phone);
          await page.waitForTimeout(300);
        }
      }

      // Fill website - textbox with https:// label (third textbox)
      const websiteInput = page.getByRole('dialog').getByRole('textbox', { name: 'https://' });
      if ((await websiteInput.count()) > 0) {
        await websiteInput.fill(
          config.contact.website.replace('https://', '').replace('http://', '')
        );
        await page.waitForTimeout(300);
      }

      // Save contact details
      const saveContactBtn = page.getByRole('dialog').getByRole('button', { name: 'Save' });
      if ((await saveContactBtn.count()) > 0 && (await saveContactBtn.isEnabled())) {
        await saveContactBtn.click();
        await page.waitForTimeout(3000); // Wait for save to complete
      }

      // Close dialog
      const closeContactBtn = page.getByRole('dialog').getByRole('button', { name: 'Close' });
      if ((await closeContactBtn.count()) > 0) {
        await closeContactBtn.click();
        await page.waitForTimeout(500);
      }
      console.log('App category and contacts set');
      saveProgress(12, appId);
    }

    // Step 13: Set up store listing
    if (START_STEP <= 13) {
      logStep(13, 'Set up store listing');

      // Navigate to store-listings page first
      await page.goto(`${BASE_URL}/app/${appId}/store-listings`);
      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (e) {
        // Ignore timeout
      }
      await page.waitForTimeout(2000);

      // Check if we need to create the default store listing
      const createListingBtn = page.getByRole('button', { name: 'Create default store listing' });
      if ((await createListingBtn.count()) > 0) {
        console.log('  Creating default store listing...');
        await createListingBtn.click();
        try {
          await page.waitForLoadState('networkidle', { timeout: 15000 });
        } catch (e) {
          // Ignore timeout
        }
        await page.waitForTimeout(2000);
      } else {
        // Navigate directly to main-store-listing if already exists
        await page.goto(`${BASE_URL}/app/${appId}/main-store-listing`);
        try {
          await page.waitForLoadState('networkidle', { timeout: 15000 });
        } catch (e) {
          // Ignore timeout
        }
        await page.waitForTimeout(2000);
      }

      // Fill app name
      const appNameInput = page.getByRole('textbox', { name: /Name of the app/i });
      if ((await appNameInput.count()) > 0) {
        await appNameInput.fill(config.listing.title);
        await page.waitForTimeout(300);
      }

      // Fill short description
      const shortDescInput = page.getByRole('textbox', { name: /Short description/i });
      if ((await shortDescInput.count()) > 0) {
        await shortDescInput.fill(config.listing.shortDescription);
        await page.waitForTimeout(300);
      }

      // Fill full description
      const fullDescInput = page.getByRole('textbox', { name: /Full description/i });
      if ((await fullDescInput.count()) > 0) {
        await fullDescInput.fill(config.listing.fullDescription);
        await page.waitForTimeout(300);
      }

      // Save as draft (doesn't require graphics to be uploaded)
      const saveAsDraftBtn = page.getByRole('button', { name: 'Save as draft' });
      const saveBtn = page.getByRole('button', { name: 'Save', exact: true });

      if ((await saveAsDraftBtn.count()) > 0 && (await saveAsDraftBtn.isEnabled())) {
        await saveAsDraftBtn.click();
        console.log('  Saved as draft');
      } else if ((await saveBtn.count()) > 0 && (await saveBtn.isEnabled())) {
        await saveBtn.click();
        console.log('  Saved');
      }

      await page.waitForTimeout(2000);
      console.log('Store listing saved');
      saveProgress(13, appId);
    }

    // Step 14: Upload app icon
    if (START_STEP <= 14 && config.assets?.icon) {
      logStep(14, 'Upload app icon');

      // Navigate to main-store-listing page
      await page.goto(`${BASE_URL}/app/${appId}/main-store-listing`);
      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (e) {
        // Ignore timeout
      }
      await page.waitForTimeout(2000);

      // Check if App icon field already has an icon
      const appIconSection = page.locator('group[aria-label="App icon"]');
      const existingIcon = appIconSection.locator('img[alt="App icon"]');

      if ((await existingIcon.count()) > 0) {
        console.log('  App icon already uploaded, skipping...');
      } else {
        // Click "Add assets" button for App icon
        console.log('  Opening assets panel for App icon...');
        const addAssetsBtn = appIconSection.getByRole('button', { name: 'Add assets' });
        if ((await addAssetsBtn.count()) > 0) {
          await addAssetsBtn.click();
          await page.waitForTimeout(2000);
        }

        // Click "Upload" button in side panel
        console.log('  Uploading icon file...');
        const uploadBtn = page.getByRole('button', { name: 'Upload' });
        if ((await uploadBtn.count()) > 0) {
          // Set up file chooser handler before clicking upload
          const fileChooserPromise = page.waitForEvent('filechooser');
          await uploadBtn.click();

          const fileChooser = await fileChooserPromise;
          const iconPath = path.join(__dirname, 'play-store/config', config.assets.icon);
          await fileChooser.setFiles(iconPath);
          await page.waitForTimeout(3000);
          console.log(`  Uploaded: ${config.assets.icon}`);
        }

        // Wait for upload to complete and asset to appear in list
        await page.waitForTimeout(2000);

        // Check if icon needs cropping (if it's larger than 512x512)
        // Click on the uploaded asset to select it
        const assetRow = page.locator('listitem[aria-label="Asset row"]').first();
        if ((await assetRow.count()) > 0) {
          await assetRow.click();
          await page.waitForTimeout(1000);

          // Check if "Crop" button is available (needed if icon is not 512x512)
          const cropBtn = page.getByRole('button', { name: 'Crop' });
          if ((await cropBtn.count()) > 0) {
            console.log('  Cropping icon to 512x512...');
            await cropBtn.click();
            await page.waitForTimeout(1500);

            // Click "App icon" preset in crop dialog
            const appIconPreset = page.getByRole('button', { name: 'App icon' });
            if ((await appIconPreset.count()) > 0) {
              await appIconPreset.click();
              await page.waitForTimeout(500);
            }

            // Click "Save as copy" to create cropped version
            const saveAsCopyBtn = page.getByRole('button', { name: 'Save as copy' });
            if ((await saveAsCopyBtn.count()) > 0) {
              await saveAsCopyBtn.click();
              await page.waitForTimeout(2000);
              console.log('  Created cropped 512x512 version');
            }
          }

          // Click "Add" button to apply selected asset to form
          const addBtn = page.getByRole('button', { name: 'Add', exact: true });
          if ((await addBtn.count()) > 0) {
            await addBtn.click();
            await page.waitForTimeout(1500);
            console.log('  Applied icon to App icon field');
          }
        }

        // Close side panel
        const closePanelBtn = page.getByRole('button', { name: 'Close side panel' });
        if ((await closePanelBtn.count()) > 0) {
          await closePanelBtn.click();
          await page.waitForTimeout(500);
        }

        // Save as draft
        const saveAsDraftBtn = page.getByRole('button', { name: 'Save as draft' });
        if ((await saveAsDraftBtn.count()) > 0 && (await saveAsDraftBtn.isEnabled())) {
          await saveAsDraftBtn.click();
          await page.waitForTimeout(2000);
        }
      }

      console.log('App icon uploaded');
      saveProgress(14, appId);
    }

    console.log('\n' + '='.repeat(60));
    console.log('SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\nApp ID: ${appId}`);
    console.log(`Dashboard: ${BASE_URL}/app/${appId}/app-dashboard`);
    console.log('\nManual tasks remaining:');
    console.log('  - Upload feature graphic (1024x500 PNG)');
    console.log('  - Upload phone screenshots (2-8 images)');
    console.log('  - Upload AAB and create release\n');
  } catch (error) {
    console.error('\nError during setup:', error);
    console.log(`\nCurrent URL: ${page.url()}`);
    console.log(`App ID so far: ${appId}`);

    // Log retry instructions
    console.log('\n' + '='.repeat(60));
    console.log('TO RETRY FROM LAST SAVED STEP:');
    console.log('='.repeat(60));
    const lastStep = config.stores?.playStore?.progress?.lastCompletedStep || 0;
    console.log(`Progress saved: Step ${lastStep} completed`);
    console.log(`\nRun again with: TENANT=${TENANT} node scripts/create-play-store-app.js`);
    console.log(`(Script will auto-resume from step ${lastStep + 1})`);
    if (appId) {
      console.log(
        `\nOr manually specify step: START_STEP=${lastStep + 1} RESUME_APP_ID=${appId} TENANT=${TENANT} node scripts/create-play-store-app.js`
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
