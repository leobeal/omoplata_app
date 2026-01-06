import { api } from './client';
import { ENDPOINTS } from './config';

export interface FAQ {
  question: string;
  answer: string;
}

export type FAQType = 'club' | 'app';

export interface FAQCategory {
  id: string;
  title: string;
  type: FAQType;
  faqs: FAQ[];
}

export interface FAQsResponse {
  categories: FAQCategory[];
  lastUpdated: string;
}

// API Response types (snake_case from backend)
interface ApiFAQ {
  question: string;
  answer: string;
}

interface ApiFAQCategory {
  id: string;
  title: string;
  faqs: ApiFAQ[];
}

interface ApiFAQsResponse {
  categories: ApiFAQCategory[];
  last_updated?: string;
}

/**
 * Transform API response to app format
 */
const transformCategory = (category: ApiFAQCategory, type: FAQType): FAQCategory => ({
  id: category.id,
  title: category.title,
  type,
  faqs: category.faqs.map((faq) => ({
    question: faq.question,
    answer: faq.answer,
  })),
});

/**
 * Fetch club FAQs from the API
 */
export const getClubFAQs = async (): Promise<FAQCategory[]> => {
  try {
    const response = await api.get<ApiFAQsResponse>(ENDPOINTS.FAQS.CLUB);
    if (response.error || !response.data) {
      console.error('Failed to fetch club FAQs:', response.error);
      return [];
    }
    return response.data.categories?.map((cat) => transformCategory(cat, 'club')) || [];
  } catch (error) {
    console.error('Failed to fetch club FAQs:', error);
    return [];
  }
};

/**
 * Fetch app FAQs from the API
 */
export const getAppFAQs = async (): Promise<FAQCategory[]> => {
  try {
    const response = await api.get<ApiFAQsResponse>(ENDPOINTS.FAQS.APP);
    if (response.error || !response.data) {
      console.error('Failed to fetch app FAQs:', response.error);
      return [];
    }
    return response.data.categories?.map((cat) => transformCategory(cat, 'app')) || [];
  } catch (error) {
    console.error('Failed to fetch app FAQs:', error);
    return [];
  }
};

/**
 * Fetch all FAQs (club + app) from the API
 */
export const getFAQs = async (): Promise<FAQsResponse> => {
  const [clubResponse, appResponse] = await Promise.all([
    api.get<ApiFAQsResponse>(ENDPOINTS.FAQS.CLUB),
    api.get<ApiFAQsResponse>(ENDPOINTS.FAQS.APP),
  ]);

  const clubCategories =
    clubResponse.data?.categories?.map((cat) => transformCategory(cat, 'club')) || [];
  const appCategories =
    appResponse.data?.categories?.map((cat) => transformCategory(cat, 'app')) || [];

  // Use the most recent last_updated from either response, or current date as fallback
  const clubUpdated = clubResponse.data?.last_updated;
  const appUpdated = appResponse.data?.last_updated;
  const lastUpdated =
    clubUpdated && appUpdated
      ? new Date(clubUpdated) > new Date(appUpdated)
        ? clubUpdated
        : appUpdated
      : clubUpdated || appUpdated || new Date().toISOString();

  return {
    categories: [...clubCategories, ...appCategories],
    lastUpdated,
  };
};

/**
 * Search FAQs by keyword
 */
export const searchFAQs = async (query: string): Promise<FAQ[]> => {
  const data = await getFAQs();
  const searchTerm = query.toLowerCase();

  const results: FAQ[] = [];

  data.categories.forEach((category) => {
    category.faqs.forEach((faq) => {
      if (
        faq.question.toLowerCase().includes(searchTerm) ||
        faq.answer.toLowerCase().includes(searchTerm)
      ) {
        results.push(faq);
      }
    });
  });

  return results;
};
