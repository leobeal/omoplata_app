/**
 * Play Console Questionnaire Selectors
 *
 * Selectors for app creation questionnaires and declarations.
 * These may need updates when Google changes their UI.
 *
 * Last updated: 2025-01
 */

export const QuestionnaireSelectors = {
  // ============================================
  // APP CREATION DIALOG
  // ============================================
  createApp: {
    /** Create app button on main page */
    createButton: 'button:has-text("Create app"), [data-test-id="create-app-button"]',

    /** App name input */
    appName: 'input[aria-label*="App name"], input[name*="appName"]',

    /** Default language dropdown */
    languageDropdown: '[aria-label*="Default language"], [data-test-id="language-select"]',
    languageOption: (code: string) => `[data-value="${code}"], li:has-text("${code}")`,

    /** App or Game radio buttons */
    appTypeApp: 'input[value="APPLICATION"], input[value="app"]',
    appTypeGame: 'input[value="GAME"], input[value="game"]',

    /** Free or Paid radio buttons */
    pricingFree: 'input[value="FREE"], input[value="free"]',
    pricingPaid: 'input[value="PAID"], input[value="paid"]',

    /** Accept declarations checkboxes */
    developerPolicies:
      'input[type="checkbox"][aria-label*="Developer Program Policies"], input[name*="policies"]',
    exportLaws: 'input[type="checkbox"][aria-label*="export laws"], input[name*="export"]',

    /** Create button in dialog */
    confirmCreate: 'button:has-text("Create app"):not(:disabled)',
  },

  // ============================================
  // CONTENT RATING QUESTIONNAIRE
  // ============================================
  contentRating: {
    /** Navigation to content rating */
    navLink: 'a:has-text("Content rating"), [href*="content-rating"]',

    /** Start questionnaire button */
    startButton: 'button:has-text("Start questionnaire"), button:has-text("Start new questionnaire")',

    /** Email input for IARC */
    emailInput: 'input[aria-label*="Email"], input[type="email"]',
    confirmEmail: 'input[aria-label*="Confirm email"]',

    /** Category selection */
    categoryDropdown: '[aria-label*="Category"], [data-test-id="category-select"]',
    categoryOption: (cat: string) => `[data-value="${cat}"], li:has-text("${cat}")`,

    /** Yes/No radio buttons - generic pattern */
    radioYes: (questionId: string) =>
      `[data-question="${questionId}"] input[value="yes"], ` +
      `input[name*="${questionId}"][value="yes"], ` +
      `[aria-label*="${questionId}"] input[value="yes"]`,
    radioNo: (questionId: string) =>
      `[data-question="${questionId}"] input[value="no"], ` +
      `input[name*="${questionId}"][value="no"], ` +
      `[aria-label*="${questionId}"] input[value="no"]`,

    /** Common question patterns */
    violence: {
      hasViolence: '[name*="violence"] input, [data-question="violence"]',
      isRealistic: '[name*="realistic"] input, [data-question="violence-realistic"]',
      hasBloodGore: '[name*="blood"] input, [data-question="blood-gore"]',
      towardsHumans: '[name*="humans"] input, [data-question="towards-humans"]',
    },

    sexual: {
      hasSexualContent: '[name*="sexual"] input, [data-question="sexual"]',
      hasNudity: '[name*="nudity"] input, [data-question="nudity"]',
      isExplicit: '[name*="explicit"] input, [data-question="explicit"]',
    },

    language: {
      hasProfanity: '[name*="profanity"] input, [data-question="profanity"]',
      profanityLevel: '[name*="profanity-level"], [data-question="profanity-level"]',
    },

    substances: {
      hasDrugReferences: '[name*="drugs"] input, [data-question="drugs"]',
      hasAlcohol: '[name*="alcohol"] input, [data-question="alcohol"]',
      hasTobacco: '[name*="tobacco"] input, [data-question="tobacco"]',
    },

    gambling: {
      hasGambling: '[name*="gambling"] input, [data-question="gambling"]',
      isSimulated: '[name*="simulated"] input, [data-question="simulated-gambling"]',
      hasRealMoney: '[name*="real-money"] input, [data-question="real-money"]',
    },

    interactive: {
      hasUserInteraction: '[name*="user-interaction"] input, [data-question="user-interaction"]',
      canShareInfo: '[name*="share-info"] input, [data-question="share-info"]',
      canShareLocation: '[name*="share-location"] input, [data-question="share-location"]',
      hasUnfilteredContent: '[name*="unfiltered"] input, [data-question="unfiltered-ugc"]',
      hasDigitalPurchases: '[name*="purchases"] input, [data-question="digital-purchases"]',
    },

    /** Navigation buttons */
    nextButton: 'button:has-text("Next"), button:has-text("Continue")',
    backButton: 'button:has-text("Back"), button:has-text("Previous")',
    submitButton: 'button:has-text("Submit"), button:has-text("Get rating")',
    saveButton: 'button:has-text("Save")',

    /** Rating result */
    ratingResult: '[data-test-id="rating-result"], .rating-badge',
    applyRating: 'button:has-text("Apply rating")',
  },

  // ============================================
  // DATA SAFETY FORM
  // ============================================
  dataSafety: {
    /** Navigation to data safety */
    navLink: 'a:has-text("Data safety"), [href*="data-safety"]',

    /** Start form button */
    startButton: 'button:has-text("Start"), button:has-text("Next")',

    /** Data collection overview */
    collectsData: {
      yes: 'input[value="yes"][name*="collects-data"], [data-question="collects-data"] input[value="yes"]',
      no: 'input[value="no"][name*="collects-data"], [data-question="collects-data"] input[value="no"]',
    },

    /** Data type checkboxes */
    dataTypes: {
      location: 'input[name*="location"], [data-type="location"]',
      personalInfo: 'input[name*="personal-info"], [data-type="personal-info"]',
      financialInfo: 'input[name*="financial"], [data-type="financial"]',
      healthFitness: 'input[name*="health"], [data-type="health-fitness"]',
      messages: 'input[name*="messages"], [data-type="messages"]',
      photosVideos: 'input[name*="photos"], [data-type="photos-videos"]',
      audioFiles: 'input[name*="audio"], [data-type="audio"]',
      filesAndDocs: 'input[name*="files"], [data-type="files-docs"]',
      calendar: 'input[name*="calendar"], [data-type="calendar"]',
      contacts: 'input[name*="contacts"], [data-type="contacts"]',
      appActivity: 'input[name*="app-activity"], [data-type="app-activity"]',
      webBrowsing: 'input[name*="web-browsing"], [data-type="web-browsing"]',
      deviceIds: 'input[name*="device-id"], [data-type="device-ids"]',
    },

    /** Data purposes */
    purposes: {
      appFunctionality: 'input[name*="app-functionality"], [data-purpose="app-functionality"]',
      analytics: 'input[name*="analytics"], [data-purpose="analytics"]',
      developerComms: 'input[name*="developer-communications"], [data-purpose="developer-comms"]',
      advertising: 'input[name*="advertising"], [data-purpose="advertising"]',
      fraudPrevention: 'input[name*="fraud"], [data-purpose="fraud-prevention"]',
      personalization: 'input[name*="personalization"], [data-purpose="personalization"]',
      accountManagement: 'input[name*="account"], [data-purpose="account-management"]',
    },

    /** Sharing options */
    sharing: {
      sharesData: 'input[value="yes"][name*="shares-data"]',
      doesNotShare: 'input[value="no"][name*="shares-data"]',
    },

    /** Security practices */
    security: {
      encryptedInTransit: 'input[name*="encrypted"], [data-security="encrypted-transit"]',
      canRequestDeletion: 'input[name*="deletion"], [data-security="request-deletion"]',
      hasSecurityReview: 'input[name*="security-review"], [data-security="security-review"]',
    },

    /** Navigation */
    nextButton: 'button:has-text("Next")',
    saveButton: 'button:has-text("Save")',
    submitButton: 'button:has-text("Submit")',
  },

  // ============================================
  // TARGET AUDIENCE
  // ============================================
  targetAudience: {
    /** Navigation */
    navLink: 'a:has-text("Target audience"), [href*="target-audience"]',

    /** Age group checkboxes */
    ageGroups: {
      under5: 'input[value="UNDER_5"], input[name*="under-5"]',
      age6to8: 'input[value="6_8"], input[name*="6-8"]',
      age9to12: 'input[value="9_12"], input[name*="9-12"]',
      age13to15: 'input[value="13_15"], input[name*="13-15"]',
      age16to17: 'input[value="16_17"], input[name*="16-17"]',
      age18plus: 'input[value="18_PLUS"], input[name*="18-plus"], input[value="18+"]',
    },

    /** Appeals to children */
    appealsToChildren: {
      yes: 'input[value="yes"][name*="appeals-to-children"]',
      no: 'input[value="no"][name*="appeals-to-children"]',
    },

    /** Child appeal details */
    childAppeal: {
      hasAppealingContent: 'input[name*="appealing-content"]',
      designedForChildren: 'input[name*="designed-for-children"]',
      childFocusedCategory: 'input[name*="child-category"]',
    },

    /** Navigation */
    saveButton: 'button:has-text("Save")',
    nextButton: 'button:has-text("Next")',
  },

  // ============================================
  // ADS DECLARATION
  // ============================================
  ads: {
    /** Navigation */
    navLink: 'a:has-text("Ads"), [href*="ads-declaration"], a:has-text("Advertising")',

    /** Contains ads */
    containsAds: {
      yes: 'input[value="yes"][name*="contains-ads"]',
      no: 'input[value="no"][name*="contains-ads"]',
    },

    /** Ad policies */
    policies: {
      appropriateForAll: 'input[name*="appropriate-for-all"]',
      usesCompliantSdks: 'input[name*="compliant-sdks"]',
    },

    /** Navigation */
    saveButton: 'button:has-text("Save")',
  },

  // ============================================
  // APP CATEGORY & CONTACT
  // ============================================
  categoryAndContact: {
    /** Navigation */
    navLink: 'a:has-text("Store settings"), a:has-text("App category"), [href*="store-settings"]',

    /** Category selection */
    categoryDropdown: '[aria-label*="Category"], [aria-label*="category"]',
    categoryOption: (cat: string) => `[data-value="${cat}"], li:has-text("${cat}")`,

    /** Secondary category */
    secondaryCategoryDropdown: '[aria-label*="Secondary category"]',

    /** Tags input */
    tagsInput: 'input[aria-label*="Tags"], input[name*="tags"]',
    addTag: 'button:has-text("Add tag")',

    /** Contact details */
    contactEmail: 'input[aria-label*="Email address"], input[type="email"][name*="contact"]',
    contactWebsite: 'input[aria-label*="Website"], input[name*="website"]',
    contactPhone: 'input[aria-label*="Phone"], input[name*="phone"]',

    /** Privacy policy */
    privacyPolicyUrl: 'input[aria-label*="Privacy policy"], input[name*="privacy"]',

    /** Navigation */
    saveButton: 'button:has-text("Save")',
  },

  // ============================================
  // FINANCIAL FEATURES
  // ============================================
  financial: {
    /** Navigation */
    navLink: 'a:has-text("Financial features"), [href*="financial"]',

    /** Provides financial services */
    providesServices: {
      yes: 'input[value="yes"][name*="financial-services"]',
      no: 'input[value="no"][name*="financial-services"]',
    },

    /** Feature types */
    features: {
      personalLoans: 'input[name*="personal-loans"]',
      creditCards: 'input[name*="credit-cards"]',
      investmentServices: 'input[name*="investment"]',
      cryptocurrency: 'input[name*="crypto"]',
      paymentServices: 'input[name*="payment"]',
      bankingServices: 'input[name*="banking"]',
    },

    saveButton: 'button:has-text("Save")',
  },

  // ============================================
  // GOVERNMENT APP
  // ============================================
  government: {
    /** Navigation */
    navLink: 'a:has-text("Government apps"), [href*="government"]',

    /** Is government app */
    isGovernmentApp: {
      yes: 'input[value="yes"][name*="government-app"]',
      no: 'input[value="no"][name*="government-app"]',
    },

    /** Government details */
    country: 'input[aria-label*="Country"], [name*="country"]',
    governmentEntity: 'input[aria-label*="Government entity"], [name*="entity"]',
    officialWebsite: 'input[aria-label*="Official website"], [name*="official-website"]',

    saveButton: 'button:has-text("Save")',
  },

  // ============================================
  // NEWS APP
  // ============================================
  news: {
    /** Navigation */
    navLink: 'a:has-text("News"), [href*="news-declaration"]',

    /** Is news app */
    isNewsApp: {
      yes: 'input[value="yes"][name*="news-app"]',
      no: 'input[value="no"][name*="news-app"]',
    },

    /** Publisher details */
    publisherName: 'input[aria-label*="Publisher name"], [name*="publisher-name"]',
    publisherWebsite: 'input[aria-label*="Publisher website"], [name*="publisher-website"]',
    providesOriginalContent: 'input[name*="original-content"]',

    saveButton: 'button:has-text("Save")',
  },

  // ============================================
  // STORE LISTING
  // ============================================
  storeListing: {
    /** Navigation */
    navLink: 'a:has-text("Main store listing"), [href*="main-store-listing"]',

    /** Fields */
    appTitle: 'input[aria-label*="App name"], input[name*="title"]',
    shortDescription: 'textarea[aria-label*="Short description"]',
    fullDescription: 'textarea[aria-label*="Full description"]',

    /** Language switcher */
    languageSwitcher: '[aria-label*="language"]',
    languageOption: (code: string) => `[data-value="${code}"]`,

    saveButton: 'button:has-text("Save")',
  },

  // ============================================
  // GRAPHICS UPLOAD
  // ============================================
  graphics: {
    /** Navigation */
    navLink: 'a:has-text("Main store listing"), [href*="store-listing"]',

    /** Upload inputs */
    iconUpload: '[aria-label*="App icon"] input[type="file"]',
    featureUpload: '[aria-label*="Feature graphic"] input[type="file"]',
    phoneScreenshots: '[aria-label*="Phone screenshots"] input[type="file"]',
    tablet7Screenshots: '[aria-label*="7-inch tablet"] input[type="file"]',
    tablet10Screenshots: '[aria-label*="10-inch tablet"] input[type="file"]',

    /** Video */
    promoVideoInput: 'input[aria-label*="YouTube"], input[name*="promo-video"]',

    saveButton: 'button:has-text("Save")',
  },

  // ============================================
  // DASHBOARD / SETUP CHECKLIST
  // ============================================
  dashboard: {
    /** Setup checklist items */
    checklistItem: (name: string) => `[data-task="${name}"], a:has-text("${name}")`,

    /** Status indicators */
    taskComplete: '.task-complete, [aria-label*="Complete"]',
    taskIncomplete: '.task-incomplete, [aria-label*="Incomplete"]',

    /** Review button */
    sendForReview: 'button:has-text("Send for review"), button:has-text("Submit for review")',

    /** App status */
    appStatus: '[data-test-id="app-status"], .app-status-badge',
  },
};

/**
 * Questionnaire-specific timeouts
 */
export const QuestionnaireTimeouts = {
  /** Wait for questionnaire page to load */
  pageLoad: 5000,
  /** Wait between questions */
  betweenQuestions: 500,
  /** Wait for form submission */
  submission: 10000,
  /** Wait for rating calculation */
  ratingCalculation: 15000,
  /** Wait for file uploads */
  fileUpload: 30000,
};
