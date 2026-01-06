/**
 * App Creation Automation
 *
 * Playwright-based automation for creating new apps on Google Play Console,
 * including filling out all questionnaires and declarations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Browser, BrowserContext, Page, chromium } from 'playwright';

import { URLs, Timeouts } from './selectors';
import { QuestionnaireSelectors, QuestionnaireTimeouts } from './selectors/questionnaires';
import {
  AppCreationConfig,
  CreationProgress,
  CreationResult,
  ContentRatingAnswers,
  DataSafetyForm,
  TargetAudience,
  AdsDeclaration,
  AppCategoryAndContact,
  StoreListing,
  AppAssets,
} from './types/app-creation';

interface CreationOptions {
  headless?: boolean;
  slowMo?: number;
  verbose?: boolean;
  dryRun?: boolean;
  screenshotOnError?: boolean;
  pauseOnError?: boolean;
}

export class AppCreationAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private developerId: string;
  private options: CreationOptions;
  private baseDir: string;
  private progress: CreationProgress;

  constructor(developerId: string, options: CreationOptions = {}) {
    this.developerId = developerId;
    this.options = {
      headless: false,
      slowMo: 150,
      verbose: true,
      screenshotOnError: true,
      pauseOnError: false,
      ...options,
    };
    this.baseDir = path.resolve(__dirname, '..');
    this.progress = this.initProgress();
  }

  private initProgress(): CreationProgress {
    return {
      appCreated: false,
      storeListingComplete: false,
      contentRatingComplete: false,
      dataSafetyComplete: false,
      targetAudienceComplete: false,
      adsDeclarationComplete: false,
      categoryComplete: false,
      assetsUploaded: false,
      readyForReview: false,
    };
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async init(authStatePath?: string): Promise<void> {
    const authPath = authStatePath || path.join(this.baseDir, 'config', 'auth.json');
    const hasAuth = fs.existsSync(authPath);

    if (!hasAuth) {
      throw new Error('No auth session found. Run "login" command first to authenticate.');
    }

    this.browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
    });

    this.context = await this.browser.newContext({
      storageState: authPath,
      viewport: { width: 1920, height: 1080 },
    });

    this.page = await this.context.newPage();
    this.log('Browser initialized');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  // ============================================
  // MAIN CREATION FLOW
  // ============================================

  async createApp(config: AppCreationConfig): Promise<CreationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.log(`\n${'='.repeat(60)}`);
      this.log(`Creating app: ${config.basicInfo.name}`);
      this.log('='.repeat(60));

      // Step 1: Create the app
      await this.createAppEntry(config);

      // Step 2: Complete store listing
      await this.completeStoreListing(config.storeListing);

      // Step 3: Upload assets
      await this.uploadAssets(config.assets);

      // Step 4: Content rating questionnaire
      await this.completeContentRating(config.contentRating);

      // Step 5: Data safety form
      await this.completeDataSafety(config.dataSafety);

      // Step 6: Target audience
      await this.completeTargetAudience(config.targetAudience);

      // Step 7: Ads declaration
      await this.completeAdsDeclaration(config.ads);

      // Step 8: Category and contact
      await this.completeCategoryAndContact(config.categoryAndContact);

      // Step 9: Check if ready for review
      await this.checkReadyForReview();

      this.log('\n✅ App creation completed successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(message);
      this.log(`\n❌ Error: ${message}`);

      if (this.options.screenshotOnError) {
        await this.captureScreenshot('error');
      }

      if (this.options.pauseOnError) {
        this.log('Paused for debugging. Press Ctrl+C to exit.');
        await new Promise(() => {}); // Pause indefinitely
      }
    }

    return {
      success: errors.length === 0,
      progress: this.progress,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }

  // ============================================
  // STEP 1: CREATE APP ENTRY
  // ============================================

  private async createAppEntry(config: AppCreationConfig): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.log('\n📱 Step 1: Creating app entry...');

    if (this.options.dryRun) {
      this.log('[DRY RUN] Would create app:', config.basicInfo);
      this.progress.appCreated = true;
      return;
    }

    // Navigate to Play Console
    await this.page.goto(URLs.console);
    await this.page.waitForLoadState('networkidle');

    // Click "Create app" button
    await this.clickSafe(QuestionnaireSelectors.createApp.createButton);
    await this.page.waitForTimeout(Timeouts.medium);

    // Fill app name
    await this.fillSafe(QuestionnaireSelectors.createApp.appName, config.basicInfo.name);

    // Select default language
    await this.clickSafe(QuestionnaireSelectors.createApp.languageDropdown);
    await this.page.waitForTimeout(Timeouts.short);
    await this.clickSafe(
      QuestionnaireSelectors.createApp.languageOption(config.basicInfo.defaultLanguage)
    );

    // Select app type (app or game)
    if (config.basicInfo.appType === 'app') {
      await this.clickSafe(QuestionnaireSelectors.createApp.appTypeApp);
    } else {
      await this.clickSafe(QuestionnaireSelectors.createApp.appTypeGame);
    }

    // Select pricing (free or paid)
    if (config.basicInfo.pricingType === 'free') {
      await this.clickSafe(QuestionnaireSelectors.createApp.pricingFree);
    } else {
      await this.clickSafe(QuestionnaireSelectors.createApp.pricingPaid);
    }

    // Accept declarations
    await this.clickSafe(QuestionnaireSelectors.createApp.developerPolicies);
    await this.clickSafe(QuestionnaireSelectors.createApp.exportLaws);

    // Click Create button
    await this.clickSafe(QuestionnaireSelectors.createApp.confirmCreate);
    await this.page.waitForNavigation({ timeout: Timeouts.long });

    this.progress.appCreated = true;
    this.log('✅ App entry created');
  }

  // ============================================
  // STEP 2: STORE LISTING
  // ============================================

  private async completeStoreListing(listing: StoreListing): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.log('\n📝 Step 2: Completing store listing...');

    if (this.options.dryRun) {
      this.log('[DRY RUN] Would set store listing:', listing);
      this.progress.storeListingComplete = true;
      return;
    }

    // Navigate to store listing
    await this.clickSafe(QuestionnaireSelectors.storeListing.navLink);
    await this.page.waitForLoadState('networkidle');

    // Fill title
    await this.clearAndFill(QuestionnaireSelectors.storeListing.appTitle, listing.title);

    // Fill short description
    await this.clearAndFill(
      QuestionnaireSelectors.storeListing.shortDescription,
      listing.shortDescription
    );

    // Fill full description
    await this.clearAndFill(
      QuestionnaireSelectors.storeListing.fullDescription,
      listing.fullDescription
    );

    // Save
    await this.clickSafe(QuestionnaireSelectors.storeListing.saveButton);
    await this.page.waitForTimeout(Timeouts.medium);

    // Handle localizations
    if (listing.localizations) {
      for (const [langCode, localized] of Object.entries(listing.localizations)) {
        await this.updateLocalization(langCode, localized);
      }
    }

    this.progress.storeListingComplete = true;
    this.log('✅ Store listing completed');
  }

  private async updateLocalization(
    langCode: string,
    listing: Partial<StoreListing>
  ): Promise<void> {
    if (!this.page) return;

    this.log(`   Updating localization: ${langCode}`);

    try {
      // Switch language
      await this.clickSafe(QuestionnaireSelectors.storeListing.languageSwitcher);
      await this.page.waitForTimeout(Timeouts.short);
      await this.clickSafe(QuestionnaireSelectors.storeListing.languageOption(langCode));
      await this.page.waitForLoadState('networkidle');

      // Update fields
      if (listing.title) {
        await this.clearAndFill(QuestionnaireSelectors.storeListing.appTitle, listing.title);
      }
      if (listing.shortDescription) {
        await this.clearAndFill(
          QuestionnaireSelectors.storeListing.shortDescription,
          listing.shortDescription
        );
      }
      if (listing.fullDescription) {
        await this.clearAndFill(
          QuestionnaireSelectors.storeListing.fullDescription,
          listing.fullDescription
        );
      }

      // Save
      await this.clickSafe(QuestionnaireSelectors.storeListing.saveButton);
      await this.page.waitForTimeout(Timeouts.medium);
    } catch (error) {
      this.log(`   ⚠️ Could not update ${langCode}: ${error}`);
    }
  }

  // ============================================
  // STEP 3: UPLOAD ASSETS
  // ============================================

  private async uploadAssets(assets: AppAssets): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.log('\n🖼️  Step 3: Uploading assets...');

    if (this.options.dryRun) {
      this.log('[DRY RUN] Would upload assets:', {
        icon: assets.icon,
        featureGraphic: assets.featureGraphic,
        screenshots: assets.phoneScreenshots.length,
      });
      this.progress.assetsUploaded = true;
      return;
    }

    // Navigate to store listing (where graphics are)
    await this.clickSafe(QuestionnaireSelectors.graphics.navLink);
    await this.page.waitForLoadState('networkidle');

    // Upload app icon
    this.log('   Uploading app icon...');
    await this.uploadFile(QuestionnaireSelectors.graphics.iconUpload, assets.icon);

    // Upload feature graphic
    this.log('   Uploading feature graphic...');
    await this.uploadFile(QuestionnaireSelectors.graphics.featureUpload, assets.featureGraphic);

    // Upload phone screenshots
    this.log(`   Uploading ${assets.phoneScreenshots.length} phone screenshots...`);
    for (const screenshot of assets.phoneScreenshots) {
      await this.uploadFile(QuestionnaireSelectors.graphics.phoneScreenshots, screenshot);
      await this.page.waitForTimeout(QuestionnaireTimeouts.betweenQuestions);
    }

    // Upload tablet screenshots if provided
    if (assets.tablet7Screenshots?.length) {
      this.log(`   Uploading ${assets.tablet7Screenshots.length} tablet (7") screenshots...`);
      for (const screenshot of assets.tablet7Screenshots) {
        await this.uploadFile(QuestionnaireSelectors.graphics.tablet7Screenshots, screenshot);
      }
    }

    if (assets.tablet10Screenshots?.length) {
      this.log(`   Uploading ${assets.tablet10Screenshots.length} tablet (10") screenshots...`);
      for (const screenshot of assets.tablet10Screenshots) {
        await this.uploadFile(QuestionnaireSelectors.graphics.tablet10Screenshots, screenshot);
      }
    }

    // Add promo video if provided
    if (assets.promoVideo) {
      this.log('   Adding promo video URL...');
      await this.fillSafe(QuestionnaireSelectors.graphics.promoVideoInput, assets.promoVideo);
    }

    // Save
    await this.clickSafe(QuestionnaireSelectors.graphics.saveButton);
    await this.page.waitForTimeout(Timeouts.medium);

    this.progress.assetsUploaded = true;
    this.log('✅ Assets uploaded');
  }

  // ============================================
  // STEP 4: CONTENT RATING QUESTIONNAIRE
  // ============================================

  private async completeContentRating(answers: ContentRatingAnswers): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.log('\n🎮 Step 4: Completing content rating questionnaire...');

    if (this.options.dryRun) {
      this.log('[DRY RUN] Would answer content rating questions');
      this.progress.contentRatingComplete = true;
      return;
    }

    // Navigate to content rating
    await this.clickSafe(QuestionnaireSelectors.contentRating.navLink);
    await this.page.waitForLoadState('networkidle');

    // Start questionnaire
    await this.clickSafe(QuestionnaireSelectors.contentRating.startButton);
    await this.page.waitForTimeout(QuestionnaireTimeouts.pageLoad);

    // Enter email
    this.log('   Entering email for IARC...');
    await this.fillSafe(QuestionnaireSelectors.contentRating.emailInput, answers.email);

    // Confirm email if field exists
    try {
      await this.fillSafe(QuestionnaireSelectors.contentRating.confirmEmail, answers.email);
    } catch {
      // Confirm email field may not exist
    }

    // Select category
    this.log('   Selecting category...');
    await this.clickSafe(QuestionnaireSelectors.contentRating.categoryDropdown);
    await this.page.waitForTimeout(Timeouts.short);
    await this.clickSafe(QuestionnaireSelectors.contentRating.categoryOption(answers.category));

    // Next to questions
    await this.clickSafe(QuestionnaireSelectors.contentRating.nextButton);
    await this.page.waitForTimeout(QuestionnaireTimeouts.pageLoad);

    // Answer violence questions
    this.log('   Answering violence questions...');
    await this.answerYesNo('violence', answers.violence.hasViolence);
    if (answers.violence.hasViolence && answers.violence.isRealistic !== undefined) {
      await this.answerYesNo('violence-realistic', answers.violence.isRealistic);
    }
    if (answers.violence.hasViolence && answers.violence.hasBloodGore !== undefined) {
      await this.answerYesNo('blood-gore', answers.violence.hasBloodGore);
    }

    // Answer sexual content questions
    this.log('   Answering sexual content questions...');
    await this.answerYesNo('sexual', answers.sexualContent.hasSexualContent);
    if (answers.sexualContent.hasSexualContent && answers.sexualContent.hasNudity !== undefined) {
      await this.answerYesNo('nudity', answers.sexualContent.hasNudity);
    }

    // Answer language questions
    this.log('   Answering language questions...');
    await this.answerYesNo('profanity', answers.language.hasProfanity);

    // Answer substance questions
    this.log('   Answering substance questions...');
    await this.answerYesNo('drugs', answers.substances.hasDrugReferences);
    if (answers.substances.hasAlcoholReferences !== undefined) {
      await this.answerYesNo('alcohol', answers.substances.hasAlcoholReferences);
    }

    // Answer gambling questions
    this.log('   Answering gambling questions...');
    await this.answerYesNo('gambling', answers.gambling.hasGambling);
    if (answers.gambling.hasGambling && answers.gambling.isSimulated !== undefined) {
      await this.answerYesNo('simulated-gambling', answers.gambling.isSimulated);
    }

    // Answer interactive elements questions
    this.log('   Answering interactive elements questions...');
    await this.answerYesNo('user-interaction', answers.interactive.hasUserInteraction);
    if (answers.interactive.hasUserInteraction) {
      if (answers.interactive.canShareInfo !== undefined) {
        await this.answerYesNo('share-info', answers.interactive.canShareInfo);
      }
      if (answers.interactive.canShareLocation !== undefined) {
        await this.answerYesNo('share-location', answers.interactive.canShareLocation);
      }
      if (answers.interactive.hasUnfilteredContent !== undefined) {
        await this.answerYesNo('unfiltered-ugc', answers.interactive.hasUnfilteredContent);
      }
    }
    if (answers.interactive.hasDigitalPurchases !== undefined) {
      await this.answerYesNo('digital-purchases', answers.interactive.hasDigitalPurchases);
    }

    // Submit questionnaire
    this.log('   Submitting questionnaire...');
    await this.clickSafe(QuestionnaireSelectors.contentRating.submitButton);
    await this.page.waitForTimeout(QuestionnaireTimeouts.ratingCalculation);

    // Apply rating
    try {
      await this.clickSafe(QuestionnaireSelectors.contentRating.applyRating);
      await this.page.waitForTimeout(Timeouts.medium);
    } catch {
      this.log('   ⚠️ Apply rating button not found, may need manual action');
    }

    this.progress.contentRatingComplete = true;
    this.log('✅ Content rating completed');
  }

  // ============================================
  // STEP 5: DATA SAFETY FORM
  // ============================================

  private async completeDataSafety(form: DataSafetyForm): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.log('\n🔒 Step 5: Completing data safety form...');

    if (this.options.dryRun) {
      this.log('[DRY RUN] Would complete data safety form');
      this.progress.dataSafetyComplete = true;
      return;
    }

    // Navigate to data safety
    await this.clickSafe(QuestionnaireSelectors.dataSafety.navLink);
    await this.page.waitForLoadState('networkidle');

    // Start form
    await this.clickSafe(QuestionnaireSelectors.dataSafety.startButton);
    await this.page.waitForTimeout(QuestionnaireTimeouts.pageLoad);

    // Does app collect or share data?
    this.log('   Answering data collection overview...');
    if (form.collectsOrSharesData) {
      await this.clickSafe(QuestionnaireSelectors.dataSafety.collectsData.yes);
    } else {
      await this.clickSafe(QuestionnaireSelectors.dataSafety.collectsData.no);
      // If no data collected, skip to security practices
      await this.clickSafe(QuestionnaireSelectors.dataSafety.nextButton);
    }

    // If collects data, go through data types
    if (form.collectsOrSharesData && form.dataCollection) {
      this.log('   Selecting data types...');
      await this.clickSafe(QuestionnaireSelectors.dataSafety.nextButton);
      await this.page.waitForTimeout(QuestionnaireTimeouts.pageLoad);

      const dc = form.dataCollection;

      // Check each data type that applies
      if (dc.location?.collectsApproximate || dc.location?.collectsPrecise) {
        await this.clickSafe(QuestionnaireSelectors.dataSafety.dataTypes.location);
      }
      if (dc.personalInfo?.collects) {
        await this.clickSafe(QuestionnaireSelectors.dataSafety.dataTypes.personalInfo);
      }
      if (dc.financialInfo?.collects) {
        await this.clickSafe(QuestionnaireSelectors.dataSafety.dataTypes.financialInfo);
      }
      if (dc.healthAndFitness?.collects) {
        await this.clickSafe(QuestionnaireSelectors.dataSafety.dataTypes.healthFitness);
      }
      if (dc.messages?.collects) {
        await this.clickSafe(QuestionnaireSelectors.dataSafety.dataTypes.messages);
      }
      if (dc.contacts?.collects) {
        await this.clickSafe(QuestionnaireSelectors.dataSafety.dataTypes.contacts);
      }
      if (dc.deviceIds?.collects) {
        await this.clickSafe(QuestionnaireSelectors.dataSafety.dataTypes.deviceIds);
      }

      // Next to sharing questions
      await this.clickSafe(QuestionnaireSelectors.dataSafety.nextButton);
      await this.page.waitForTimeout(QuestionnaireTimeouts.pageLoad);

      // Data sharing
      this.log('   Answering data sharing questions...');
      // Check if any data type shares data
      const sharesAnyData = Object.values(dc).some(
        (type) => type && typeof type === 'object' && 'shares' in type && type.shares
      );

      if (sharesAnyData) {
        await this.clickSafe(QuestionnaireSelectors.dataSafety.sharing.sharesData);
      } else {
        await this.clickSafe(QuestionnaireSelectors.dataSafety.sharing.doesNotShare);
      }
    }

    // Security practices
    this.log('   Answering security practices...');
    await this.clickSafe(QuestionnaireSelectors.dataSafety.nextButton);
    await this.page.waitForTimeout(QuestionnaireTimeouts.pageLoad);

    if (form.securityPractices.dataEncryptedInTransit) {
      await this.clickSafe(QuestionnaireSelectors.dataSafety.security.encryptedInTransit);
    }
    if (form.securityPractices.canRequestDeletion) {
      await this.clickSafe(QuestionnaireSelectors.dataSafety.security.canRequestDeletion);
    }

    // Submit
    await this.clickSafe(QuestionnaireSelectors.dataSafety.submitButton);
    await this.page.waitForTimeout(Timeouts.medium);

    this.progress.dataSafetyComplete = true;
    this.log('✅ Data safety form completed');
  }

  // ============================================
  // STEP 6: TARGET AUDIENCE
  // ============================================

  private async completeTargetAudience(audience: TargetAudience): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.log('\n👥 Step 6: Setting target audience...');

    if (this.options.dryRun) {
      this.log('[DRY RUN] Would set target audience:', audience);
      this.progress.targetAudienceComplete = true;
      return;
    }

    // Navigate to target audience
    await this.clickSafe(QuestionnaireSelectors.targetAudience.navLink);
    await this.page.waitForLoadState('networkidle');

    // Select age groups
    this.log('   Selecting age groups...');
    const ageGroupSelectors: Record<string, string> = {
      under_5: QuestionnaireSelectors.targetAudience.ageGroups.under5,
      '6_8': QuestionnaireSelectors.targetAudience.ageGroups.age6to8,
      '9_12': QuestionnaireSelectors.targetAudience.ageGroups.age9to12,
      '13_15': QuestionnaireSelectors.targetAudience.ageGroups.age13to15,
      '16_17': QuestionnaireSelectors.targetAudience.ageGroups.age16to17,
      '18_plus': QuestionnaireSelectors.targetAudience.ageGroups.age18plus,
    };

    for (const ageGroup of audience.ageGroups) {
      const selector = ageGroupSelectors[ageGroup];
      if (selector) {
        await this.clickSafe(selector);
      }
    }

    // Appeals to children
    this.log('   Answering appeals to children...');
    if (audience.appealsToChildren) {
      await this.clickSafe(QuestionnaireSelectors.targetAudience.appealsToChildren.yes);

      // Answer follow-up questions if provided
      if (audience.childrenAppeal) {
        if (audience.childrenAppeal.hasChildAppealingContent) {
          await this.clickSafe(
            QuestionnaireSelectors.targetAudience.childAppeal.hasAppealingContent
          );
        }
        if (audience.childrenAppeal.designedForChildren) {
          await this.clickSafe(
            QuestionnaireSelectors.targetAudience.childAppeal.designedForChildren
          );
        }
      }
    } else {
      await this.clickSafe(QuestionnaireSelectors.targetAudience.appealsToChildren.no);
    }

    // Save
    await this.clickSafe(QuestionnaireSelectors.targetAudience.saveButton);
    await this.page.waitForTimeout(Timeouts.medium);

    this.progress.targetAudienceComplete = true;
    this.log('✅ Target audience set');
  }

  // ============================================
  // STEP 7: ADS DECLARATION
  // ============================================

  private async completeAdsDeclaration(ads: AdsDeclaration): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.log('\n📢 Step 7: Completing ads declaration...');

    if (this.options.dryRun) {
      this.log('[DRY RUN] Would set ads declaration:', ads);
      this.progress.adsDeclarationComplete = true;
      return;
    }

    // Navigate to ads
    await this.clickSafe(QuestionnaireSelectors.ads.navLink);
    await this.page.waitForLoadState('networkidle');

    // Contains ads?
    if (ads.containsAds) {
      await this.clickSafe(QuestionnaireSelectors.ads.containsAds.yes);

      // Ad policies if applicable
      if (ads.adPolicies) {
        if (ads.adPolicies.appropriateForAllAudiences) {
          await this.clickSafe(QuestionnaireSelectors.ads.policies.appropriateForAll);
        }
        if (ads.adPolicies.usesCompliantSdks) {
          await this.clickSafe(QuestionnaireSelectors.ads.policies.usesCompliantSdks);
        }
      }
    } else {
      await this.clickSafe(QuestionnaireSelectors.ads.containsAds.no);
    }

    // Save
    await this.clickSafe(QuestionnaireSelectors.ads.saveButton);
    await this.page.waitForTimeout(Timeouts.medium);

    this.progress.adsDeclarationComplete = true;
    this.log('✅ Ads declaration completed');
  }

  // ============================================
  // STEP 8: CATEGORY AND CONTACT
  // ============================================

  private async completeCategoryAndContact(config: AppCategoryAndContact): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.log('\n📂 Step 8: Setting category and contact...');

    if (this.options.dryRun) {
      this.log('[DRY RUN] Would set category and contact:', config);
      this.progress.categoryComplete = true;
      return;
    }

    // Navigate to store settings
    await this.clickSafe(QuestionnaireSelectors.categoryAndContact.navLink);
    await this.page.waitForLoadState('networkidle');

    // Select category
    this.log('   Selecting app category...');
    await this.clickSafe(QuestionnaireSelectors.categoryAndContact.categoryDropdown);
    await this.page.waitForTimeout(Timeouts.short);
    await this.clickSafe(QuestionnaireSelectors.categoryAndContact.categoryOption(config.category));

    // Secondary category if provided
    if (config.secondaryCategory) {
      await this.clickSafe(QuestionnaireSelectors.categoryAndContact.secondaryCategoryDropdown);
      await this.page.waitForTimeout(Timeouts.short);
      await this.clickSafe(
        QuestionnaireSelectors.categoryAndContact.categoryOption(config.secondaryCategory)
      );
    }

    // Contact details
    this.log('   Entering contact details...');
    await this.clearAndFill(
      QuestionnaireSelectors.categoryAndContact.contactEmail,
      config.contact.email
    );

    if (config.contact.website) {
      await this.clearAndFill(
        QuestionnaireSelectors.categoryAndContact.contactWebsite,
        config.contact.website
      );
    }

    if (config.contact.phone) {
      await this.clearAndFill(
        QuestionnaireSelectors.categoryAndContact.contactPhone,
        config.contact.phone
      );
    }

    // Privacy policy URL
    this.log('   Setting privacy policy URL...');
    await this.clearAndFill(
      QuestionnaireSelectors.categoryAndContact.privacyPolicyUrl,
      config.privacyPolicyUrl
    );

    // Save
    await this.clickSafe(QuestionnaireSelectors.categoryAndContact.saveButton);
    await this.page.waitForTimeout(Timeouts.medium);

    this.progress.categoryComplete = true;
    this.log('✅ Category and contact set');
  }

  // ============================================
  // STEP 9: CHECK READY FOR REVIEW
  // ============================================

  private async checkReadyForReview(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    this.log('\n🔍 Checking if app is ready for review...');

    // Navigate to dashboard
    await this.clickSafe(QuestionnaireSelectors.dashboard.checklistItem('Dashboard'));
    await this.page.waitForLoadState('networkidle');

    // Check for review button
    try {
      const reviewButton = await this.page.$(QuestionnaireSelectors.dashboard.sendForReview);

      if (reviewButton) {
        const isDisabled = await reviewButton.isDisabled();
        this.progress.readyForReview = !isDisabled;

        if (this.progress.readyForReview) {
          this.log('✅ App is ready for review!');
        } else {
          this.log('⚠️ App is not yet ready for review. Check dashboard for missing items.');
        }
      }
    } catch {
      this.log('⚠️ Could not determine review readiness');
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async clickSafe(selector: string): Promise<void> {
    if (!this.page) return;

    try {
      // Try multiple selector patterns (comma-separated)
      const selectors = selector.split(', ');

      for (const sel of selectors) {
        try {
          const element = await this.page.waitForSelector(sel.trim(), {
            timeout: 5000,
            state: 'visible',
          });

          if (element) {
            await element.click();
            return;
          }
        } catch {
          continue;
        }
      }

      throw new Error(`No element found for: ${selector}`);
    } catch (error) {
      this.logVerbose(`Could not click: ${selector}`);
      throw error;
    }
  }

  private async fillSafe(selector: string, value: string): Promise<void> {
    if (!this.page) return;

    try {
      const selectors = selector.split(', ');

      for (const sel of selectors) {
        try {
          const element = await this.page.waitForSelector(sel.trim(), {
            timeout: 5000,
            state: 'visible',
          });

          if (element) {
            await element.fill(value);
            return;
          }
        } catch {
          continue;
        }
      }

      throw new Error(`No element found for: ${selector}`);
    } catch (error) {
      this.logVerbose(`Could not fill: ${selector}`);
      throw error;
    }
  }

  private async clearAndFill(selector: string, value: string): Promise<void> {
    if (!this.page) return;

    try {
      const selectors = selector.split(', ');

      for (const sel of selectors) {
        try {
          const element = await this.page.waitForSelector(sel.trim(), {
            timeout: 5000,
            state: 'visible',
          });

          if (element) {
            await element.click({ clickCount: 3 });
            await this.page.keyboard.press('Backspace');
            await element.fill(value);
            return;
          }
        } catch {
          continue;
        }
      }

      throw new Error(`No element found for: ${selector}`);
    } catch (error) {
      this.logVerbose(`Could not clear and fill: ${selector}`);
      throw error;
    }
  }

  private async answerYesNo(questionId: string, answer: boolean): Promise<void> {
    if (!this.page) return;

    const selector = answer
      ? QuestionnaireSelectors.contentRating.radioYes(questionId)
      : QuestionnaireSelectors.contentRating.radioNo(questionId);

    try {
      await this.clickSafe(selector);
      await this.page.waitForTimeout(QuestionnaireTimeouts.betweenQuestions);
    } catch {
      this.logVerbose(`Could not answer question: ${questionId}`);
    }
  }

  private async uploadFile(selector: string, filePath: string): Promise<void> {
    if (!this.page) return;

    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    try {
      const selectors = selector.split(', ');

      for (const sel of selectors) {
        try {
          const input = await this.page.waitForSelector(sel.trim(), { timeout: 5000 });
          if (input) {
            await input.setInputFiles(absolutePath);
            await this.page.waitForTimeout(QuestionnaireTimeouts.fileUpload);
            return;
          }
        } catch {
          continue;
        }
      }

      throw new Error(`No upload element found for: ${selector}`);
    } catch (error) {
      this.logVerbose(`Could not upload file: ${selector}`);
      throw error;
    }
  }

  private async captureScreenshot(context: string): Promise<string> {
    if (!this.page) return '';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logsDir = path.join(this.baseDir, 'logs', timestamp);

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const screenshotPath = path.join(logsDir, `${context}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    this.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  private log(message: string): void {
    console.log(message);
  }

  private logVerbose(message: string): void {
    if (this.options.verbose) {
      console.log(`   🔍 ${message}`);
    }
  }

  getProgress(): CreationProgress {
    return this.progress;
  }
}
