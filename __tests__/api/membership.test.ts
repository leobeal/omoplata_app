import {
  getMembership,
  downloadContract,
  getPrimaryMember,
  getMonthlyEquivalent,
  formatCurrency,
  parseDurationToMonths,
  getIntervalLabel,
} from '../../api/membership';

describe('Membership API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMembership', () => {
    it('should return membership data', async () => {
      const membership = await getMembership();

      expect(membership).toBeDefined();
      expect(typeof membership.id).toBe('number');
      expect(membership.status).toBe('new');
    });

    it('should have valid plan details', async () => {
      const membership = await getMembership();

      expect(membership.plan).toBeDefined();
      expect(typeof membership.plan.id).toBe('number');
      expect(membership.plan.name).toBe('Unbegrenzt');
      expect(membership.plan.chargeInterval).toBe('P1M');
      expect(membership.plan.contractDuration).toBe('P6M');
    });

    it('should have pricing information', async () => {
      const membership = await getMembership();

      expect(membership.plan.amount).toBe(89);
      expect(membership.plan.currency).toBe('EUR');
      expect(membership.amount).toBe(89);
    });

    it('should have members array', async () => {
      const membership = await getMembership();

      expect(membership.members).toBeDefined();
      expect(Array.isArray(membership.members)).toBe(true);
      expect(membership.members.length).toBeGreaterThan(0);

      const member = membership.members[0];
      expect(typeof member.id).toBe('number');
      expect(member.prefixedId).toBe('USER84aa2d8f26');
      expect(member.fullName).toBe('John Doe');
      expect(member.role).toBe('member');
    });

    it('should have payer information', async () => {
      const membership = await getMembership();

      expect(membership.payer).toBeDefined();
      expect(typeof membership.payer.id).toBe('number');
      expect(membership.payer.fullName).toBe('John Doe');
    });

    it('should handle nullable date fields', async () => {
      const membership = await getMembership();

      expect(membership.startsAt).toBeDefined();
      expect(membership.chargeStartsAt).toBeDefined();
      // These can be null
      expect(membership.endsAt).toBeNull();
      expect(membership.renewsAt).toBeNull();
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
      const membershipId = '1000031';
      const pdfUrl = await downloadContract(membershipId);

      expect(pdfUrl).toBeDefined();
      expect(typeof pdfUrl).toBe('string');
      expect(pdfUrl).toContain(membershipId);
      expect(pdfUrl).toContain('/download');
    });

    it('should simulate API delay for download', async () => {
      const startTime = Date.now();
      await downloadContract('1000031');
      const endTime = Date.now();

      const delay = endTime - startTime;
      expect(delay).toBeGreaterThanOrEqual(1000);
    });

    it('should generate unique URLs for different memberships', async () => {
      const url1 = await downloadContract('1000031');
      const url2 = await downloadContract('1000032');

      expect(url1).not.toBe(url2);
    });
  });

  describe('getPrimaryMember', () => {
    it('should return the first member', async () => {
      const membership = await getMembership();
      const primaryMember = getPrimaryMember(membership);

      expect(primaryMember).toBeDefined();
      expect(primaryMember?.role).toBe('member');
      expect(primaryMember?.fullName).toBe('John Doe');
    });

    it('should return undefined if no members exist', () => {
      const membershipWithNoMembers = {
        id: 123,
        status: 'active' as const,
        startsAt: '',
        chargeStartsAt: '',
        endsAt: null,
        renewsAt: null,
        renewsAutomatically: true,
        amount: 0,
        currency: 'EUR',
        plan: {
          id: 1,
          name: 'Test',
          priceId: 1,
          priceName: null,
          amount: 0,
          currency: 'EUR',
          chargeInterval: 'P1M',
          contractDuration: 'P6M',
        },
        members: [],
        payer: { id: 1, prefixedId: 'TEST', fullName: 'Test' },
      };

      const primaryMember = getPrimaryMember(membershipWithNoMembers);
      expect(primaryMember).toBeUndefined();
    });
  });

  describe('parseDurationToMonths', () => {
    it('should parse months', () => {
      expect(parseDurationToMonths('P1M')).toBe(1);
      expect(parseDurationToMonths('P6M')).toBe(6);
      expect(parseDurationToMonths('P12M')).toBe(12);
    });

    it('should parse years', () => {
      expect(parseDurationToMonths('P1Y')).toBe(12);
      expect(parseDurationToMonths('P2Y')).toBe(24);
    });

    it('should parse combined years and months', () => {
      expect(parseDurationToMonths('P1Y6M')).toBe(18);
    });

    it('should handle weeks approximately', () => {
      expect(parseDurationToMonths('P4W')).toBe(1);
    });

    it('should return 0 for invalid format', () => {
      expect(parseDurationToMonths('invalid')).toBe(0);
    });
  });

  describe('getIntervalLabel', () => {
    it('should return monthly for P1M', () => {
      expect(getIntervalLabel('P1M')).toBe('monthly');
    });

    it('should return yearly for P1Y', () => {
      expect(getIntervalLabel('P1Y')).toBe('yearly');
    });

    it('should return every 6 months for P6M', () => {
      expect(getIntervalLabel('P6M')).toBe('every 6 months');
    });

    it('should return weekly for P1W', () => {
      expect(getIntervalLabel('P1W')).toBe('weekly');
    });

    it('should return every 2 weeks for P2W', () => {
      expect(getIntervalLabel('P2W')).toBe('every 2 weeks');
    });

    it('should return daily for P1D', () => {
      expect(getIntervalLabel('P1D')).toBe('daily');
    });

    it('should return the duration string for unknown durations', () => {
      expect(getIntervalLabel('P5M')).toBe('P5M');
    });
  });

  describe('getMonthlyEquivalent', () => {
    it('should calculate monthly equivalent for yearly plans', () => {
      const plan = {
        id: 1,
        name: 'Test',
        priceId: 1,
        priceName: null,
        amount: 1200,
        currency: 'EUR',
        chargeInterval: 'P1Y',
        contractDuration: 'P1Y',
      };

      expect(getMonthlyEquivalent(plan)).toBe(100);
    });

    it('should return same amount for monthly plans', () => {
      const plan = {
        id: 1,
        name: 'Test',
        priceId: 1,
        priceName: null,
        amount: 100,
        currency: 'EUR',
        chargeInterval: 'P1M',
        contractDuration: 'P6M',
      };

      expect(getMonthlyEquivalent(plan)).toBe(100);
    });

    it('should calculate monthly equivalent for 6-month plans', () => {
      const plan = {
        id: 1,
        name: 'Test',
        priceId: 1,
        priceName: null,
        amount: 600,
        currency: 'EUR',
        chargeInterval: 'P6M',
        contractDuration: 'P6M',
      };

      expect(getMonthlyEquivalent(plan)).toBe(100);
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
