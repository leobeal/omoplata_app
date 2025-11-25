import {
  getMembership,
  downloadContract,
  getPrimaryMember,
  getMonthlyEquivalent,
  formatCurrency,
} from '../../api/membership';

describe('Membership API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMembership', () => {
    it('should return membership data', async () => {
      const membership = await getMembership();

      expect(membership).toBeDefined();
      expect(membership.id).toBe('mem_abc123');
      expect(membership.status).toBe('active');
    });

    it('should have valid plan details', async () => {
      const membership = await getMembership();

      expect(membership.plan).toBeDefined();
      expect(membership.plan.id).toBe('plan_premium');
      expect(membership.plan.name).toBe('Premium Annual');
      expect(membership.plan.chargeInterval).toBe('yearly');
      expect(membership.plan.contractDuration).toBe(12);
    });

    it('should have pricing information', async () => {
      const membership = await getMembership();

      expect(membership.plan.amount).toBe(959.88);
      expect(membership.plan.currency).toBe('EUR');
      expect(membership.amount).toBe(79.99);
    });

    it('should have members array', async () => {
      const membership = await getMembership();

      expect(membership.members).toBeDefined();
      expect(Array.isArray(membership.members)).toBe(true);
      expect(membership.members.length).toBeGreaterThan(0);

      const primaryMember = membership.members[0];
      expect(primaryMember.id).toBe('usr_001');
      expect(primaryMember.prefixedId).toBe('MEM-2023-001234');
      expect(primaryMember.fullName).toBe('John Doe');
      expect(primaryMember.role).toBe('primary');
    });

    it('should have payer information', async () => {
      const membership = await getMembership();

      expect(membership.payer).toBeDefined();
      expect(membership.payer.id).toBe('usr_001');
      expect(membership.payer.fullName).toBe('John Doe');
    });

    it('should have date fields', async () => {
      const membership = await getMembership();

      expect(membership.startsAt).toBeDefined();
      expect(membership.endsAt).toBeDefined();
      expect(membership.renewsAt).toBeDefined();
      expect(membership.chargeStartsAt).toBeDefined();
      expect(membership.renewsAutomatically).toBe(true);
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      await getMembership();
      const endTime = Date.now();

      const delay = endTime - startTime;
      expect(delay).toBeGreaterThanOrEqual(300);
    });
  });

  describe('downloadContract', () => {
    it('should return contract PDF URL', async () => {
      const membershipId = 'mem_abc123';
      const pdfUrl = await downloadContract(membershipId);

      expect(pdfUrl).toBeDefined();
      expect(typeof pdfUrl).toBe('string');
      expect(pdfUrl).toContain(membershipId);
      expect(pdfUrl).toContain('/download');
    });

    it('should simulate API delay for download', async () => {
      const startTime = Date.now();
      await downloadContract('mem_abc123');
      const endTime = Date.now();

      const delay = endTime - startTime;
      expect(delay).toBeGreaterThanOrEqual(1000);
    });

    it('should generate unique URLs for different memberships', async () => {
      const url1 = await downloadContract('mem_abc123');
      const url2 = await downloadContract('mem_xyz789');

      expect(url1).not.toBe(url2);
    });
  });

  describe('getPrimaryMember', () => {
    it('should return the primary member', async () => {
      const membership = await getMembership();
      const primaryMember = getPrimaryMember(membership);

      expect(primaryMember).toBeDefined();
      expect(primaryMember?.role).toBe('primary');
      expect(primaryMember?.fullName).toBe('John Doe');
    });

    it('should return undefined if no primary member exists', () => {
      const membershipWithNoPrimary = {
        id: 'test',
        status: 'active' as const,
        startsAt: '',
        chargeStartsAt: '',
        endsAt: '',
        renewsAt: '',
        renewsAutomatically: true,
        amount: 0,
        currency: 'EUR',
        plan: {
          id: 'test',
          name: 'Test',
          priceId: 'test',
          priceName: 'Test',
          amount: 0,
          currency: 'EUR',
          chargeInterval: 'monthly' as const,
          contractDuration: 1,
        },
        members: [
          {
            id: 'usr_002',
            prefixedId: 'MEM-002',
            firstName: 'Jane',
            lastName: 'Doe',
            fullName: 'Jane Doe',
            role: 'secondary' as const,
          },
        ],
        payer: { id: 'usr_002', prefixedId: 'MEM-002', fullName: 'Jane Doe' },
      };

      const primaryMember = getPrimaryMember(membershipWithNoPrimary);
      expect(primaryMember).toBeUndefined();
    });
  });

  describe('getMonthlyEquivalent', () => {
    it('should calculate monthly equivalent for yearly plans', () => {
      const plan = {
        id: 'test',
        name: 'Test',
        priceId: 'test',
        priceName: 'Test',
        amount: 1200,
        currency: 'EUR',
        chargeInterval: 'yearly' as const,
        contractDuration: 12,
      };

      expect(getMonthlyEquivalent(plan)).toBe(100);
    });

    it('should return same amount for monthly plans', () => {
      const plan = {
        id: 'test',
        name: 'Test',
        priceId: 'test',
        priceName: 'Test',
        amount: 100,
        currency: 'EUR',
        chargeInterval: 'monthly' as const,
        contractDuration: 1,
      };

      expect(getMonthlyEquivalent(plan)).toBe(100);
    });

    it('should calculate monthly equivalent for weekly plans', () => {
      const plan = {
        id: 'test',
        name: 'Test',
        priceId: 'test',
        priceName: 'Test',
        amount: 25,
        currency: 'EUR',
        chargeInterval: 'weekly' as const,
        contractDuration: 1,
      };

      // 25 * 52 / 12 = 108.33
      expect(getMonthlyEquivalent(plan)).toBeCloseTo(108.33, 2);
    });
  });

  describe('formatCurrency', () => {
    it('should format EUR currency', () => {
      const formatted = formatCurrency(100, 'EUR');
      expect(formatted).toContain('100');
      expect(formatted).toContain('€');
    });

    it('should format USD currency', () => {
      const formatted = formatCurrency(100, 'USD');
      expect(formatted).toContain('100');
      expect(formatted).toContain('$');
    });

    it('should handle decimal amounts', () => {
      const formatted = formatCurrency(99.99, 'EUR');
      expect(formatted).toContain('99.99');
    });
  });
});
