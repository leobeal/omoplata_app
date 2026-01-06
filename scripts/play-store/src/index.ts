#!/usr/bin/env npx ts-node

/**
 * Play Store Automation CLI
 *
 * Usage:
 *   npx ts-node scripts/play-store/src/index.ts login
 *   npx ts-node scripts/play-store/src/index.ts create --config evolve-new
 *   npx ts-node scripts/play-store/src/index.ts update --tenant evolve
 *   npx ts-node scripts/play-store/src/index.ts update --all
 */

import * as fs from 'fs';
import * as path from 'path';
import { PlayStoreAutomation } from './PlayStoreAutomation';
import { AppCreationAutomation } from './AppCreationAutomation';
import { TenantConfig, UpdateOptions, UpdateSection } from './types';
import { AppCreationConfig } from './types/app-creation';

// Configuration
const BASE_DIR = path.resolve(__dirname, '..');
const CONFIG_DIR = path.join(BASE_DIR, 'config');
const TENANTS_DIR = path.join(CONFIG_DIR, 'tenants');
const APPS_DIR = path.join(CONFIG_DIR, 'apps');

// Load from environment or use defaults
const DEVELOPER_ID = process.env.PLAY_CONSOLE_DEVELOPER_ID || '';
const GOOGLE_EMAIL = process.env.GOOGLE_EMAIL || '';
const GOOGLE_PASSWORD = process.env.GOOGLE_PASSWORD || '';

