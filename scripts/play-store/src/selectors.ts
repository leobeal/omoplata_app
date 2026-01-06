/**
 * Play Console Selectors
 *
 * Google Play Console UI selectors for Playwright automation.
 * These may need updates when Google changes their UI.
 *
 * Last updated: 2025-01
 */

export const Selectors = {
  // ============================================
  // NAVIGATION
  // ============================================
  nav: {
    /** All apps list link */
    allApps: 'a[href*="/apps"]',
    /** Specific app by package name */
    appByPackage: (pkg: string) => `a[href*="${pkg}"]`,
    /** Left sidebar menu items */
    menuItem: (text: string) => `nav a:has-text("${text}")`,
    /** Main store listing link */
    mainStoreListing: 'a:has-text("Main store listing")',
    /** Store presence section */
    storePresence: 'a:has-text("Store presence")',
    /** App content section */
    appContent: 'a:has-text("App content")',
  },

  // ============================================
  // STORE LISTING
  // ============================================
  listing: {
    /** App name/title input */
    title: 'input[aria-label*="App name"], input[name*="title"]',
    /** Short description textarea */
    shortDescription:
      'textarea[aria-label*="Short description"], textarea[name*="shortDescription"]',
    /** Full description textarea */
    fullDescription: 'textarea[aria-label*="Full description"], textarea[name*="fullDescription"]',
    /** Language selector dropdown */
    languageSelector: 'button[aria-label*="language"], [data-test-id="language-selector"]',
    /** Language option in dropdown */
    languageOption: (code: string) => `[data-value="${code}"], li:has-text("${code}")`,
    /** Add translation button */
    addTranslation: 'button:has-text("Add translation")',
    /** Manage translations link */
    manageTranslations: 'a:has-text("Manage translations")',
  },

  // ============================================
  // GRAPHICS & SCREENSHOTS
  // ============================================
  graphics: {
    /** App icon upload area */
    iconUpload: '[aria-label*="App icon"] input[type="file"], [data-test-id="icon-upload"]',
    /** Feature graphic upload area */
    featureUpload:
      '[aria-label*="Feature graphic"] input[type="file"], [data-test-id="feature-upload"]',
    /** Phone screenshots upload */
    phoneScreenshots:
      '[aria-label*="Phone screenshots"] input[type="file"], [data-test-id="phone-screenshots"]',
    /** 7-inch tablet screenshots upload */
    tablet7Screenshots: '[aria-label*="7-inch tablet"] input[type="file"]',
    /** 10-inch tablet screenshots upload */
    tablet10Screenshots: '[aria-label*="10-inch tablet"] input[type="file"]',
    /** Delete image button */
    deleteImage: 'button[aria-label*="Delete"], button[aria-label*="Remove"]',
    /** Image preview container */
    imagePreview: '[data-test-id="image-preview"], .image-preview',
    /** Upload progress indicator */
    uploadProgress: '[role="progressbar"], .upload-progress',
  },

  // ============================================
  // CONTACT DETAILS
  // ============================================
  contact: {
    /** Contact email input */
    email: 'input[aria-label*="Email"], input[name*="email"], input[type="email"]',
    /** Website URL input */
    website: 'input[aria-label*="Website"], input[name*="website"]',
    /** Phone number input */
    phone: 'input[aria-label*="Phone"], input[name*="phone"]',
    /** Privacy policy URL */
    privacyPolicy: 'input[aria-label*="Privacy policy"], input[name*="privacyPolicy"]',
  },

  // ============================================
  // CATEGORY & TAGS
  // ============================================
  category: {
    /** App category dropdown */
    categoryDropdown: '[aria-label*="Category"], [data-test-id="category-select"]',
    /** Category option */
    categoryOption: (cat: string) => `[data-value="${cat}"], li:has-text("${cat}")`,
    /** Tags input */
    tagsInput: 'input[aria-label*="Tags"], input[name*="tags"]',
    /** Tag chip */
    tagChip: (tag: string) => `[data-tag="${tag}"], .chip:has-text("${tag}")`,
    /** Remove tag button */
    removeTag: 'button[aria-label*="Remove tag"]',
  },

  // ============================================
  // ACTIONS
  // ============================================
  actions: {
    /** Save button */
    save: 'button:has-text("Save"), button[aria-label*="Save"]',
    /** Save draft button */
    saveDraft: 'button:has-text("Save draft")',
    /** Submit button */
    submit: 'button:has-text("Submit"), button:has-text("Submit for review")',
    /** Cancel button */
    cancel: 'button:has-text("Cancel")',
    /** Discard changes button */
    discard: 'button:has-text("Discard")',
    /** Confirm dialog button */
    confirm: 'button:has-text("Confirm"), button:has-text("Yes")',
    /** Edit button */
    edit: 'button:has-text("Edit"), button[aria-label*="Edit"]',
  },

  // ============================================
  // DIALOGS & MODALS
  // ============================================
  dialogs: {
    /** Modal container */
    modal: '[role="dialog"], .modal, [data-test-id="modal"]',
    /** Modal close button */
    closeModal: '[aria-label*="Close"], button:has-text("Close")',
    /** Unsaved changes dialog */
    unsavedChanges: '[role="alertdialog"]:has-text("unsaved")',
    /** Success toast/snackbar */
    successToast: '[role="alert"]:has-text("saved"), .snackbar:has-text("success")',
    /** Error toast/snackbar */
    errorToast: '[role="alert"]:has-text("error"), .snackbar:has-text("failed")',
  },

  // ============================================
  // STATUS & VALIDATION
  // ============================================
  status: {
    /** Loading spinner */
    loading: '[role="progressbar"], .loading, .spinner',
    /** Error message */
    errorMessage: '.error-message, [role="alert"][aria-live="polite"]',
    /** Character count */
    charCount: '.char-count, [data-test-id="char-count"]',
    /** Validation error */
    validationError: '.validation-error, .field-error',
    /** Section complete checkmark */
    sectionComplete: '[aria-label*="Complete"], .section-complete',
  },

  // ============================================
  // LOGIN
  // ============================================
  login: {
    /** Email input */
    email: 'input[type="email"], input[name="identifier"]',
    /** Password input */
    password: 'input[type="password"], input[name="password"]',
    /** Next button (after email) */
    nextButton: '#identifierNext, button:has-text("Next")',
    /** Password next button */
    passwordNext: '#passwordNext, button:has-text("Next")',
    /** 2FA prompt */
    twoFactorPrompt: '[data-challengetype], .two-factor',
  },
} as const;

