import {
  getGraduations,
  getGraduationsWithChildren,
  Graduation,
  GraduationResponse,
} from '@/api/graduations';

// Mock the API client
jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// Mock the cache utilities
jest.mock('@/utils/local-cache', () => ({
  CACHE_KEYS: {
    GRADUATIONS: '@omoplata/cache/graduations',
  },
  CACHE_DURATIONS: {
    MEDIUM: 3600000,
  },
  getFromCache: jest.fn().mockResolvedValue(null),
  getFromCacheWithStale: jest.fn().mockResolvedValue({ data: null, isStale: false }),
  saveToCache: jest.fn().mockResolvedValue(undefined),
}));

import api from '@/api/client';

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>;

// Mock API response
const mockApiResponse = {
  graduations: [
    {
      id: 1,
      discipline: 'Brazilian Jiu-Jitsu',
      current_belt: 'Blue Belt',
      current_belt_key: 'blue',
      belt_config: {
        colors: [{ color: '#1E40AF', stop: [0, 1] }],
        has_graduation_bar: true,
        stripe_layers: [{ max_count: 4, color: '#FFFFFF', positions: [0.15, 0.35, 0.55, 0.75] }],
        total_stripes: 4,
      },
      next_belt: 'Purple Belt',
      next_belt_key: 'purple',
      next_belt_config: {
        colors: [{ color: '#6B21A8', stop: [0, 1] }],
        has_graduation_bar: true,
      },
      stripes: 2,
      max_stripes: 4,
      last_promotion: '2024-06-15',
    },
    {
      id: 2,
      discipline: 'No-Gi',
      current_belt: 'Purple Belt',
      current_belt_key: 'purple',
      belt_config: {
        colors: [{ color: '#6B21A8', stop: [0, 1] }],
        has_graduation_bar: true,
        stripe_layers: [{ max_count: 4, color: '#FFFFFF', positions: [0.15, 0.35, 0.55, 0.75] }],
        total_stripes: 4,
      },
      next_belt: 'Brown Belt',
      next_belt_key: 'brown',
      next_belt_config: {
        colors: [{ color: '#78350F', stop: [0, 1] }],
        has_graduation_bar: true,
      },
      stripes: 4,
      max_stripes: 4,
      last_promotion: '2024-03-20',
    },
  ],
  children: [
    {
      id: 123,
      prefixed_id: 'USR-abc123',
      first_name: 'Emma',
      last_name: 'Silva',
      full_name: 'Emma Silva',
      graduations: [
        {
          id: 5,
          discipline: 'Kids BJJ',
          current_belt: 'Grey-White Belt',
          current_belt_key: 'grey-white',
          belt_config: {
            colors: [
              { color: '#6B7280', stop: [0, 0.3] },
              { color: '#FFFFFF', stop: [0.3, 0.7] },
              { color: '#6B7280', stop: [0.7, 1] },
            ],
            has_graduation_bar: true,
            stripe_layers: [
              { max_count: 4, color: '#FFFFFF', positions: [0.15, 0.35, 0.55, 0.75] },
              { max_count: 4, color: '#DA1F26', positions: [0.15, 0.35, 0.55, 0.75] },
              { max_count: 3, color: '#FFD700', positions: [0.15, 0.35, 0.55] },
            ],
            total_stripes: 11,
          },
          next_belt: 'Yellow Belt',
          next_belt_key: 'yellow',
          next_belt_config: {
            colors: [{ color: '#EAB308', stop: [0, 1] }],
            has_graduation_bar: true,
          },
          stripes: 3,
          max_stripes: 11,
          last_promotion: '2024-09-01',
        },
      ],
    },
  ],
};

