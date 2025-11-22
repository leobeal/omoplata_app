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
  paymentDetails?: string;
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

/**
 * Fetch invoices with pagination
 */
export const getInvoicesPaginated = async (limit: number = 10, offset: number = 0): Promise<{ invoices: Invoice[]; hasMore: boolean; total: number }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const allInvoices = invoicesData as Invoice[];
  const total = allInvoices.length;
  const invoices = allInvoices.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return { invoices, hasMore, total };
};

/**
 * Fetch the next upcoming invoice
 */
export const getNextInvoice = async (): Promise<Invoice | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the next pending invoice
  const upcomingInvoices = (invoicesData as Invoice[])
    .filter((inv) => {
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && inv.status === 'pending';
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return upcomingInvoices.length > 0 ? upcomingInvoices[0] : null;
};