/**
 * Wait timeouts in milliseconds
 */
export const Timeouts = {
  /** Short wait for UI updates */
  short: 1000,
  /** Medium wait for navigation */
  medium: 3000,
  /** Long wait for uploads */
  long: 10000,
  /** Extended wait for 2FA */
  twoFactor: 120000,
  /** Network idle timeout */
  networkIdle: 5000,
} as const;

/**
 * Play Console URLs
 */
export const URLs = {
  /** Play Console home */
  console: 'https://play.google.com/console',
  /** Developer home with ID */
  developer: (id: string) => `https://play.google.com/console/developers/${id}`,
  /** App overview */
  app: (devId: string, pkg: string) =>
    `https://play.google.com/console/developers/${devId}/app/${pkg}/app-dashboard`,
  /** Store listing */
  storeListing: (devId: string, pkg: string) =>
    `https://play.google.com/console/developers/${devId}/app/${pkg}/store-listing`,
  /** Main store listing */
  mainStoreListing: (devId: string, pkg: string) =>
    `https://play.google.com/console/developers/${devId}/app/${pkg}/main-store-listing`,
  /** Store presence */
  storePresence: (devId: string, pkg: string) =>
    `https://play.google.com/console/developers/${devId}/app/${pkg}/store-presence`,
  /** Google login */
  googleLogin: 'https://accounts.google.com',
} as const;
