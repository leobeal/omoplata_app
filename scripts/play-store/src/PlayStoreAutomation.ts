/**
 * Play Store Metadata Automation
 *
 * Playwright-based automation for updating Google Play Store listings.
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { Selectors, Timeouts, URLs } from './selectors';
import {
  TenantConfig,
  UpdateOptions,
  UpdateSection,
  AutomationResult,
  ExecutionLog,
} from './types';

export class PlayStoreAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private logs: ExecutionLog[] = [];
  private options: UpdateOptions;
  private developerId: string;
  private baseDir: string;

  constructor(developerId: string, options: UpdateOptions = {}) {
    this.developerId = developerId;
    this.options = {
      headless: false,
      slowMo: 100,
      verbose: false,
      ...options,
    };
    this.baseDir = path.resolve(__dirname, '..');
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize browser with optional saved auth session
   */
  async init(authStatePath?: string): Promise<void> {
    const authPath = authStatePath || path.join(this.baseDir, 'config', 'auth.json');
    const hasAuth = fs.existsSync(authPath);

    this.browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
    });

    this.context = await this.browser.newContext({
      storageState: hasAuth ? authPath : undefined,
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    this.page = await this.context.newPage();

    // Set up error handling
    this.page.on('pageerror', (error) => {
      this.log('system', 'page-error', 'failure', error.message);
    });

    this.logVerbose('Browser initialized');
  }

  /**
   * Close browser and cleanup
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  /**
   * Login to Google account and save session
   */
  async login(email: string, password: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('🔐 Starting login process...');

    await this.page.goto(URLs.googleLogin);
    await this.page.waitForLoadState('networkidle');

    // Enter email
    await this.page.fill(Selectors.login.email, email);
    await this.page.click(Selectors.login.nextButton);
    await this.page.waitForTimeout(Timeouts.medium);

    // Enter password
    await this.page.fill(Selectors.login.password, password);
    await this.page.click(Selectors.login.passwordNext);

    // Wait for 2FA or successful login
    console.log('⚠️  Complete 2FA if prompted (timeout: 2 minutes)...');

    try {
      await this.page.waitForURL('**/myaccount.google.com/**', {
        timeout: Timeouts.twoFactor,
      });
    } catch {
      // May have gone directly to Play Console
      console.log('Checking if already logged in...');
    }

    // Verify login by going to Play Console
    await this.page.goto(URLs.console);
    await this.page.waitForLoadState('networkidle');

    // Save session
    const authPath = path.join(this.baseDir, 'config', 'auth.json');
    await this.context!.storageState({ path: authPath });

    console.log('✅ Login successful, session saved to config/auth.json');
  }

  /**
   * Verify current session is valid
   */
  async verifySession(): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto(URLs.console);
      await this.page.waitForLoadState('networkidle');

      // Check if we're on the console (not redirected to login)
      const url = this.page.url();
      return url.includes('play.google.com/console');
    } catch {
      return false;
    }
  }

  // ============================================
  // NAVIGATION
  // ============================================

  /**
   * Navigate to app's store listing page
   */
  async navigateToApp(packageName: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    const url = URLs.mainStoreListing(this.developerId, packageName);
    this.logVerbose(`Navigating to: ${url}`);

    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(Timeouts.short);
  }

  /**
   * Navigate to a specific section within app
   */
  async navigateToSection(section: 'listing' | 'graphics' | 'contact'): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    const sectionLinks: Record<string, string> = {
      listing: 'Main store listing',
      graphics: 'Store listing',
      contact: 'Store settings',
    };

    const linkText = sectionLinks[section];
    if (linkText) {
      await this.page.click(Selectors.nav.menuItem(linkText));
      await this.page.waitForLoadState('networkidle');
    }
  }

  // ============================================
  // UPDATE METHODS
  // ============================================

  /**
   * Update all metadata for a tenant
   */
  async updateTenant(config: TenantConfig): Promise<AutomationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const sectionsUpdated: UpdateSection[] = [];

    try {
      this.log(config.packageName, 'update-start', 'success', 'Starting metadata update');

      await this.navigateToApp(config.packageName);

      const sections = this.options.only || ['all'];
      const shouldUpdate = (section: UpdateSection) =>
        sections.includes('all') || sections.includes(section);

      // Update listing (title, descriptions)
      if (shouldUpdate('listing')) {
        await this.updateListing(config);
        sectionsUpdated.push('listing');
      }

      // Update localizations
      if (shouldUpdate('localizations') && config.localizations) {
        await this.updateLocalizations(config);
        sectionsUpdated.push('localizations');
      }

      // Update graphics (icon, feature graphic)
      if (shouldUpdate('graphics') && config.assets) {
        await this.updateGraphics(config);
        sectionsUpdated.push('graphics');
      }

      // Update screenshots
      if (shouldUpdate('screenshots') && config.assets?.screenshots) {
        await this.updateScreenshots(config);
        sectionsUpdated.push('screenshots');
      }

      // Update contact info
      if (shouldUpdate('contact')) {
        await this.updateContact(config);
        sectionsUpdated.push('contact');
      }

      this.log(config.packageName, 'update-complete', 'success', 'Metadata update completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(message);
      this.log(config.packageName, 'update-error', 'failure', message);
      await this.captureErrorScreenshot(config.packageName);
    }

    return {
      success: errors.length === 0,
      tenant: config.packageName,
      sectionsUpdated,
      errors,
      logs: this.logs,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Update main store listing (title, descriptions)
   */
  private async updateListing(config: TenantConfig): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.logVerbose('Updating store listing...');

    if (this.options.dryRun) {
      console.log('[DRY RUN] Would update listing:', config.listing);
      return;
    }

    // Wait for form to load
    await this.page.waitForSelector(Selectors.listing.title, { timeout: Timeouts.long });

    // Update title
    await this.clearAndFill(Selectors.listing.title, config.listing.title);

    // Update short description
    await this.clearAndFill(Selectors.listing.shortDescription, config.listing.shortDescription);

    // Update full description
    await this.clearAndFill(Selectors.listing.fullDescription, config.listing.fullDescription);

    // Save changes
    await this.saveChanges();

    this.log(config.packageName, 'listing', 'success', 'Store listing updated');
  }

  /**
   * Update localized listings
   */
  private async updateLocalizations(config: TenantConfig): Promise<void> {
    if (!this.page || !config.localizations) return;

    this.logVerbose('Updating localizations...');

    if (this.options.dryRun) {
      console.log('[DRY RUN] Would update localizations:', Object.keys(config.localizations));
      return;
    }

    for (const [langCode, listing] of Object.entries(config.localizations)) {
      try {
        // Click language selector
        await this.page.click(Selectors.listing.languageSelector);
        await this.page.waitForTimeout(Timeouts.short);

        // Select language
        await this.page.click(Selectors.listing.languageOption(langCode));
        await this.page.waitForLoadState('networkidle');

        // Update fields
        if (listing.title) {
          await this.clearAndFill(Selectors.listing.title, listing.title);
        }
        if (listing.shortDescription) {
          await this.clearAndFill(Selectors.listing.shortDescription, listing.shortDescription);
        }
        if (listing.fullDescription) {
          await this.clearAndFill(Selectors.listing.fullDescription, listing.fullDescription);
        }

        await this.saveChanges();
        this.log(config.packageName, `localization-${langCode}`, 'success', `Updated ${langCode}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.log(
          config.packageName,
          `localization-${langCode}`,
          'failure',
          `Failed to update ${langCode}: ${message}`
        );
      }
    }
  }

  /**
   * Update graphics (icon, feature graphic)
   */
  private async updateGraphics(config: TenantConfig): Promise<void> {
    if (!this.page || !config.assets) return;

    this.logVerbose('Updating graphics...');

    if (this.options.dryRun) {
      console.log('[DRY RUN] Would update graphics:', {
        icon: config.assets.icon,
        featureGraphic: config.assets.featureGraphic,
      });
      return;
    }

    // Update app icon
    if (config.assets.icon) {
      await this.uploadFile(Selectors.graphics.iconUpload, config.assets.icon);
      this.log(config.packageName, 'icon', 'success', 'App icon updated');
    }

    // Update feature graphic
    if (config.assets.featureGraphic) {
      await this.uploadFile(Selectors.graphics.featureUpload, config.assets.featureGraphic);
      this.log(config.packageName, 'feature-graphic', 'success', 'Feature graphic updated');
    }

    await this.saveChanges();
  }

  /**
   * Update screenshots
   */
  private async updateScreenshots(config: TenantConfig): Promise<void> {
    if (!this.page || !config.assets?.screenshots) return;

    this.logVerbose('Updating screenshots...');

    const screenshots = config.assets.screenshots;

    if (this.options.dryRun) {
      console.log('[DRY RUN] Would update screenshots:', {
        phone: screenshots.phone?.length || 0,
        tablet7: screenshots.tablet7?.length || 0,
        tablet10: screenshots.tablet10?.length || 0,
      });
      return;
    }

    // Upload phone screenshots
    if (screenshots.phone?.length) {
      for (const screenshotPath of screenshots.phone) {
        await this.uploadFile(Selectors.graphics.phoneScreenshots, screenshotPath);
        await this.page.waitForTimeout(Timeouts.short);
      }
      this.log(
        config.packageName,
        'phone-screenshots',
        'success',
        `Uploaded ${screenshots.phone.length} phone screenshots`
      );
    }

    // Upload 7-inch tablet screenshots
    if (screenshots.tablet7?.length) {
      for (const screenshotPath of screenshots.tablet7) {
        await this.uploadFile(Selectors.graphics.tablet7Screenshots, screenshotPath);
        await this.page.waitForTimeout(Timeouts.short);
      }
    }

    // Upload 10-inch tablet screenshots
    if (screenshots.tablet10?.length) {
      for (const screenshotPath of screenshots.tablet10) {
        await this.uploadFile(Selectors.graphics.tablet10Screenshots, screenshotPath);
        await this.page.waitForTimeout(Timeouts.short);
      }
    }

    await this.saveChanges();
  }

  /**
   * Update contact information
   */
  private async updateContact(config: TenantConfig): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.logVerbose('Updating contact info...');

    if (this.options.dryRun) {
      console.log('[DRY RUN] Would update contact:', config.contact);
      return;
    }

    // Navigate to store settings / contact section
    await this.navigateToSection('contact');

    // Update email
    await this.clearAndFill(Selectors.contact.email, config.contact.email);

    // Update website (if provided)
    if (config.contact.website) {
      await this.clearAndFill(Selectors.contact.website, config.contact.website);
    }

    // Update phone (if provided)
    if (config.contact.phone) {
      await this.clearAndFill(Selectors.contact.phone, config.contact.phone);
    }

    // Update privacy policy URL (if provided)
    if (config.contact.privacyPolicyUrl) {
      await this.clearAndFill(Selectors.contact.privacyPolicy, config.contact.privacyPolicyUrl);
    }

    await this.saveChanges();
    this.log(config.packageName, 'contact', 'success', 'Contact info updated');
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Clear input field and fill with new value
   */
  private async clearAndFill(selector: string, value: string): Promise<void> {
    if (!this.page) return;

    try {
      const element = await this.page.waitForSelector(selector, { timeout: Timeouts.medium });
      if (element) {
        await element.click({ clickCount: 3 }); // Select all
        await this.page.keyboard.press('Backspace');
        await element.fill(value);
      }
    } catch (error) {
      this.logVerbose(`Could not find selector: ${selector}`);
      throw error;
    }
  }

  /**
   * Upload a file to an input element
   */
  private async uploadFile(selector: string, filePath: string): Promise<void> {
    if (!this.page) return;

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.baseDir, filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    const input = await this.page.waitForSelector(selector, { timeout: Timeouts.medium });
    if (input) {
      await input.setInputFiles(absolutePath);
      // Wait for upload to complete
      await this.page.waitForTimeout(Timeouts.long);
    }
  }

  /**
   * Save changes on current form
   */
  private async saveChanges(): Promise<void> {
    if (!this.page) return;

    try {
      const saveButton = await this.page.$(Selectors.actions.save);
      if (saveButton) {
        await saveButton.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(Timeouts.medium);

        // Check for success toast
        const success = await this.page.$(Selectors.dialogs.successToast);
        if (!success) {
          // Check for error
          const error = await this.page.$(Selectors.dialogs.errorToast);
          if (error) {
            const errorText = await error.textContent();
            throw new Error(`Save failed: ${errorText}`);
          }
        }
      }
    } catch (error) {
      this.logVerbose(`Save warning: ${error}`);
    }
  }

  /**
   * Capture screenshot on error
   */
  private async captureErrorScreenshot(context: string): Promise<string | null> {
    if (!this.page) return null;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logsDir = path.join(this.baseDir, 'logs', timestamp);

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const screenshotPath = path.join(logsDir, `error-${context}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    return screenshotPath;
  }

  /**
   * Log execution event
   */
  private log(
    tenant: string,
    action: string,
    status: 'success' | 'failure' | 'skipped',
    message?: string
  ): void {
    const entry: ExecutionLog = {
      timestamp: new Date().toISOString(),
      tenant,
      action,
      status,
      message,
    };

    this.logs.push(entry);

    const emoji = status === 'success' ? '✅' : status === 'failure' ? '❌' : '⏭️';
    console.log(`${emoji} [${tenant}] ${action}: ${message || ''}`);
  }

  /**
   * Log verbose message (only if verbose option is enabled)
   */
  private logVerbose(message: string): void {
    if (this.options.verbose) {
      console.log(`🔍 ${message}`);
    }
  }

  /**
   * Take screenshot of current store listing
   */
  async screenshotListing(packageName: string): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.navigateToApp(packageName);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logsDir = path.join(this.baseDir, 'logs', timestamp);

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const screenshotPath = path.join(logsDir, `listing-${packageName}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  /**
   * Get execution logs
   */
  getLogs(): ExecutionLog[] {
    return this.logs;
  }

  /**
   * Clear execution logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}
