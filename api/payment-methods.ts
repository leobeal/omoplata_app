import paymentMethodData from '@/data/payment-method.json';

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

export interface PaymentMethod {
  id: string;
  type: string;
  maskedIban: string;
  accountHolder: string;
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentMethodResponse {
  paymentMethod: PaymentMethod;
}

/**
 * Fetch the default payment method
 */
export const getPaymentMethod = async (): Promise<PaymentMethod | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  try {
    const response = transformToCamelCase<PaymentMethodResponse>(paymentMethodData);
    return response.paymentMethod;
  } catch {
    return null;
  }
};

/**
 * Fetch all payment methods for a user
 */
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  try {
    const response = transformToCamelCase<PaymentMethodResponse>(paymentMethodData);
    return [response.paymentMethod];
  } catch {
    return [];
  }
};