interface CliArgs {
  command: 'login' | 'create' | 'update' | 'screenshot' | 'validate' | 'help';
  tenant?: string;
  config?: string;
  all?: boolean;
  only?: UpdateSection[];
  dryRun?: boolean;
  headless?: boolean;
  verbose?: boolean;
  delay?: number;
  pauseOnError?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CliArgs {
  const command = (args[0] as CliArgs['command']) || 'help';

  const parsed: CliArgs = {
    command,
    all: args.includes('--all'),
    dryRun: args.includes('--dry-run'),
    headless: args.includes('--headless'),
    verbose: args.includes('--verbose'),
    pauseOnError: args.includes('--pause-on-error'),
  };

  // Parse --tenant
  const tenantIndex = args.indexOf('--tenant');
  if (tenantIndex !== -1 && args[tenantIndex + 1]) {
    parsed.tenant = args[tenantIndex + 1];
  }

  // Parse --config
  const configIndex = args.indexOf('--config');
  if (configIndex !== -1 && args[configIndex + 1]) {
    parsed.config = args[configIndex + 1];
  }

  // Parse --only
  const onlyIndex = args.indexOf('--only');
  if (onlyIndex !== -1 && args[onlyIndex + 1]) {
    parsed.only = args[onlyIndex + 1].split(',') as UpdateSection[];
  }

  // Parse --delay
  const delayIndex = args.indexOf('--delay');
  if (delayIndex !== -1 && args[delayIndex + 1]) {
    parsed.delay = parseInt(args[delayIndex + 1], 10);
  }

  return parsed;
}

/**
 * Load tenant configuration from JSON file
 */
function loadTenantConfig(tenantName: string): TenantConfig {
  const configPath = path.join(TENANTS_DIR, `${tenantName}.json`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Tenant config not found: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content) as TenantConfig;
}

/**
 * Load app creation configuration from JSON file
 */
function loadAppCreationConfig(configName: string): AppCreationConfig {
  const configPath = path.join(APPS_DIR, `${configName}.json`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`App creation config not found: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content) as AppCreationConfig;
}

/**
 * Get all available tenant names
 */
function getAllTenants(): string[] {
  if (!fs.existsSync(TENANTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(TENANTS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace('.json', ''));
}

/**
 * Get all available app creation configs
 */
function getAllAppConfigs(): string[] {
  if (!fs.existsSync(APPS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(APPS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace('.json', ''));
}

/**
 * Validate tenant configuration
 */
function validateConfig(config: TenantConfig): string[] {
  const errors: string[] = [];

  if (!config.packageName) {
    errors.push('Missing required field: packageName');
  }

  if (!config.defaultLanguage) {
    errors.push('Missing required field: defaultLanguage');
  }

  if (!config.listing?.title) {
    errors.push('Missing required field: listing.title');
  }

  if (config.listing?.title && config.listing.title.length > 30) {
    errors.push(`Title exceeds 30 characters: ${config.listing.title.length}`);
  }

  if (config.listing?.shortDescription && config.listing.shortDescription.length > 80) {
    errors.push(`Short description exceeds 80 characters: ${config.listing.shortDescription.length}`);
  }

  if (config.listing?.fullDescription && config.listing.fullDescription.length > 4000) {
    errors.push(`Full description exceeds 4000 characters: ${config.listing.fullDescription.length}`);
  }

  if (!config.contact?.email) {
    errors.push('Missing required field: contact.email');
  }

  // Validate asset files exist
  if (config.assets?.icon && !fs.existsSync(path.join(BASE_DIR, config.assets.icon))) {
    errors.push(`Icon file not found: ${config.assets.icon}`);
  }

  if (
    config.assets?.featureGraphic &&
    !fs.existsSync(path.join(BASE_DIR, config.assets.featureGraphic))
  ) {
    errors.push(`Feature graphic not found: ${config.assets.featureGraphic}`);
  }

  if (config.assets?.screenshots?.phone) {
    for (const screenshot of config.assets.screenshots.phone) {
      if (!fs.existsSync(path.join(BASE_DIR, screenshot))) {
        errors.push(`Screenshot not found: ${screenshot}`);
      }
    }
  }

  return errors;
}

/**
 * Validate app creation configuration
 */
function validateAppCreationConfig(config: AppCreationConfig): string[] {
  const errors: string[] = [];

  // Basic info
  if (!config.basicInfo?.name) {
    errors.push('Missing required field: basicInfo.name');
  }
  if (config.basicInfo?.name && config.basicInfo.name.length > 30) {
    errors.push(`App name exceeds 30 characters: ${config.basicInfo.name.length}`);
  }
  if (!config.basicInfo?.defaultLanguage) {
    errors.push('Missing required field: basicInfo.defaultLanguage');
  }

  // Content rating
  if (!config.contentRating?.email) {
    errors.push('Missing required field: contentRating.email');
  }

  // Data safety
  if (config.dataSafety === undefined) {
    errors.push('Missing required section: dataSafety');
  }

  // Target audience
  if (!config.targetAudience?.ageGroups?.length) {
    errors.push('Missing required field: targetAudience.ageGroups');
  }

  // Category and contact
  if (!config.categoryAndContact?.category) {
    errors.push('Missing required field: categoryAndContact.category');
  }
  if (!config.categoryAndContact?.contact?.email) {
    errors.push('Missing required field: categoryAndContact.contact.email');
  }
  if (!config.categoryAndContact?.privacyPolicyUrl) {
    errors.push('Missing required field: categoryAndContact.privacyPolicyUrl');
  }

  // Store listing
  if (!config.storeListing?.title) {
    errors.push('Missing required field: storeListing.title');
  }
  if (!config.storeListing?.shortDescription) {
    errors.push('Missing required field: storeListing.shortDescription');
  }
  if (!config.storeListing?.fullDescription) {
    errors.push('Missing required field: storeListing.fullDescription');
  }

  // Assets
  if (!config.assets?.icon) {
    errors.push('Missing required field: assets.icon');
  }
  if (!config.assets?.featureGraphic) {
    errors.push('Missing required field: assets.featureGraphic');
  }
  if (!config.assets?.phoneScreenshots?.length || config.assets.phoneScreenshots.length < 2) {
    errors.push('At least 2 phone screenshots required: assets.phoneScreenshots');
  }

  // Validate asset files exist
  if (config.assets?.icon && !fs.existsSync(path.join(BASE_DIR, config.assets.icon))) {
    errors.push(`Icon file not found: ${config.assets.icon}`);
  }
  if (
    config.assets?.featureGraphic &&
    !fs.existsSync(path.join(BASE_DIR, config.assets.featureGraphic))
  ) {
    errors.push(`Feature graphic not found: ${config.assets.featureGraphic}`);
  }
  if (config.assets?.phoneScreenshots) {
    for (const screenshot of config.assets.phoneScreenshots) {
      if (!fs.existsSync(path.join(BASE_DIR, screenshot))) {
        errors.push(`Screenshot not found: ${screenshot}`);
      }
    }
  }

  return errors;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Play Store Automation CLI

Usage:
  npx ts-node scripts/play-store/src/index.ts <command> [options]

Commands:
  login        Authenticate with Google and save session
  create       Create a new app with all questionnaires
  update       Update existing app metadata
  screenshot   Take screenshots of current store listing
  validate     Validate configuration files
  help         Show this help message

Options:
  --config <name>    App creation config name (for create command)
  --tenant <name>    Target specific tenant (for update command)
  --all              Process all configs/tenants
  --only <sections>  Update only specific sections (comma-separated)
                     Sections: listing,screenshots,graphics,contact,localizations
  --dry-run          Preview changes without applying
  --headless         Run browser in headless mode
  --verbose          Enable verbose logging
  --delay <ms>       Delay between operations (milliseconds)
  --pause-on-error   Pause for debugging on error

Examples:
  # Login and save session (required first step)
  npx ts-node scripts/play-store/src/index.ts login

  # Create a new app
  npx ts-node scripts/play-store/src/index.ts create --config evolve-new

  # Create with dry run
  npx ts-node scripts/play-store/src/index.ts create --config evolve-new --dry-run

  # Update existing app metadata
  npx ts-node scripts/play-store/src/index.ts update --tenant evolve

  # Update all tenants
  npx ts-node scripts/play-store/src/index.ts update --all

  # Update only screenshots
  npx ts-node scripts/play-store/src/index.ts update --tenant evolve --only screenshots

  # Validate app creation config
  npx ts-node scripts/play-store/src/index.ts validate --config evolve-new

Environment Variables:
  PLAY_CONSOLE_DEVELOPER_ID   Your Play Console developer ID
  GOOGLE_EMAIL               Google account email (for login)
  GOOGLE_PASSWORD            Google account password (for login)

Configuration Files:
  config/apps/{name}.json      App creation configurations
  config/tenants/{name}.json   Existing app update configurations
  config/auth.json             Saved browser session (auto-generated)
`);
}

/**
 * Login command handler
 */
async function handleLogin(): Promise<void> {
  if (!GOOGLE_EMAIL || !GOOGLE_PASSWORD) {
    console.error('❌ GOOGLE_EMAIL and GOOGLE_PASSWORD environment variables required');
    console.log('Set them in your .env file or export them:');
    console.log('  export GOOGLE_EMAIL=your@email.com');
    console.log('  export GOOGLE_PASSWORD=yourpassword');
    process.exit(1);
  }

  const automation = new PlayStoreAutomation(DEVELOPER_ID, { headless: false });

  try {
    await automation.init();
    await automation.login(GOOGLE_EMAIL, GOOGLE_PASSWORD);
    console.log('\n✅ Login successful! Session saved to config/auth.json');
  } catch (error) {
    console.error('❌ Login failed:', error);
    process.exit(1);
  } finally {
    await automation.close();
  }
}

/**
 * Create command handler - creates new app with questionnaires
 */
async function handleCreate(args: CliArgs): Promise<void> {
  if (!DEVELOPER_ID) {
    console.error('❌ PLAY_CONSOLE_DEVELOPER_ID environment variable required');
    process.exit(1);
  }

  // Determine which configs to process
  let configs: string[];

  if (args.all) {
    configs = getAllAppConfigs();
    if (configs.length === 0) {
      console.error('❌ No app creation configurations found in config/apps/');
      process.exit(1);
    }
  } else if (args.config) {
    configs = [args.config];
  } else {
    console.error('❌ Specify --config <name> or --all');
    console.log('\nAvailable configs:');
    const available = getAllAppConfigs();
    if (available.length === 0) {
      console.log('  (none) - Create a config in config/apps/');
    } else {
      available.forEach((c) => console.log(`  - ${c}`));
    }
    process.exit(1);
  }

  console.log(`\n🚀 Creating ${configs.length} app(s)\n`);

  const automation = new AppCreationAutomation(DEVELOPER_ID, {
    dryRun: args.dryRun,
    headless: args.headless,
    verbose: args.verbose,
    pauseOnError: args.pauseOnError,
  });

  try {
    await automation.init();

    const results = [];

    for (const configName of configs) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📱 Creating app from config: ${configName}`);
      console.log('='.repeat(60));

      try {
        const config = loadAppCreationConfig(configName);

        // Validate config first
        const validationErrors = validateAppCreationConfig(config);
        if (validationErrors.length > 0) {
          console.error('\n❌ Configuration errors:');
          validationErrors.forEach((err) => console.error(`   - ${err}`));
          results.push({ config: configName, success: false, errors: validationErrors });
          continue;
        }

        const result = await automation.createApp(config);
        results.push({ config: configName, ...result });

        if (args.delay && configs.indexOf(configName) < configs.length - 1) {
          console.log(`\n⏳ Waiting ${args.delay}ms before next app...`);
          await new Promise((resolve) => setTimeout(resolve, args.delay));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`\n❌ Failed to create app from ${configName}: ${message}`);
        results.push({ config: configName, success: false, errors: [message] });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed apps:');
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.config}: ${r.errors?.join(', ')}`);
        });
    }

    // Print progress for each app
    console.log('\nProgress by app:');
    results.forEach((r) => {
      if ('progress' in r && r.progress) {
        const p = r.progress;
        console.log(`\n  ${r.config}:`);
        console.log(`    ${p.appCreated ? '✅' : '❌'} App created`);
        console.log(`    ${p.storeListingComplete ? '✅' : '❌'} Store listing`);
        console.log(`    ${p.assetsUploaded ? '✅' : '❌'} Assets uploaded`);
        console.log(`    ${p.contentRatingComplete ? '✅' : '❌'} Content rating`);
        console.log(`    ${p.dataSafetyComplete ? '✅' : '❌'} Data safety`);
        console.log(`    ${p.targetAudienceComplete ? '✅' : '❌'} Target audience`);
        console.log(`    ${p.adsDeclarationComplete ? '✅' : '❌'} Ads declaration`);
        console.log(`    ${p.categoryComplete ? '✅' : '❌'} Category & contact`);
        console.log(`    ${p.readyForReview ? '✅' : '⏳'} Ready for review`);
      }
    });
  } finally {
    await automation.close();
  }
}

