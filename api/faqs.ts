import faqsData from '@/data/faqs.json';

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

/**
 * Fetch FAQs from the API
 * In production, this would call your backend API
 */
export const getFAQs = async (): Promise<FAQsResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // In production, replace this with actual API call:
  // const response = await fetch(`${API_BASE_URL}/faqs`);
  // const data = await response.json();
  // return data;

  return faqsData as FAQsResponse;
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