describe('Graduations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockResolvedValue({
      data: mockApiResponse,
      error: null,
    });
  });

  describe('getGraduations', () => {
    it('should return graduations response', async () => {
      const response = await getGraduations();

      expect(response).toHaveProperty('graduations');
      expect(Array.isArray(response.graduations)).toBe(true);
      expect(response.graduations.length).toBeGreaterThan(0);
    });

    it('should return graduations with required fields', async () => {
      const response = await getGraduations();
      const graduation = response.graduations[0];

      expect(graduation).toHaveProperty('id');
      expect(graduation).toHaveProperty('discipline');
      expect(graduation).toHaveProperty('beltKey');
      expect(graduation).toHaveProperty('beltConfig');
      expect(graduation).toHaveProperty('currentBelt');
      expect(graduation).toHaveProperty('stripes');
      expect(graduation).toHaveProperty('maxStripes');
    });

    it('should transform snake_case to camelCase', async () => {
      const response = await getGraduations();
      const graduation = response.graduations[0];

      // These should be camelCase in the response
      expect(graduation).toHaveProperty('beltKey');
      expect(graduation).toHaveProperty('beltConfig');
      expect(graduation).toHaveProperty('currentBelt');
      expect(graduation).toHaveProperty('nextBelt');
      expect(graduation).toHaveProperty('maxStripes');
      expect(graduation).toHaveProperty('lastPromotion');

      // These should NOT exist (they are the snake_case versions)
      expect(graduation).not.toHaveProperty('belt_key');
      expect(graduation).not.toHaveProperty('belt_config');
      expect(graduation).not.toHaveProperty('current_belt');
      expect(graduation).not.toHaveProperty('next_belt');
      expect(graduation).not.toHaveProperty('max_stripes');
      expect(graduation).not.toHaveProperty('last_promotion');
    });

    it('should transform beltConfig properly', async () => {
      const response = await getGraduations();
      const graduation = response.graduations[0];

      expect(graduation.beltConfig).toHaveProperty('colors');
      expect(Array.isArray(graduation.beltConfig.colors)).toBe(true);
      expect(graduation.beltConfig).toHaveProperty('hasGraduationBar');

      // Verify stripe layers are transformed
      if (graduation.beltConfig.stripeLayers) {
        expect(Array.isArray(graduation.beltConfig.stripeLayers)).toBe(true);
      }
    });

    it('should have valid stripe values', async () => {
      const response = await getGraduations();

      response.graduations.forEach((graduation: Graduation) => {
        expect(graduation.stripes).toBeGreaterThanOrEqual(0);
        expect(graduation.stripes).toBeLessThanOrEqual(graduation.maxStripes);
      });
    });

    it('should call API without include_children by default', async () => {
      await getGraduations();

      expect(mockApiGet).toHaveBeenCalledWith('/graduations');
    });

    it('should call API with include_children when specified', async () => {
      await getGraduations({ includeChildren: true });

      expect(mockApiGet).toHaveBeenCalledWith('/graduations?include_children=true');
    });
  });

  describe('getGraduationsWithChildren', () => {
    it('should return graduations and children', async () => {
      const response = await getGraduationsWithChildren({ includeChildren: true });

      expect(response).toHaveProperty('graduations');
      expect(response).toHaveProperty('children');
      expect(Array.isArray(response.graduations)).toBe(true);
      expect(Array.isArray(response.children)).toBe(true);
    });

    it('should return children with graduations', async () => {
      const response = await getGraduationsWithChildren({ includeChildren: true });
      const children = response.children || [];

      if (children.length > 0) {
        const child = children[0];
        expect(child).toHaveProperty('id');
        expect(child).toHaveProperty('firstName');
        expect(child).toHaveProperty('lastName');
        expect(child).toHaveProperty('fullName');
        expect(child).toHaveProperty('prefixedId');
        expect(child).toHaveProperty('graduations');
        expect(Array.isArray(child.graduations)).toBe(true);
      }
    });

    it('should transform child properties from snake_case to camelCase', async () => {
      const response = await getGraduationsWithChildren({ includeChildren: true });
      const children = response.children || [];

      if (children.length > 0) {
        const child = children[0];
        // These should be camelCase
        expect(child).toHaveProperty('prefixedId');
        expect(child).toHaveProperty('firstName');
        expect(child).toHaveProperty('lastName');
        expect(child).toHaveProperty('fullName');

        // These should NOT exist (snake_case versions)
        expect(child).not.toHaveProperty('prefixed_id');
        expect(child).not.toHaveProperty('first_name');
        expect(child).not.toHaveProperty('last_name');
        expect(child).not.toHaveProperty('full_name');
      }
    });
  });

  describe('Belt config validation', () => {
    it('should have valid belt config with colors array', async () => {
      const response = await getGraduations();

      response.graduations.forEach((graduation: Graduation) => {
        expect(graduation.beltConfig).toBeDefined();
        expect(graduation.beltConfig.colors).toBeDefined();
        expect(graduation.beltConfig.colors.length).toBeGreaterThan(0);
      });
    });

    it('should have valid beltKey for translations', async () => {
      const response = await getGraduations();

      response.graduations.forEach((graduation: Graduation) => {
        expect(graduation.beltKey).toBeDefined();
        expect(typeof graduation.beltKey).toBe('string');
        expect(graduation.beltKey.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error handling', () => {
    it('should return empty graduations on API error with no cache', async () => {
      mockApiGet.mockResolvedValueOnce({
        data: null,
        error: 'Network error',
      });

      const response = await getGraduations();

      expect(response.graduations).toEqual([]);
      expect(response.children).toEqual([]);
    });
  });
});
