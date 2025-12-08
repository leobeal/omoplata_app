import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';

import { api, getAuthToken } from './client';
import { ENDPOINTS, getBaseUrl } from './config';

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
  currency: string;
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

/**
 * Download invoice PDF and open share dialog
 */
export const downloadInvoicePdf = async (invoiceId: string): Promise<void> => {
  const token = getAuthToken();
  console.log('[Invoice Download] Starting download for invoice:', invoiceId);
  console.log('[Invoice Download] Auth token present:', !!token);

  if (!token) {
    throw new Error('Not authenticated');
  }

  const downloadUrl = `${getBaseUrl()}${ENDPOINTS.INVOICES.DOWNLOAD(invoiceId)}`;
  console.log('[Invoice Download] Download URL:', downloadUrl);

  const file = new File(Paths.cache, `invoice-${invoiceId}.pdf`);
  console.log('[Invoice Download] Target file path:', file.uri);

  const response = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('[Invoice Download] Response status:', response.status);
  console.log('[Invoice Download] Response ok:', response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Invoice Download] Error response:', errorText);
    throw new Error(`Failed to download invoice: ${response.status} - ${errorText}`);
  }

  console.log('[Invoice Download] Reading response as base64...');
  const blob = await response.blob();
  console.log('[Invoice Download] Blob size:', blob.size);

  // Convert blob to base64 using FileReader (React Native compatible)
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  console.log('[Invoice Download] Writing file...');
  await file.write(base64, { encoding: 'base64' });
  console.log('[Invoice Download] File written successfully');

  const canShare = await Sharing.isAvailableAsync();
  console.log('[Invoice Download] Sharing available:', canShare);

  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  console.log('[Invoice Download] Opening share dialog...');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Invoice ${invoiceId}`,
  });
  console.log('[Invoice Download] Share dialog closed');
};
