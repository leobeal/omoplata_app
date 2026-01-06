/**
 * App Creation Types
 *
 * Comprehensive types for Google Play Console app creation automation,
 * including all questionnaires and declarations.
 */

// ============================================
// BASIC APP INFO
// ============================================

export interface AppBasicInfo {
  /** App name (max 30 characters) */
  name: string;
  /** Default language (e.g., "en-US", "de-DE") */
  defaultLanguage: string;
  /** App or Game */
  appType: 'app' | 'game';
  /** Free or Paid */
  pricingType: 'free' | 'paid';
}

// ============================================
// CONTENT RATING QUESTIONNAIRE
// ============================================

export interface ContentRatingAnswers {
  /** Email for IARC certificate */
  email: string;

  /** App category for rating purposes */
  category:
    | 'reference'
    | 'news'
    | 'social_networking'
    | 'communication'
    | 'entertainment'
    | 'games'
    | 'education'
    | 'utilities'
    | 'lifestyle'
    | 'health_fitness'
    | 'business'
    | 'other';

  // Violence questions
  violence: {
    /** Does the app contain violence? */
    hasViolence: boolean;
    /** Is violence towards characters realistic? */
    isRealistic?: boolean;
    /** Can violence result in blood/gore? */
    hasBloodGore?: boolean;
    /** Is violence towards human characters? */
    towardsHumans?: boolean;
  };

  // Sexual content
  sexualContent: {
    /** Does the app contain sexual content? */
    hasSexualContent: boolean;
    /** Is nudity present? */
    hasNudity?: boolean;
    /** Is content sexual in nature? */
    isSexualNature?: boolean;
    /** Is it explicit? */
    isExplicit?: boolean;
  };

  // Language
  language: {
    /** Does the app contain profanity/crude humor? */
    hasProfanity: boolean;
    /** Is profanity mild or strong? */
    profanityLevel?: 'mild' | 'strong';
    /** Contains discriminatory language? */
    hasDiscrimination?: boolean;
  };

  // Substances
  substances: {
    /** References to controlled substances? */
    hasDrugReferences: boolean;
    /** References to alcohol? */
    hasAlcoholReferences?: boolean;
    /** References to tobacco? */
    hasTobaccoReferences?: boolean;
    /** Is usage encouraged? */
    isUsageEncouraged?: boolean;
  };

  // Gambling
  gambling: {
    /** Does app contain gambling? */
    hasGambling: boolean;
    /** Is it simulated gambling? */
    isSimulated?: boolean;
    /** Can real money be wagered? */
    hasRealMoney?: boolean;
  };

  // Interactive elements
  interactive: {
    /** Does app allow user interaction? */
    hasUserInteraction: boolean;
    /** Can users share info? */
    canShareInfo?: boolean;
    /** Can users share location? */
    canShareLocation?: boolean;
    /** Unfiltered user-generated content? */
    hasUnfilteredContent?: boolean;
    /** Digital purchases? */
    hasDigitalPurchases?: boolean;
  };
}

// ============================================
// DATA SAFETY FORM
// ============================================

export interface DataSafetyForm {
  /** Does the app collect or share any user data? */
  collectsOrSharesData: boolean;

  /** If true, specify data collection details */
  dataCollection?: {
    // Personal info
    personalInfo?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Location
    location?: {
      collectsApproximate: boolean;
      collectsPrecise: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Financial info
    financialInfo?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Health and fitness
    healthAndFitness?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Messages
    messages?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Photos and videos
    photosVideos?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Audio files
    audioFiles?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Files and docs
    filesAndDocs?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Calendar
    calendar?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Contacts
    contacts?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // App activity
    appActivity?: {
      collectsAppInteractions: boolean;
      collectsSearchHistory: boolean;
      collectsInstalledApps: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Web browsing
    webBrowsing?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };

    // Device or other IDs
    deviceIds?: {
      collects: boolean;
      shares: boolean;
      required: boolean;
      purpose: DataPurpose[];
    };
  };

  /** Security practices */
  securityPractices: {
    /** Is data encrypted in transit? */
    dataEncryptedInTransit: boolean;
    /** Can users request data deletion? */
    canRequestDeletion: boolean;
    /** Is independent security review done? */
    hasSecurityReview?: boolean;
  };
}

export type DataPurpose =
  | 'app_functionality'
  | 'analytics'
  | 'developer_communications'
  | 'advertising'
  | 'fraud_prevention'
  | 'personalization'
  | 'account_management';

// ============================================
// TARGET AUDIENCE
// ============================================

export interface TargetAudience {
  /** Target age groups (can select multiple) */
  ageGroups: AgeGroup[];

  /** Does the app appeal to children under 13? */
  appealsToChildren: boolean;

  /** If appeals to children, additional questions */
  childrenAppeal?: {
    /** Characters, activities, or themes appealing to children? */
    hasChildAppealingContent: boolean;
    /** Is app designed for children? */
    designedForChildren: boolean;
    /** Is app in a child-focused category? */
    childFocusedCategory: boolean;
  };
}

export type AgeGroup = 'under_5' | '6_8' | '9_12' | '13_15' | '16_17' | '18_plus';

// ============================================
// ADS DECLARATION
// ============================================

export interface AdsDeclaration {
  /** Does the app contain ads? */
  containsAds: boolean;

  /** If true, ad policy compliance */
  adPolicies?: {
    /** Ads are appropriate for all audiences? */
    appropriateForAllAudiences: boolean;
    /** Uses Google Play's ad policy compliant SDKs? */
    usesCompliantSdks: boolean;
  };
}

// ============================================
// APP CATEGORY & CONTACT
// ============================================

export interface AppCategoryAndContact {
  /** Primary app category */
  category: AppCategory;

