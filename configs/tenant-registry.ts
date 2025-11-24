/**
 * Tenant registry for runtime configuration lookup
 * This provides tenant-specific config when a tenant is selected at runtime
 * (as opposed to build-time via TENANT env variable)
 */

export interface TenantConfig {
  name: string;
  loginBackground?: string;
  theme?: {
    primary: string;
    secondary: string;
  };
}

/**
 * Registry of known tenants and their runtime configuration
 * Add new tenants here as they are onboarded
 */
const tenantRegistry: Record<string, TenantConfig> = {
  'evolve-grappling': {
    name: 'Evolve',
    loginBackground:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2000&auto=format&fit=crop',
    theme: {
      primary: '#4CAF50',
      secondary: '#8BC34A',
    },
  },
  'sparta-aachen': {
    name: 'Sparta',
    loginBackground:
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=2000&auto=format&fit=crop',
    theme: {
      primary: '#D32F2F',
      secondary: '#FF5722',
    },
  },
};

/**
 * Get tenant configuration by slug
 * Returns undefined if tenant is not in registry
 */
export const getTenantConfig = (slug: string): TenantConfig | undefined => {
  return tenantRegistry[slug];
};

/**
 * Check if a tenant slug is known in the registry
 */
export const isTenantKnown = (slug: string): boolean => {
  return slug in tenantRegistry;
};