/**
 * Update command handler
 */
async function handleUpdate(args: CliArgs): Promise<void> {
  if (!DEVELOPER_ID) {
    console.error('❌ PLAY_CONSOLE_DEVELOPER_ID environment variable required');
    process.exit(1);
  }

  // Determine which tenants to update
  let tenants: string[];

  if (args.all) {
    tenants = getAllTenants();
    if (tenants.length === 0) {
      console.error('❌ No tenant configurations found in config/tenants/');
      process.exit(1);
    }
  } else if (args.tenant) {
    tenants = [args.tenant];
  } else {
    console.error('❌ Specify --tenant <name> or --all');
    process.exit(1);
  }

  console.log(`\n📱 Updating ${tenants.length} tenant(s): ${tenants.join(', ')}\n`);

  const options: UpdateOptions = {
    only: args.only,
    dryRun: args.dryRun,
    headless: args.headless,
    verbose: args.verbose,
    delay: args.delay,
  };

  const automation = new PlayStoreAutomation(DEVELOPER_ID, options);

  try {
    await automation.init();

    // Verify session
    const sessionValid = await automation.verifySession();
    if (!sessionValid) {
      console.error('❌ Session expired. Run "login" command first.');
      process.exit(1);
    }

    const results = [];

    for (const tenantName of tenants) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📦 Processing: ${tenantName}`);
      console.log('='.repeat(50));

      try {
        const config = loadTenantConfig(tenantName);

        // Validate config first
        const validationErrors = validateConfig(config);
        if (validationErrors.length > 0) {
          console.error('❌ Configuration errors:');
          validationErrors.forEach((err) => console.error(`   - ${err}`));
          results.push({ tenant: tenantName, success: false, errors: validationErrors });
          continue;
        }

        const result = await automation.updateTenant(config);
        results.push(result);

        if (args.delay && tenants.indexOf(tenantName) < tenants.length - 1) {
          console.log(`⏳ Waiting ${args.delay}ms before next tenant...`);
          await new Promise((resolve) => setTimeout(resolve, args.delay));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to update ${tenantName}: ${message}`);
        results.push({ tenant: tenantName, success: false, errors: [message] });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary');
    console.log('='.repeat(50));

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed tenants:');
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.tenant}: ${r.errors?.join(', ')}`);
        });
    }
  } finally {
    await automation.close();
  }
}

/**
 * Screenshot command handler
 */
async function handleScreenshot(args: CliArgs): Promise<void> {
  if (!DEVELOPER_ID) {
    console.error('❌ PLAY_CONSOLE_DEVELOPER_ID environment variable required');
    process.exit(1);
  }

  const tenants = args.all ? getAllTenants() : args.tenant ? [args.tenant] : [];

  if (tenants.length === 0) {
    console.error('❌ Specify --tenant <name> or --all');
    process.exit(1);
  }

  const automation = new PlayStoreAutomation(DEVELOPER_ID, { headless: args.headless });

  try {
    await automation.init();

    for (const tenantName of tenants) {
      const config = loadTenantConfig(tenantName);
      await automation.screenshotListing(config.packageName);
    }
  } finally {
    await automation.close();
  }
}

/**
 * Validate command handler
 */
async function handleValidate(args: CliArgs): Promise<void> {
  // Check what to validate
  const isAppConfig = args.config !== undefined;
  const isTenantConfig = args.tenant !== undefined;

  if (!isAppConfig && !isTenantConfig && !args.all) {
    console.error('❌ Specify --config <name>, --tenant <name>, or --all');
    process.exit(1);
  }

  let hasErrors = false;

  // Validate app creation configs
  if (isAppConfig || args.all) {
    const configs = args.all ? getAllAppConfigs() : args.config ? [args.config] : [];

    if (configs.length > 0) {
      console.log('\n🔍 Validating app creation configs:\n');

      for (const configName of configs) {
        console.log(`📦 ${configName}:`);

        try {
          const config = loadAppCreationConfig(configName);
          const errors = validateAppCreationConfig(config);

          if (errors.length === 0) {
            console.log('   ✅ Valid\n');
          } else {
            hasErrors = true;
            errors.forEach((err) => console.log(`   ❌ ${err}`));
            console.log('');
          }
        } catch (error) {
          hasErrors = true;
          console.log(`   ❌ Failed to load config: ${error}\n`);
        }
      }
    }
  }

  // Validate tenant configs
  if (isTenantConfig || args.all) {
    const tenants = args.all ? getAllTenants() : args.tenant ? [args.tenant] : [];

    if (tenants.length > 0) {
      console.log('\n🔍 Validating tenant configs:\n');

      for (const tenantName of tenants) {
        console.log(`📦 ${tenantName}:`);

        try {
          const config = loadTenantConfig(tenantName);
          const errors = validateConfig(config);

          if (errors.length === 0) {
            console.log('   ✅ Valid\n');
          } else {
            hasErrors = true;
            errors.forEach((err) => console.log(`   ❌ ${err}`));
            console.log('');
          }
        } catch (error) {
          hasErrors = true;
          console.log(`   ❌ Failed to load config: ${error}\n`);
        }
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log('✅ All configurations valid!');
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Ensure config directories exist
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(TENANTS_DIR)) {
    fs.mkdirSync(TENANTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(APPS_DIR)) {
    fs.mkdirSync(APPS_DIR, { recursive: true });
  }

  switch (args.command) {
    case 'login':
      await handleLogin();
      break;

    case 'create':
      await handleCreate(args);
      break;

    case 'update':
      await handleUpdate(args);
      break;

    case 'screenshot':
      await handleScreenshot(args);
      break;

    case 'validate':
      await handleValidate(args);
      break;

    case 'help':
    default:
      printHelp();
      break;
  }
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