  /** Secondary category (optional) */
  secondaryCategory?: AppCategory;

  /** App tags for discovery */
  tags?: string[];

  /** Contact information */
  contact: {
    email: string;
    website?: string;
    phone?: string;
  };

  /** Privacy policy URL (required for most apps) */
  privacyPolicyUrl: string;
}

export type AppCategory =
  // Apps
  | 'ART_AND_DESIGN'
  | 'AUTO_AND_VEHICLES'
  | 'BEAUTY'
  | 'BOOKS_AND_REFERENCE'
  | 'BUSINESS'
  | 'COMICS'
  | 'COMMUNICATION'
  | 'DATING'
  | 'EDUCATION'
  | 'ENTERTAINMENT'
  | 'EVENTS'
  | 'FINANCE'
  | 'FOOD_AND_DRINK'
  | 'HEALTH_AND_FITNESS'
  | 'HOUSE_AND_HOME'
  | 'LIBRARIES_AND_DEMO'
  | 'LIFESTYLE'
  | 'MAPS_AND_NAVIGATION'
  | 'MEDICAL'
  | 'MUSIC_AND_AUDIO'
  | 'NEWS_AND_MAGAZINES'
  | 'PARENTING'
  | 'PERSONALIZATION'
  | 'PHOTOGRAPHY'
  | 'PRODUCTIVITY'
  | 'SHOPPING'
  | 'SOCIAL'
  | 'SPORTS'
  | 'TOOLS'
  | 'TRAVEL_AND_LOCAL'
  | 'VIDEO_PLAYERS'
  | 'WEATHER'
  // Games
  | 'GAME_ACTION'
  | 'GAME_ADVENTURE'
  | 'GAME_ARCADE'
  | 'GAME_BOARD'
  | 'GAME_CARD'
  | 'GAME_CASINO'
  | 'GAME_CASUAL'
  | 'GAME_EDUCATIONAL'
  | 'GAME_MUSIC'
  | 'GAME_PUZZLE'
  | 'GAME_RACING'
  | 'GAME_ROLE_PLAYING'
  | 'GAME_SIMULATION'
  | 'GAME_SPORTS'
  | 'GAME_STRATEGY'
  | 'GAME_TRIVIA'
  | 'GAME_WORD';

// ============================================
// FINANCIAL FEATURES (if applicable)
// ============================================

export interface FinancialFeatures {
  /** Does the app provide financial services? */
  providesFinancialServices: boolean;

  /** Types of financial features */
  features?: {
    personalLoans: boolean;
    creditCards: boolean;
    investmentServices: boolean;
    cryptocurrency: boolean;
    paymentServices: boolean;
    bankingServices: boolean;
  };
}

// ============================================
// GOVERNMENT APPS (if applicable)
// ============================================

export interface GovernmentAppDeclaration {
  /** Is this a government app? */
  isGovernmentApp: boolean;

  /** Government details */
  details?: {
    country: string;
    governmentEntity: string;
    officialWebsite: string;
  };
}

// ============================================
// NEWS APP (if applicable)
// ============================================

export interface NewsAppDeclaration {
  /** Is this a news app? */
  isNewsApp: boolean;

  /** News publisher details */
  details?: {
    publisherName: string;
    publisherWebsite: string;
    providesOriginalContent: boolean;
  };
}

// ============================================
// STORE LISTING
// ============================================

export interface StoreListing {
  /** App title (max 30 chars) */
  title: string;

  /** Short description (max 80 chars) */
  shortDescription: string;

  /** Full description (max 4000 chars) */
  fullDescription: string;

  /** Localized listings */
  localizations?: Record<
    string,
    {
      title?: string;
      shortDescription?: string;
      fullDescription?: string;
    }
  >;
}

// ============================================
// ASSETS
// ============================================

export interface AppAssets {
  /** App icon (512x512 PNG) */
  icon: string;

  /** Feature graphic (1024x500 PNG/JPEG) */
  featureGraphic: string;

  /** Phone screenshots (min 2, max 8) */
  phoneScreenshots: string[];

  /** 7-inch tablet screenshots */
  tablet7Screenshots?: string[];

  /** 10-inch tablet screenshots */
  tablet10Screenshots?: string[];

  /** Promo video (YouTube URL) */
  promoVideo?: string;
}

// ============================================
// COMPLETE APP CREATION CONFIG
// ============================================

export interface AppCreationConfig {
  /** Basic app information */
  basicInfo: AppBasicInfo;

  /** Content rating questionnaire answers */
  contentRating: ContentRatingAnswers;

  /** Data safety form */
  dataSafety: DataSafetyForm;

  /** Target audience */
  targetAudience: TargetAudience;

  /** Ads declaration */
  ads: AdsDeclaration;

  /** App category and contact */
  categoryAndContact: AppCategoryAndContact;

  /** Store listing */
  storeListing: StoreListing;

  /** App assets */
  assets: AppAssets;

  /** Financial features (optional) */
  financialFeatures?: FinancialFeatures;

  /** Government app (optional) */
  governmentApp?: GovernmentAppDeclaration;

  /** News app (optional) */
  newsApp?: NewsAppDeclaration;
}

// ============================================
// CREATION PROGRESS TRACKING
// ============================================

export interface CreationProgress {
  appCreated: boolean;
  storeListingComplete: boolean;
  contentRatingComplete: boolean;
  dataSafetyComplete: boolean;
  targetAudienceComplete: boolean;
  adsDeclarationComplete: boolean;
  categoryComplete: boolean;
  assetsUploaded: boolean;
  readyForReview: boolean;
}

export interface CreationResult {
  success: boolean;
  packageName?: string;
  progress: CreationProgress;
  errors: string[];
  warnings: string[];
  duration: number;
}
