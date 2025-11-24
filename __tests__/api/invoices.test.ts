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

  const createMockInvoice = (overrides?: Partial<Invoice>): Invoice => ({
    id: 'INV9e68962ad0',
    date: '2025-11-10',
    dueDate: '2025-11-11',
    status: 'pending',
    amount: 6.77,
    paymentMethod: 'Manual',
    paymentDetails: null,
    lineItems: [
      {
        id: '1000007',
        description: 'Mitgliedschaft Leo Beal - plan',
        quantity: 1,
        unitPrice: 6.77,
        total: 6.77,
      },
    ],
    subtotal: 6.77,
    tax: 0,
    total: 6.77,
    ...overrides,
  });

  const createMockApiResponse = (invoices: Invoice[], meta?: any) => ({
    data: {
      success: true,
      data: invoices,
      meta: {
        page: 1,
        limit: 20,
        total: invoices.length,
        lastPage: 1,
        ...meta,
      },
    },
    error: null,
  });

  describe('getInvoices', () => {
    it('should fetch invoices without parameters', async () => {
      const mockInvoices = [createMockInvoice()];
      const mockResponse = createMockApiResponse(mockInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(mockApi.get).toHaveBeenCalledWith(ENDPOINTS.INVOICES.LIST);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockInvoices[0]);
      expect(result.meta.total).toBe(1);
    });

    it('should fetch invoices with pagination parameters', async () => {
      const mockInvoices = [createMockInvoice()];
      const mockResponse = createMockApiResponse(mockInvoices, {
        page: 2,
        limit: 10,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      await getInvoices({ page: 2, limit: 10 });

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.INVOICES.LIST}?page=2&limit=10`);
    });

    it('should fetch invoices with status filter', async () => {
      const mockInvoices = [createMockInvoice({ status: 'paid' })];
      const mockResponse = createMockApiResponse(mockInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      await getInvoices({ status: 'paid' });

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.INVOICES.LIST}?status=paid`);
    });

    it('should fetch invoices with date range', async () => {
      const mockInvoices = [createMockInvoice()];
      const mockResponse = createMockApiResponse(mockInvoices);

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
      const mockInvoices = [createMockInvoice()];
      const mockResponse = createMockApiResponse(mockInvoices);

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
      const mockInvoices = [
        createMockInvoice({ id: 'INV001', amount: 10.0 }),
        createMockInvoice({ id: 'INV002', amount: 20.0 }),
        createMockInvoice({ id: 'INV003', amount: 30.0 }),
      ];
      const mockResponse = createMockApiResponse(mockInvoices, { total: 3 });

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
        const mockInvoices = [createMockInvoice({ status })];
        const mockResponse = createMockApiResponse(mockInvoices);

        mockApi.get.mockResolvedValue(mockResponse);

        const result = await getInvoices({ status });

        expect(result.data[0].status).toBe(status);
      }
    });

    it('should handle invoices with multiple line items', async () => {
      const mockInvoices = [
        createMockInvoice({
          lineItems: [
            {
              id: '1',
              description: 'Membership',
              quantity: 1,
              unitPrice: 50.0,
              total: 50.0,
            },
            {
              id: '2',
              description: 'Training Fee',
              quantity: 2,
              unitPrice: 10.0,
              total: 20.0,
            },
          ],
          subtotal: 70.0,
          tax: 5.6,
          total: 75.6,
        }),
      ];
      const mockResponse = createMockApiResponse(mockInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.data[0].lineItems).toHaveLength(2);
      expect(result.data[0].subtotal).toBe(70.0);
      expect(result.data[0].total).toBe(75.6);
    });

    it('should handle invoices with payment details', async () => {
      const mockInvoices = [
        createMockInvoice({
          paymentMethod: 'Credit Card',
          paymentDetails: '**** **** **** 1234',
        }),
      ];
      const mockResponse = createMockApiResponse(mockInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.data[0].paymentMethod).toBe('Credit Card');
      expect(result.data[0].paymentDetails).toBe('**** **** **** 1234');
    });

    it('should handle invoices with null payment details', async () => {
      const mockInvoices = [
        createMockInvoice({
          paymentMethod: 'Manual',
          paymentDetails: null,
        }),
      ];
      const mockResponse = createMockApiResponse(mockInvoices);

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
    it('should find invoice by ID', async () => {
      const targetInvoice = createMockInvoice({ id: 'INV123' });
      const mockInvoices = [
        createMockInvoice({ id: 'INV001' }),
        targetInvoice,
        createMockInvoice({ id: 'INV456' }),
      ];
      const mockResponse = createMockApiResponse(mockInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoiceById('INV123');

      expect(result).toEqual(targetInvoice);
      expect(result?.id).toBe('INV123');
    });

    it('should return null when invoice not found', async () => {
      const mockInvoices = [
        createMockInvoice({ id: 'INV001' }),
        createMockInvoice({ id: 'INV002' }),
      ];
      const mockResponse = createMockApiResponse(mockInvoices);

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
      const mockInvoices = [createMockInvoice()];
      const mockResponse = createMockApiResponse(mockInvoices, {
        page: 1,
        limit: 10,
        total: 1,
        lastPage: 1,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoicesPaginated();

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.INVOICES.LIST}?limit=10&page=1`);
      expect(result.invoices).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(1);
    });

    it('should fetch paginated invoices with custom parameters', async () => {
      const mockInvoices = Array(20)
        .fill(null)
        .map((_, i) => createMockInvoice({ id: `INV${i}` }));
      const mockResponse = createMockApiResponse(mockInvoices, {
        page: 2,
        limit: 20,
        total: 50,
        lastPage: 3,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoicesPaginated(20, 2);

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.INVOICES.LIST}?limit=20&page=2`);
      expect(result.invoices).toHaveLength(20);
      expect(result.hasMore).toBe(true); // page 2 < lastPage 3
      expect(result.total).toBe(50);
    });

    it('should indicate no more pages on last page', async () => {
      const mockInvoices = [createMockInvoice()];
      const mockResponse = createMockApiResponse(mockInvoices, {
        page: 3,
        limit: 10,
        total: 25,
        lastPage: 3,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoicesPaginated(10, 3);

      expect(result.hasMore).toBe(false); // page 3 === lastPage 3
    });

    it('should handle first page with multiple pages available', async () => {
      const mockInvoices = Array(10)
        .fill(null)
        .map((_, i) => createMockInvoice({ id: `INV${i}` }));
      const mockResponse = createMockApiResponse(mockInvoices, {
        page: 1,
        limit: 10,
        total: 100,
        lastPage: 10,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoicesPaginated(10, 1);

      expect(result.hasMore).toBe(true); // page 1 < lastPage 10
      expect(result.total).toBe(100);
    });
  });

  describe('getNextInvoice', () => {
    it('should fetch the next pending invoice', async () => {
      const nextInvoice = createMockInvoice({
        id: 'INV_NEXT',
        status: 'pending',
        dueDate: '2025-12-01',
      });
      const mockResponse = createMockApiResponse([nextInvoice]);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getNextInvoice();

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.INVOICES.LIST}?status=pending&limit=1`);
      expect(result).toEqual(nextInvoice);
      expect(result?.status).toBe('pending');
    });

    it('should return null when no pending invoices exist', async () => {
      const mockResponse = createMockApiResponse([]);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getNextInvoice();

      expect(result).toBeNull();
    });

    it('should return only the first pending invoice', async () => {
      const firstInvoice = createMockInvoice({
        id: 'INV_FIRST',
        status: 'pending',
        dueDate: '2025-12-01',
      });
      // API should only return 1 due to limit=1, but testing our code handles it
      const mockResponse = createMockApiResponse([firstInvoice]);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getNextInvoice();

      expect(result?.id).toBe('INV_FIRST');
    });
  });

  describe('Invoice data validation', () => {
    it('should handle invoices with zero tax', async () => {
      const mockInvoices = [
        createMockInvoice({
          subtotal: 100.0,
          tax: 0,
          total: 100.0,
        }),
      ];
      const mockResponse = createMockApiResponse(mockInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.data[0].tax).toBe(0);
      expect(result.data[0].total).toBe(result.data[0].subtotal);
    });

    it('should handle invoices with tax', async () => {
      const mockInvoices = [
        createMockInvoice({
          subtotal: 100.0,
          tax: 19.0,
          total: 119.0,
        }),
      ];
      const mockResponse = createMockApiResponse(mockInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.data[0].tax).toBe(19.0);
      expect(result.data[0].total).toBe(119.0);
    });

    it('should handle invoices with decimal amounts', async () => {
      const mockInvoices = [
        createMockInvoice({
          subtotal: 6.77,
          tax: 0,
          total: 6.77,
          amount: 6.77,
        }),
      ];
      const mockResponse = createMockApiResponse(mockInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.data[0].amount).toBe(6.77);
      expect(result.data[0].total).toBe(6.77);
    });

    it('should handle line items with quantity > 1', async () => {
      const mockInvoices = [
        createMockInvoice({
          lineItems: [
            {
              id: '1',
              description: 'Class Pass',
              quantity: 5,
              unitPrice: 15.0,
              total: 75.0,
            },
          ],
          subtotal: 75.0,
          total: 75.0,
        }),
      ];
      const mockResponse = createMockApiResponse(mockInvoices);

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      const lineItem = result.data[0].lineItems[0];
      expect(lineItem.quantity).toBe(5);
      expect(lineItem.unitPrice).toBe(15.0);
      expect(lineItem.total).toBe(75.0);
    });
  });

  describe('Meta pagination data', () => {
    it('should return correct pagination meta', async () => {
      const mockInvoices = Array(20)
        .fill(null)
        .map((_, i) => createMockInvoice({ id: `INV${i}` }));
      const mockResponse = createMockApiResponse(mockInvoices, {
        page: 2,
        limit: 20,
        total: 100,
        lastPage: 5,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices({ page: 2, limit: 20 });

      expect(result.meta).toEqual({
        page: 2,
        limit: 20,
        total: 100,
        lastPage: 5,
      });
    });

    it('should handle single page result', async () => {
      const mockInvoices = [createMockInvoice()];
      const mockResponse = createMockApiResponse(mockInvoices, {
        page: 1,
        limit: 20,
        total: 1,
        lastPage: 1,
      });

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getInvoices();

      expect(result.meta.page).toBe(1);
      expect(result.meta.lastPage).toBe(1);
    });
  });
});
