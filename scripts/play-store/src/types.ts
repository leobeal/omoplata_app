/**
 * Play Store Metadata Automation Types
 */

export interface Listing {
  /** App title (max 30 characters) */
  title: string;
  /** Short description (max 80 characters) */
  shortDescription: string;
  /** Full description (max 4000 characters) */
  fullDescription: string;
  /** Search tags */
  tags?: string[];
}

export interface LocalizedListing {
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
}

export interface Contact {
  email: string;
  website?: string;
  phone?: string;
  privacyPolicyUrl?: string;
}

export interface Screenshots {
  /** Phone screenshots (min 2, max 8) */
  phone: string[];
  /** 7-inch tablet screenshots */
  tablet7?: string[];
  /** 10-inch tablet screenshots */
  tablet10?: string[];
  /** Chromebook screenshots */
  chromebook?: string[];
}

export interface Assets {
  /** 512x512 PNG app icon */
  icon?: string;
  /** 1024x500 feature graphic */
  featureGraphic?: string;
  /** Promo video YouTube URL */
  promoVideo?: string;
  /** Device screenshots */
  screenshots?: Screenshots;
}

export interface TenantConfig {
  /** Package name (e.g., com.omoplata.evolve) */
  packageName: string;
  /** Default language code */
  defaultLanguage: string;
  /** Main store listing */
  listing: Listing;
  /** Localized listings by language code */
  localizations?: Record<string, LocalizedListing>;
  /** Contact information */
  contact: Contact;
  /** Asset file paths */
  assets?: Assets;
}

export interface UpdateOptions {
  /** Specific tenant to update */
  tenant?: string;
  /** Update all tenants */
  all?: boolean;
  /** Sections to update */
  only?: UpdateSection[];
  /** Preview without making changes */
  dryRun?: boolean;
  /** Run browser in headless mode */
  headless?: boolean;
  /** Delay between actions (ms) */
  slowMo?: number;
  /** Delay between tenants (ms) */
  delay?: number;
  /** Verbose logging */
  verbose?: boolean;
}

export type UpdateSection =
  | 'listing'
  | 'screenshots'
  | 'graphics'
  | 'contact'
  | 'localizations'
  | 'all';

export interface ExecutionLog {
  timestamp: string;
  tenant: string;
  action: string;
  status: 'success' | 'failure' | 'skipped';
  message?: string;
  screenshot?: string;
}

export interface AutomationResult {
  success: boolean;
  tenant: string;
  sectionsUpdated: UpdateSection[];
  errors: string[];
  logs: ExecutionLog[];
  duration: number;
}
