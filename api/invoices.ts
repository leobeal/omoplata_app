import { api } from './client';
import { ENDPOINTS } from './config';

import {
  getFromCacheWithStale,
  saveToCache,
  CACHE_KEYS,
  CACHE_DURATIONS,
} from '@/utils/local-cache';

export type InvoiceStatus =
  | 'pending'
  | 'processing'
  | 'waiting_to_send'
  | 'sent_to_bank'
  | 'on_hold'
  | 'canceled'
  | 'paid'
  | 'refunded'
  | 'pending_retry'
  | 'overdue'
  | 'void';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  amount: number;
  paymentMethod: string;
  paymentDetails?: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface InvoicesParams {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  status?: InvoiceStatus;
}

export interface InvoicesResponse {
  success: boolean;
  data: Invoice[];
  meta: {
    page: number;
    limit: number;
    total: number;
    lastPage: number;
  };
}

/**
 * Fetch invoices with optional filtering and pagination
 * Uses cache for offline support
 */
export const getInvoices = async (params?: InvoicesParams): Promise<InvoicesResponse> => {
  const queryParams = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  const endpoint = queryParams
    ? `${ENDPOINTS.INVOICES.LIST}?${queryParams}`
    : ENDPOINTS.INVOICES.LIST;

  const cacheKey = `${CACHE_KEYS.INVOICES}:${queryParams || 'default'}`;

  try {
    const response = await api.get<InvoicesResponse>(endpoint);

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch invoices');
    }

    // Cache successful response
    await saveToCache(cacheKey, response.data);

    return response.data;
  } catch (error) {
    // Try to get cached data as fallback (allow stale for offline)
    const { data: cachedInvoices } = await getFromCacheWithStale<InvoicesResponse>(
      cacheKey,
      CACHE_DURATIONS.LONG
    );

    if (cachedInvoices) {
      console.log('[Invoices] Using cached data as offline fallback');
      return cachedInvoices;
    }

    // No cache available, re-throw original error
    throw error;
  }
};

/**
 * Fetch a single invoice by ID
 * Note: This endpoint may not be available in the API. Use getInvoices with filtering instead.
 */
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  const response = await getInvoices({ limit: 100 });
  const invoice = response.data.find((inv) => inv.id === id);
  return invoice || null;
};

/**
 * Fetch invoices with pagination
 */
export const getInvoicesPaginated = async (
  limit: number = 10,
  page: number = 1
): Promise<{ invoices: Invoice[]; hasMore: boolean; total: number }> => {
  const response = await getInvoices({ limit, page });

  return {
    invoices: response.data,
    hasMore: page < response.meta.lastPage,
    total: response.meta.total,
  };
};

/**
 * Fetch the next upcoming invoice
 */
export const getNextInvoice = async (): Promise<Invoice | null> => {
  const response = await getInvoices({ status: 'pending', limit: 1 });

  if (response.data.length === 0) {
    return null;
  }

  return response.data[0];
};
