import api from './client';

/**
 * Convert snake_case keys to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Transform snake_case object to camelCase
 */
function transformToCamelCase<T>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map(transformToCamelCase) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const camelKey = toCamelCase(key);
        acc[camelKey] = transformToCamelCase((obj as Record<string, unknown>)[key]);
        return acc;
      },
      {} as Record<string, unknown>
    ) as T;
  }
  return obj as T;
}

// Payment method details (for SEPA)
export interface PaymentMethodDetails {
  accountHolder: string;
  bankName: string;
  bic: string;
  maskedIban: string;
}

// Payment method type codes
export type PaymentMethodCode = 'sepa' | 'card' | 'paypal' | 'invoice';

export interface PaymentMethod {
  id: number;
  prefixedId: string;
  type: PaymentMethodCode;
  name: string;
  code: string;
  isActive: boolean;
  isCorrectlyConfigured: boolean;
  last4: string;
  details: PaymentMethodDetails;
  createdAt: string;
}

// Available payment method (for onboarding)
export interface AvailablePaymentMethod {
  id: number;
  code: PaymentMethodCode;
  type: PaymentMethodCode;
  requiresOnboarding: boolean;
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
  availablePaymentMethods: AvailablePaymentMethod[];
}

// API response types (snake_case from server)
interface PaymentMethodsApiResponse {
  payment_methods: {
    id: number;
    prefixed_id: string;
    type: PaymentMethodCode;
    name: string;
    code: string;
    is_active: boolean;
    is_correctly_configured: boolean;
    last4: string;
    details: {
      account_holder: string;
      bank_name: string;
      bic: string;
      masked_iban: string;
    };
    created_at: string;
  }[];
  available_payment_methods: {
    id: number;
    code: PaymentMethodCode;
    type: PaymentMethodCode;
    requires_onboarding: boolean;
  }[];
}

// In-flight request promise to deduplicate parallel calls
let paymentMethodsPromise: Promise<PaymentMethodsApiResponse | null> | null = null;

/**
 * Fetch payment methods data (deduplicates parallel calls)
 */
const fetchPaymentMethodsData = async (): Promise<PaymentMethodsApiResponse | null> => {
  // If a request is already in flight, return the same promise
  if (paymentMethodsPromise) {
    return paymentMethodsPromise;
  }

  // Start new request and store the promise
  paymentMethodsPromise = (async () => {
    const response = await api.get<PaymentMethodsApiResponse>('/payment-methods');

    if (response.error || !response.data) {
      return null;
    }

    return response.data;
  })();

  try {
    return await paymentMethodsPromise;
  } finally {
    // Clear the promise after completion so next call makes a fresh request
    paymentMethodsPromise = null;
  }
};

/**
 * Clear payment methods cache (call after creating/updating payment methods)
 */
export const clearPaymentMethodsCache = () => {
  paymentMethodsPromise = null;
};

/**
 * Fetch all payment methods for a user
 */
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const data = await fetchPaymentMethodsData();
  if (!data) return [];
  return transformToCamelCase<PaymentMethod[]>(data.payment_methods || []);
};

/**
 * Fetch available payment methods for onboarding
 */
export const getAvailablePaymentMethods = async (): Promise<AvailablePaymentMethod[]> => {
  const data = await fetchPaymentMethodsData();
  if (!data) return [];
  return transformToCamelCase<AvailablePaymentMethod[]>(data.available_payment_methods || []);
};

/**
 * Check if SEPA is available as a payment method
 */
export const isSepaAvailable = (availableMethods: AvailablePaymentMethod[]): boolean => {
  return availableMethods.some((m) => m.code === 'sepa');
};

/**
 * Fetch the primary/active payment method
 */
export const getPaymentMethod = async (): Promise<PaymentMethod | null> => {
  const methods = await getPaymentMethods();
  // Return the first active and correctly configured payment method
  return methods.find((m) => m.isActive && m.isCorrectlyConfigured) || methods[0] || null;
};

/**
 * Get display name for payment method type
 */
export const getPaymentMethodTypeName = (code: PaymentMethodCode): string => {
  const names: Record<PaymentMethodCode, string> = {
    sepa: 'SEPA Direct Debit',
    card: 'Credit/Debit Card',
    paypal: 'PayPal',
    invoice: 'Invoice',
  };
  return names[code] || code;
};

/**
 * Get icon name for payment method type
 */
export const getPaymentMethodIcon = (code: PaymentMethodCode): string => {
  const icons: Record<PaymentMethodCode, string> = {
    sepa: 'Building',
    card: 'CreditCard',
    paypal: 'Wallet',
    invoice: 'FileText',
  };
  return icons[code] || 'CreditCard';
};

// SEPA mandate submission data
export interface SepaSubmitData {
  accountHolder: string;
  iban: string;
}

export interface SepaSubmitResult {
  success: boolean;
  message?: string;
  paymentMethod?: PaymentMethod;
}

// API response for SEPA creation
interface SepaApiResponse {
  payment_method: {
    id: number;
    prefixed_id: string;
    type: string;
    name: string;
    code: string;
    is_active: boolean;
    is_correctly_configured: boolean;
    last4: string;
    details: {
      account_holder: string;
      bic: string;
      bank_name: string;
      masked_iban: string;
    };
    created_at: string;
  };
}

/**
 * Submit SEPA mandate to create a new payment method
 */
export const submitSepaMandate = async (data: SepaSubmitData): Promise<SepaSubmitResult> => {
  // Normalize IBAN (remove spaces, uppercase)
  const cleanIban = data.iban.replace(/\s/g, '').toUpperCase();

  const response = await api.post<SepaApiResponse>('/payment-methods/sepa', {
    iban: cleanIban,
    account_holder: data.accountHolder,
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to create payment method',
    };
  }

  // Clear cache so next fetch gets fresh data
  clearPaymentMethodsCache();

  // Transform snake_case response to camelCase
  const paymentMethod = transformToCamelCase<PaymentMethod>(response.data.payment_method);

  return { success: true, paymentMethod };
};
