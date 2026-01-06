#!/usr/bin/env npx ts-node
/**
 * Playwright script to create and set up a new app in Google Play Console
 *
 * This script automates the entire app creation and setup process including:
 * - Creating the app
 * - Setting up privacy policy
 * - Configuring app access with test credentials
 * - Setting ads declaration
 * - Completing content rating questionnaire
 * - Setting target audience
 * - Configuring data safety
 * - Government apps declaration
 * - Financial features declaration
 * - Health apps declaration
 * - App category and contact details
 * - Store listing (text fields)
 *
 * Prerequisites:
 * - Close Chrome before running (script needs exclusive access to profile)
 * - You must be logged into Google Play Console in Chrome
 * - Ensure config file exists at scripts/play-store/config/tenants/{tenant}.json
 *
 * Usage:
 * TENANT=iron-oak npx ts-node scripts/create-play-store-app.ts
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { chromium, Page } from 'playwright';

// Configuration
const DEVELOPER_ID = process.env.DEVELOPER_ID || '5739281656511061086';
const TENANT = process.env.TENANT || 'evolve';

// Load tenant config
const configPath = path.join(__dirname, `play-store/config/tenants/${TENANT}.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const BASE_URL = `https://play.google.com/console/u/0/developers/${DEVELOPER_ID}`;

// Use a fresh profile directory (user will log in manually)
const userDataDir = path.join(os.tmpdir(), 'playwright-play-console');

// Helper function to save and wait for confirmation
async function saveAndWait(page: Page) {
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForSelector('text=Change saved', { timeout: 15000 });
  await page.waitForTimeout(1000);
}

// Helper to log step progress
function logStep(step: number, name: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Step ${step}: ${name}`);
  console.log('='.repeat(60));
}

async function main() {
  console.log(`\nCreating Play Store app: ${config.listing.title}`);
  console.log(`Tenant: ${TENANT}`);
  console.log(`Developer ID: ${DEVELOPER_ID}\n`);

  // Launch browser with fresh profile (user will log in manually)
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1400, height: 900 },
    slowMo: 300,
  });

  const page = await context.newPage();
  let appId = '';

  try {
    // Navigate to Play Console - user needs to log in
    console.log('\nNavigating to Google Play Console...');
    console.log('Please log in with your Google account when prompted.');
    console.log('The script will continue automatically once you reach the app list.\n');

    await page.goto(`${BASE_URL}/app-list`);

    // Wait for user to log in and reach the app list (up to 5 minutes)
    await page.waitForSelector('text=/apps/i', { timeout: 300000 });
    console.log('Login successful! Starting app creation...\n');

    // Step 1: Create new app
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

    // Step 2: Set privacy policy
    logStep(2, 'Set privacy policy');
    await page.goto(`${BASE_URL}/app/${appId}/app-content`);
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /Start.*Privacy policy/i }).click();
    await page.waitForTimeout(1000);
    await page
      .getByRole('textbox')
      .filter({ hasText: '' })
      .first()
      .fill(config.contact.privacyPolicyUrl);
    await saveAndWait(page);
    console.log('Privacy policy set');

    // Step 3: Configure app access
    logStep(3, 'Configure app access');
    await page.goto(`${BASE_URL}/app/${appId}/app-content/app-access`);
    await page.waitForTimeout(2000);

    if (config.appAccess?.restricted) {
      await page.getByRole('radio', { name: /All or some functionality is restricted/i }).click();
      await page.waitForTimeout(500);

      // Add test instructions
      await page.getByRole('button', { name: /Add new instructions/i }).click();
      await page.waitForTimeout(500);

      await page.getByRole('textbox', { name: /Name/i }).first().fill('Login required');
      await page
        .getByRole('textbox', { name: /Instructions/i })
        .fill(config.appAccess.instructions);

      // Add test credentials
      if (config.appAccess.testCredentials) {
        await page.getByRole('checkbox', { name: /login/i }).click();
        await page
          .getByRole('textbox', { name: /Username/i })
          .fill(config.appAccess.testCredentials.username);
        await page
          .getByRole('textbox', { name: /Password/i })
          .fill(config.appAccess.testCredentials.password);
      }

      await page.getByRole('button', { name: 'Apply' }).click();
      await page.waitForTimeout(1000);
    } else {
      await page.getByRole('radio', { name: /All functionality is available/i }).click();
    }

    await saveAndWait(page);
    console.log('App access configured');

    // Step 4: Configure ads
    logStep(4, 'Configure ads');
    await page.goto(`${BASE_URL}/app/${appId}/app-content/ads`);
    await page.waitForTimeout(2000);

    if (config.declarations?.containsAds) {
      await page.getByRole('radio', { name: /Yes.*contains ads/i }).click();
    } else {
      await page.getByRole('radio', { name: /No.*does not contain ads/i }).click();
    }

    await saveAndWait(page);
    console.log('Ads declaration set');

    // Step 5: Complete content rating
    logStep(5, 'Complete content rating');
    await page.goto(`${BASE_URL}/app/${appId}/app-content/rating-questionnaire`);
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /Start questionnaire/i }).click();
    await page.waitForTimeout(1000);

    // Email
    await page.getByRole('textbox', { name: /Email/i }).fill(config.contact.email);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);

    // Category - select Utility
    await page.getByRole('radio', { name: /Utility/i }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);

    // Answer all No for a clean utility app
    const noRadios = page.getByRole('radio', { name: 'No' });
    const count = await noRadios.count();
    for (let i = 0; i < count; i++) {
      await noRadios.nth(i).click();
      await page.waitForTimeout(200);
    }

    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(2000);
    console.log('Content rating completed');

    // Step 6: Set target audience
    logStep(6, 'Set target audience');
    await page.goto(`${BASE_URL}/app/${appId}/app-content/target-audience`);
    await page.waitForTimeout(2000);

    // Select age based on config
    const targetAge = config.targetAudience || '18 and over';
    await page.getByRole('checkbox', { name: new RegExp(targetAge, 'i') }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);
    await saveAndWait(page);
    console.log(`Target audience set: ${targetAge}`);

    // Step 7: Configure data safety
    logStep(7, 'Configure data safety');
    await page.goto(`${BASE_URL}/app/${appId}/app-content/data-privacy-security`);
    await page.waitForTimeout(2000);

    // Overview - Next
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);

    // Data collection
    if (config.dataSafety?.collectsData) {
      // Yes, collects data
      await page.getByRole('radio', { name: /Yes/i }).first().click();
      await page.waitForTimeout(500);

      // Encrypted in transit
      await page.getByRole('radio', { name: /Yes/i }).nth(1).click();
      await page.waitForTimeout(500);

      // Account deletion
      if (config.dataSafety.deleteAccountUrl) {
        await page.getByRole('radio', { name: /Yes.*delete/i }).click();
        await page.getByRole('textbox', { name: /URL/i }).fill(config.dataSafety.deleteAccountUrl);
      } else {
        await page.getByRole('radio', { name: /No.*cannot.*deleted/i }).click();
      }
    }

    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);

    // Data types
    await page.getByRole('checkbox', { name: /^Name$/i }).click();
    await page.getByRole('checkbox', { name: /Email address/i }).click();
    await page.getByRole('checkbox', { name: /Phone number/i }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);

    // Data usage for each type
    for (const dataType of ['Name', 'Email address', 'Phone number']) {
      console.log(`  Configuring ${dataType}...`);
      await page.getByRole('button', { name: new RegExp(`${dataType}`, 'i') }).click();
      await page.waitForTimeout(500);

      await page.getByRole('checkbox', { name: 'Collected' }).click();
      await page.getByRole('radio', { name: /No.*not processed ephemerally/i }).click();
      await page.getByRole('radio', { name: /required/i }).click();
      await page.getByRole('checkbox', { name: /App functionality/i }).click();
      await page.getByRole('checkbox', { name: /Account management/i }).click();

      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.waitForTimeout(1500);
    }

    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);
    await saveAndWait(page);
    console.log('Data safety configured');

    // Step 8: Government apps declaration
    logStep(8, 'Government apps declaration');
    await page.goto(`${BASE_URL}/app/${appId}/app-content/government-apps`);
    await page.waitForTimeout(2000);

    if (config.declarations?.isGovernmentApp) {
      await page.getByRole('radio', { name: 'Yes' }).click();
    } else {
      await page.getByRole('radio', { name: 'No' }).click();
    }

    await saveAndWait(page);
    console.log('Government apps declaration set');

    // Step 9: Financial features declaration
    logStep(9, 'Financial features declaration');
    await page.goto(`${BASE_URL}/app/${appId}/app-content/finance`);
    await page.waitForTimeout(2000);

    if (!config.declarations?.hasFinancialFeatures) {
      await page.getByRole('checkbox', { name: /doesn't provide any financial/i }).click();
    }

    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);
    await saveAndWait(page);
    console.log('Financial features declaration set');

    // Step 10: Health apps declaration
    logStep(10, 'Health apps declaration');
    await page.goto(`${BASE_URL}/app/${appId}/app-content/health`);
    await page.waitForTimeout(2000);

    if (!config.declarations?.hasHealthFeatures) {
      await page.getByRole('checkbox', { name: /does not have any health/i }).click();
    }

    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);
    await saveAndWait(page);
    console.log('Health apps declaration set');

    // Step 11: Set app category and contact details
    logStep(11, 'Set app category and contact details');
    await page.goto(`${BASE_URL}/app/${appId}/store-settings`);
    await page.waitForTimeout(2000);

    // Edit category
    await page
      .locator('text=App category')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: 'Edit' })
      .click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Select a category/i }).click();
    await page.getByRole('option', { name: config.appCategory }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForSelector('text=Change saved', { timeout: 5000 });
    await page.getByRole('button', { name: 'Close' }).click();
    await page.waitForTimeout(500);

    // Edit contact details
    await page
      .locator('text=Store Listing contact')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: 'Edit' })
      .click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox').first().fill(config.contact.email);
    await page
      .getByRole('textbox', { name: /https:\/\//i })
      .fill(config.contact.website.replace('https://', ''));
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForSelector('text=Change saved', { timeout: 5000 });
    console.log('App category and contacts set');

    // Step 12: Set up store listing
    logStep(12, 'Set up store listing');
    await page.goto(`${BASE_URL}/app/${appId}/main-store-listing`);
    await page.waitForTimeout(2000);

    await page.getByRole('textbox', { name: /Name of the app/i }).fill(config.listing.title);
    await page
      .getByRole('textbox', { name: /Short description/i })
      .fill(config.listing.shortDescription);
    await page
      .getByRole('textbox', { name: /Full description/i })
      .fill(config.listing.fullDescription);

    await page.getByRole('button', { name: /Save/i }).click();
    await page.waitForTimeout(2000);
    console.log('Store listing saved');

    console.log('\n' + '='.repeat(60));
    console.log('SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\nApp ID: ${appId}`);
    console.log(`Dashboard: ${BASE_URL}/app/${appId}/app-dashboard`);
    console.log('\nManual tasks remaining:');
    console.log('  - Upload app icon (512x512 PNG)');
    console.log('  - Upload feature graphic (1024x500 PNG)');
    console.log('  - Upload phone screenshots (2-8 images)');
    console.log('  - Upload AAB and create release\n');
  } catch (error) {
    console.error('\nError during setup:', error);
    console.log(`\nCurrent URL: ${page.url()}`);
    console.log(`App ID so far: ${appId}`);
    throw error;
  } finally {
    // Keep browser open for inspection
    console.log('\nBrowser will stay open. Close it manually when done.');
    await page.waitForTimeout(300000); // Wait 5 minutes before auto-close
    await context.close();
  }
}

main().catch(console.error);
