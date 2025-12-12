import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import {
  getInvoices,
  getInvoiceById,
  getInvoicesPaginated,
  getNextInvoice,
  type Invoice,
  type InvoiceStatus,
} from '../../api/invoices';

// Mock API client
jest.mock('../../api/client');

const mockApi = api as jest.Mocked<typeof api>;

describe('Invoices API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Snake_case mock invoice (as API returns)
  const createMockApiInvoice = (overrides?: Record<string, unknown>) => ({
    id: 'INV9e68962ad0',
    date: '2025-11-10',
    due_date: '2025-11-11',
    status: 'pending',
    amount: 6.77,
    currency: 'EUR',
    payment_method: 'Manual',
    payment_details: null,
    line_items: [
      {
        id: '1000007',
        description: 'Mitgliedschaft Leo Beal - plan',
        quantity: 1,
        unit_price: 6.77,
        tax_rate: 0,
        total: 6.77,
      },
    ],
    subtotal: 6.77,
    tax: 0,
    total: 6.77,
    ...overrides,
  });

  // CamelCase expected invoice (after transformation)
  const createExpectedInvoice = (overrides?: Partial<Invoice>): Invoice => ({
    id: 'INV9e68962ad0',
    date: '2025-11-10',
    dueDate: '2025-11-11',
    status: 'pending',
    amount: 6.77,
    currency: 'EUR',
    paymentMethod: 'Manual',
    paymentDetails: null,
    lineItems: [
      {
        id: '1000007',
        description: 'Mitgliedschaft Leo Beal - plan',
        quantity: 1,
        unitPrice: 6.77,
        taxRate: 0,
        total: 6.77,
      },
    ],
    subtotal: 6.77,
    tax: 0,
    total: 6.77,
    ...overrides,
  });

  // Snake_case API response (as API returns)
  const createMockApiResponse = (invoices: ReturnType<typeof createMockApiInvoice>[], meta?: Record<string, unknown>) => ({
    data: {
      success: true,
      data: invoices,
      meta: {
        page: 1,
        limit: 20,
        total: invoices.length,
        last_page: 1,
        ...meta,
      },
    },
    error: null,
  });

  describe('getInvoices', () => {
    it('should fetch invoices without parameters and transform snake_case to camelCase', async () => {
      const mockApiInvoices = [createMockApiInvoice()];
      const mockResponse = createMockApiResponse(mockApiInvoices);
      const expectedInvoice = createExpectedInvoice();

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(mockApi.get).toHaveBeenCalledWith(ENDPOINTS.INVOICES.LIST);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      // Verify snake_case was transformed to camelCase
      expect(result.data[0]).toEqual(expectedInvoice);
      expect(result.data[0].dueDate).toBe('2025-11-11');
      expect(result.data[0].paymentMethod).toBe('Manual');
      expect(result.data[0].lineItems[0].unitPrice).toBe(6.77);
      expect(result.data[0].lineItems[0].taxRate).toBe(0);
      expect(result.meta.total).toBe(1);
      expect(result.meta.lastPage).toBe(1);
    });

    it('should fetch invoices with pagination parameters', async () => {
      const mockApiInvoices = [createMockApiInvoice()];
      const mockResponse = createMockApiResponse(mockApiInvoices, {
        page: 2,
        limit: 10,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      await getInvoices({ page: 2, limit: 10 });

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.INVOICES.LIST}?page=2&limit=10`);
    });

    it('should fetch invoices with status filter', async () => {
      const mockApiInvoices = [createMockApiInvoice({ status: 'paid' })];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      await getInvoices({ status: 'paid' });

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.INVOICES.LIST}?status=paid`);
    });

    it('should fetch invoices with date range', async () => {
      const mockApiInvoices = [createMockApiInvoice()];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      await getInvoices({
        start_date: '2025-11-01',
        end_date: '2025-11-30',
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        `${ENDPOINTS.INVOICES.LIST}?start_date=2025-11-01&end_date=2025-11-30`
      );
    });

    it('should fetch invoices with combined filters', async () => {
      const mockApiInvoices = [createMockApiInvoice()];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      await getInvoices({
        page: 1,
        limit: 20,
        status: 'pending',
        start_date: '2025-11-01',
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        `${ENDPOINTS.INVOICES.LIST}?page=1&limit=20&status=pending&start_date=2025-11-01`
      );
    });

    it('should handle multiple invoices', async () => {
      const mockApiInvoices = [
        createMockApiInvoice({ id: 'INV001', amount: 10.0 }),
        createMockApiInvoice({ id: 'INV002', amount: 20.0 }),
        createMockApiInvoice({ id: 'INV003', amount: 30.0 }),
      ];
      const mockResponse = createMockApiResponse(mockApiInvoices, { total: 3 });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.data).toHaveLength(3);
      expect(result.meta.total).toBe(3);
      expect(result.data[0].id).toBe('INV001');
      expect(result.data[1].id).toBe('INV002');
      expect(result.data[2].id).toBe('INV003');
    });

    it('should handle different invoice statuses', async () => {
      const statuses: InvoiceStatus[] = [
        'pending',
        'paid',
        'overdue',
        'void',
        'refunded',
        'processing',
      ];

      for (const status of statuses) {
        const mockApiInvoices = [createMockApiInvoice({ status })];
        const mockResponse = createMockApiResponse(mockApiInvoices);

        mockApi.get.mockResolvedValue(mockResponse);

        const result = await getInvoices({ status });

        expect(result.data[0].status).toBe(status);
      }
    });

    it('should handle invoices with multiple line items', async () => {
      const mockApiInvoices = [
        createMockApiInvoice({
          line_items: [
            {
              id: '1',
              description: 'Membership',
              quantity: 1,
              unit_price: 50.0,
              tax_rate: 19.0,
              total: 50.0,
            },
            {
              id: '2',
              description: 'Training Fee',
              quantity: 2,
              unit_price: 10.0,
              tax_rate: 19.0,
              total: 20.0,
            },
          ],
          subtotal: 70.0,
          tax: 5.6,
          total: 75.6,
        }),
      ];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      // Verify transformation from snake_case to camelCase
      expect(result.data[0].lineItems).toHaveLength(2);
      expect(result.data[0].lineItems[0].unitPrice).toBe(50.0);
      expect(result.data[0].lineItems[0].taxRate).toBe(19.0);
      expect(result.data[0].subtotal).toBe(70.0);
      expect(result.data[0].total).toBe(75.6);
    });

    it('should handle invoices with payment details', async () => {
      const mockApiInvoices = [
        createMockApiInvoice({
          payment_method: 'Credit Card',
          payment_details: '**** **** **** 1234',
        }),
      ];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      // Verify transformation from snake_case to camelCase
      expect(result.data[0].paymentMethod).toBe('Credit Card');
      expect(result.data[0].paymentDetails).toBe('**** **** **** 1234');
    });

    it('should handle invoices with null payment details', async () => {
      const mockApiInvoices = [
        createMockApiInvoice({
          payment_method: 'Manual',
          payment_details: null,
        }),
      ];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.data[0].paymentDetails).toBeNull();
    });

    it('should throw error when API returns error', async () => {
      mockApi.get.mockResolvedValue({
        data: null,
        error: 'Failed to fetch invoices',
      });

      await expect(getInvoices()).rejects.toThrow('Failed to fetch invoices');
    });

    it('should throw error on network failure', async () => {
      mockApi.get.mockResolvedValue({
        data: null,
        error: 'Network error',
      });

      await expect(getInvoices()).rejects.toThrow('Network error');
    });
  });

  describe('getInvoiceById', () => {
    it('should find invoice by ID and transform to camelCase', async () => {
      const targetApiInvoice = createMockApiInvoice({ id: 'INV123' });
      const mockApiInvoices = [
        createMockApiInvoice({ id: 'INV001' }),
        targetApiInvoice,
        createMockApiInvoice({ id: 'INV456' }),
      ];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoiceById('INV123');

      expect(result?.id).toBe('INV123');
      // Verify snake_case was transformed to camelCase
      expect(result?.dueDate).toBe('2025-11-11');
      expect(result?.paymentMethod).toBe('Manual');
      expect(result?.lineItems[0].unitPrice).toBe(6.77);
    });

    it('should return null when invoice not found', async () => {
      const mockApiInvoices = [
        createMockApiInvoice({ id: 'INV001' }),
        createMockApiInvoice({ id: 'INV002' }),
      ];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoiceById('INV999');

      expect(result).toBeNull();
    });

    it('should return null when no invoices exist', async () => {
      const mockResponse = createMockApiResponse([]);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoiceById('INV123');

      expect(result).toBeNull();
    });
  });

  describe('getInvoicesPaginated', () => {
    it('should fetch paginated invoices with default parameters', async () => {
      const mockApiInvoices = [createMockApiInvoice()];
      const mockResponse = createMockApiResponse(mockApiInvoices, {
        page: 1,
        limit: 10,
        total: 1,
        last_page: 1,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoicesPaginated();

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.INVOICES.LIST}?limit=10&page=1`);
      expect(result.invoices).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(1);
      // Verify transformation to camelCase
      expect(result.invoices[0].dueDate).toBe('2025-11-11');
    });

    it('should fetch paginated invoices with custom parameters', async () => {
      const mockApiInvoices = Array(20)
        .fill(null)
        .map((_, i) => createMockApiInvoice({ id: `INV${i}` }));
      const mockResponse = createMockApiResponse(mockApiInvoices, {
        page: 2,
        limit: 20,
        total: 50,
        last_page: 3,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoicesPaginated(20, 2);

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.INVOICES.LIST}?limit=20&page=2`);
      expect(result.invoices).toHaveLength(20);
      expect(result.hasMore).toBe(true); // page 2 < lastPage 3
      expect(result.total).toBe(50);
    });

    it('should indicate no more pages on last page', async () => {
      const mockApiInvoices = [createMockApiInvoice()];
      const mockResponse = createMockApiResponse(mockApiInvoices, {
        page: 3,
        limit: 10,
        total: 25,
        last_page: 3,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoicesPaginated(10, 3);

      expect(result.hasMore).toBe(false); // page 3 === lastPage 3
    });

    it('should handle first page with multiple pages available', async () => {
      const mockApiInvoices = Array(10)
        .fill(null)
        .map((_, i) => createMockApiInvoice({ id: `INV${i}` }));
      const mockResponse = createMockApiResponse(mockApiInvoices, {
        page: 1,
        limit: 10,
        total: 100,
        last_page: 10,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoicesPaginated(10, 1);

      expect(result.hasMore).toBe(true); // page 1 < lastPage 10
      expect(result.total).toBe(100);
    });
  });

  describe('getNextInvoice', () => {
    it('should fetch the next pending invoice and transform to camelCase', async () => {
      const nextApiInvoice = createMockApiInvoice({
        id: 'INV_NEXT',
        status: 'pending',
        due_date: '2025-12-01',
      });
      const mockResponse = createMockApiResponse([nextApiInvoice]);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getNextInvoice();

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.INVOICES.LIST}?status=pending&limit=1`);
      expect(result?.id).toBe('INV_NEXT');
      expect(result?.status).toBe('pending');
      // Verify transformation to camelCase
      expect(result?.dueDate).toBe('2025-12-01');
      expect(result?.paymentMethod).toBe('Manual');
    });

    it('should return null when no pending invoices exist', async () => {
      const mockResponse = createMockApiResponse([]);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getNextInvoice();

      expect(result).toBeNull();
    });

    it('should return only the first pending invoice', async () => {
      const firstApiInvoice = createMockApiInvoice({
        id: 'INV_FIRST',
        status: 'pending',
        due_date: '2025-12-01',
      });
      // API should only return 1 due to limit=1, but testing our code handles it
      const mockResponse = createMockApiResponse([firstApiInvoice]);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getNextInvoice();

      expect(result?.id).toBe('INV_FIRST');
    });
  });

  describe('Invoice data validation', () => {
    it('should handle invoices with zero tax', async () => {
      const mockApiInvoices = [
        createMockApiInvoice({
          subtotal: 100.0,
          tax: 0,
          total: 100.0,
        }),
      ];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.data[0].tax).toBe(0);
      expect(result.data[0].total).toBe(result.data[0].subtotal);
    });

    it('should handle invoices with tax', async () => {
      const mockApiInvoices = [
        createMockApiInvoice({
          subtotal: 100.0,
          tax: 19.0,
          total: 119.0,
        }),
      ];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.data[0].tax).toBe(19.0);
      expect(result.data[0].total).toBe(119.0);
    });

    it('should handle invoices with decimal amounts', async () => {
      const mockApiInvoices = [
        createMockApiInvoice({
          subtotal: 6.77,
          tax: 0,
          total: 6.77,
          amount: 6.77,
        }),
      ];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.data[0].amount).toBe(6.77);
      expect(result.data[0].total).toBe(6.77);
    });

    it('should handle line items with quantity > 1 and transform to camelCase', async () => {
      const mockApiInvoices = [
        createMockApiInvoice({
          line_items: [
            {
              id: '1',
              description: 'Class Pass',
              quantity: 5,
              unit_price: 15.0,
              tax_rate: 0,
              total: 75.0,
            },
          ],
          subtotal: 75.0,
          total: 75.0,
        }),
      ];
      const mockResponse = createMockApiResponse(mockApiInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      // Verify transformation to camelCase
      const lineItem = result.data[0].lineItems[0];
      expect(lineItem.quantity).toBe(5);
      expect(lineItem.unitPrice).toBe(15.0);
      expect(lineItem.taxRate).toBe(0);
      expect(lineItem.total).toBe(75.0);
    });
  });

  describe('Meta pagination data', () => {
    it('should return correct pagination meta and transform to camelCase', async () => {
      const mockApiInvoices = Array(20)
        .fill(null)
        .map((_, i) => createMockApiInvoice({ id: `INV${i}` }));
      const mockResponse = createMockApiResponse(mockApiInvoices, {
        page: 2,
        limit: 20,
        total: 100,
        last_page: 5,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices({ page: 2, limit: 20 });

      // Verify meta is transformed to camelCase
      expect(result.meta).toEqual({
        page: 2,
        limit: 20,
        total: 100,
        lastPage: 5,
      });
    });

    it('should handle single page result', async () => {
      const mockApiInvoices = [createMockApiInvoice()];
      const mockResponse = createMockApiResponse(mockApiInvoices, {
        page: 1,
        limit: 20,
        total: 1,
        last_page: 1,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.meta.page).toBe(1);
      expect(result.meta.lastPage).toBe(1);
    });
  });
});
