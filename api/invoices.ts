import invoicesData from '@/data/invoices.json';

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
  status: 'paid' | 'pending' | 'overdue';
  amount: number;
  paymentMethod: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Fetch all invoices
 */
export const getInvoices = async (): Promise<Invoice[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return invoicesData as Invoice[];
};

/**
 * Fetch a single invoice by ID
 */
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  const invoice = invoicesData.find((inv) => inv.id === id);
  return invoice ? (invoice as Invoice) : null;
};
