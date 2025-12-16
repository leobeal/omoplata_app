import api from './client';
import { ENDPOINTS } from './config';

import {
  CACHE_KEYS,
  CACHE_DURATIONS,
  getFromCache,
  getFromCacheWithStale,
  saveToCache,
} from '@/utils/local-cache';

// API response types (snake_case - matches backend JSON)
interface ApiStripeLayer {
  count: number;
  color: string;
}

interface ApiBeltConfig {
  colors: string[];
  stripe_layers?: ApiStripeLayer[];
  has_graduation_bar?: boolean;
  split_vertical?: boolean;
}

interface ApiPromotion {
  date: string;
  from_belt: string;
  to_belt: string;
  stripes?: number;
}

interface ApiGraduation {
  id: number;
  discipline: string;
  current_belt: string;
  belt_key: string;
  belt_config: ApiBeltConfig;
  next_belt?: string;
  next_belt_config?: ApiBeltConfig;
  stripes: number;
  max_stripes: number;
  classes_attended?: number;
  classes_required?: number;
  show_progress?: boolean;
  last_promotion?: string;
  promotion_history?: ApiPromotion[];
}

interface ApiChild {
  id: number;
  prefixed_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  graduations: ApiGraduation[];
}

interface ApiGraduationResponse {
  graduations: ApiGraduation[];
  children?: ApiChild[];
}

// Internal types (camelCase - used in app)
export interface StripeLayer {
  count: number;
  color: string;
}

export interface BeltConfig {
  colors: string[];
  stripeLayers?: StripeLayer[];
  hasGraduationBar?: boolean;
  splitVertical?: boolean;
}

export interface Promotion {
  date: string;
  fromBelt: string;
  toBelt: string;
  stripes?: number;
}

export interface Graduation {
  id: number;
  discipline: string;
  currentBelt: string;
  beltKey: string;
  beltConfig: BeltConfig;
  nextBelt?: string;
  nextBeltConfig?: BeltConfig;
  stripes: number;
  maxStripes: number;
  classesAttended?: number;
  classesRequired?: number;
  showProgress?: boolean;
  lastPromotion?: string;
  promotionHistory?: Promotion[];
}

export interface GraduationResponse {
  graduations: Graduation[];
  children?: ChildWithGraduations[];
}

export interface ChildWithGraduations {
  id: number;
  prefixedId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  graduations: Graduation[];
}

// Transform functions (snake_case -> camelCase)
const transformPromotion = (api: ApiPromotion): Promotion => ({
  date: api.date,
  fromBelt: api.from_belt,
  toBelt: api.to_belt,
  stripes: api.stripes,
});

const transformBeltConfig = (api: ApiBeltConfig): BeltConfig => ({
  colors: api.colors,
  stripeLayers: api.stripe_layers,
  hasGraduationBar: api.has_graduation_bar,
  splitVertical: api.split_vertical,
});

const transformGraduation = (api: ApiGraduation): Graduation => ({
  id: api.id,
  discipline: api.discipline,
  currentBelt: api.current_belt,
  beltKey: api.belt_key,
  beltConfig: transformBeltConfig(api.belt_config),
  nextBelt: api.next_belt,
  nextBeltConfig: api.next_belt_config ? transformBeltConfig(api.next_belt_config) : undefined,
  stripes: api.stripes,
  maxStripes: api.max_stripes,
  classesAttended: api.classes_attended,
  classesRequired: api.classes_required,
  showProgress: api.show_progress,
  lastPromotion: api.last_promotion,
  promotionHistory: api.promotion_history?.map(transformPromotion),
});

const transformChild = (api: ApiChild): ChildWithGraduations => ({
  id: api.id,
  prefixedId: api.prefixed_id,
  firstName: api.first_name,
  lastName: api.last_name,
  fullName: api.full_name,
  graduations: api.graduations.map(transformGraduation),
});

const transformResponse = (data: ApiGraduationResponse): GraduationResponse => ({
  graduations: data.graduations.map(transformGraduation),
  children: data.children?.map(transformChild),
});

export interface GetGraduationsParams {
  includeChildren?: boolean;
}

/**
 * Build cache key based on params
 */
const buildCacheKey = (includeChildren: boolean): string => {
  return includeChildren ? `${CACHE_KEYS.GRADUATIONS}_with_children` : CACHE_KEYS.GRADUATIONS;
};

/**
 * Fetch graduations from API with caching
 * @param params.includeChildren - If true, includes children's graduations (for responsible users)
 */
export const getGraduations = async (
  params?: GetGraduationsParams
): Promise<GraduationResponse> => {
  const includeChildren = params?.includeChildren ?? false;
  const cacheKey = buildCacheKey(includeChildren);

  // Try to get from cache first
  // TODO: Change back to CACHE_DURATIONS.MEDIUM before production
  const cached = await getFromCache<GraduationResponse>(cacheKey, 1000);
  if (cached) {
    return cached;
  }

  // Build query params
  const queryParams = new URLSearchParams();
  if (includeChildren) {
    queryParams.append('include_children', 'true');
  }
  const queryString = queryParams.toString();
  const endpoint = `${ENDPOINTS.GRADUATIONS.LIST}${queryString ? `?${queryString}` : ''}`;

  // Fetch from API
  const response = await api.get<ApiGraduationResponse>(endpoint);

  if (response.error || !response.data) {
    // On error, try to use stale cache as fallback
    // TODO: Change back to CACHE_DURATIONS.MEDIUM before production
    const { data: staleData } = await getFromCacheWithStale<GraduationResponse>(cacheKey, 1000);
    if (staleData) {
      console.warn('[Graduations] API failed, using stale cache:', response.error);
      return staleData;
    }
    // Return empty response if no cache available
    console.error('[Graduations] API failed and no cache available:', response.error);
    return { graduations: [], children: [] };
  }

  // Transform and cache the response
  const transformed = transformResponse(response.data);
  await saveToCache(cacheKey, transformed);

  return transformed;
};

/**
 * Fetch all graduations including children's graduations
 * @deprecated Use getGraduations({ includeChildren: true }) instead
 */
export const getGraduationsWithChildren = async (
  params?: GetGraduationsParams
): Promise<GraduationResponse> => {
  return getGraduations(params);
};

/**
 * Refresh graduations data (bypasses cache)
 */
export const refreshGraduations = async (
  params?: GetGraduationsParams
): Promise<GraduationResponse> => {
  const includeChildren = params?.includeChildren ?? false;
  const cacheKey = buildCacheKey(includeChildren);

  // Build query params
  const queryParams = new URLSearchParams();
  if (includeChildren) {
    queryParams.append('include_children', 'true');
  }
  const queryString = queryParams.toString();
  const endpoint = `${ENDPOINTS.GRADUATIONS.LIST}${queryString ? `?${queryString}` : ''}`;

  // Fetch from API (skip cache)
  const response = await api.get<ApiGraduationResponse>(endpoint);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch graduations');
  }

  // Transform and cache the response
  const transformed = transformResponse(response.data);
  await saveToCache(cacheKey, transformed);

  return transformed;
};
