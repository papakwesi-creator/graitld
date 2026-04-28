/**
 * Income Form / Revenue Estimation Unit Tests
 *
 * Modules under test:
 *   - src/lib/revenue-estimate.ts  → getRpmForTopicCategories,
 *                                     estimateRevenueFromViews,
 *                                     formatEstimatedRevenue
 *   - src/lib/tax-period-estimate.ts → estimateTaxForPeriod
 *   - src/lib/product.ts             → formatCurrency, formatCompactNumber
 *
 * Equivalence partitioning and boundary value analysis applied.
 */

import { describe, expect, it } from 'vitest';

import {
  estimateRevenueFromViews,
  formatEstimatedRevenue,
  getRpmForTopicCategories,
} from '../../src/lib/revenue-estimate';
import { formatCompactNumber, formatCurrency } from '../../src/lib/product';
import {
  DEFAULT_TAX_PERIOD_DAYS,
  estimateTaxForPeriod,
  TAX_PERIOD_OPTIONS,
} from '../../src/lib/tax-period-estimate';

// ---------------------------------------------------------------------------
// getRpmForTopicCategories
// ---------------------------------------------------------------------------
describe('getRpmForTopicCategories — equivalence partitioning', () => {
  it('EP-RPM-1 | finance-related topic → RPM 18', () => {
    expect(getRpmForTopicCategories(['https://en.wikipedia.org/wiki/Finance'])).toBe(18);
  });

  it('EP-RPM-2 | tech-related topic → RPM 12', () => {
    expect(getRpmForTopicCategories(['https://en.wikipedia.org/wiki/Technology'])).toBe(12);
  });

  it('EP-RPM-3 | education-related topic → RPM 8', () => {
    expect(getRpmForTopicCategories(['https://en.wikipedia.org/wiki/Education'])).toBe(8);
  });

  it('EP-RPM-4 | gaming-related topic → RPM 4', () => {
    expect(getRpmForTopicCategories(['https://en.wikipedia.org/wiki/Gaming'])).toBe(4);
  });

  it('EP-RPM-5 | entertainment-related topic → RPM 3', () => {
    expect(getRpmForTopicCategories(['https://en.wikipedia.org/wiki/Entertainment'])).toBe(3);
  });

  it('EP-RPM-6 | unknown topic → default RPM 4', () => {
    expect(getRpmForTopicCategories(['https://en.wikipedia.org/wiki/Cooking'])).toBe(4);
  });

  it('EP-RPM-7 | empty categories → default RPM 4', () => {
    expect(getRpmForTopicCategories([])).toBe(4);
  });

  it('EP-RPM-8 | multiple categories → first matched wins (priority order)', () => {
    // Finance keyword comes before tech in the benchmark array
    const result = getRpmForTopicCategories([
      'https://en.wikipedia.org/wiki/Finance',
      'https://en.wikipedia.org/wiki/Technology',
    ]);
    expect(result).toBe(18);
  });
});

// ---------------------------------------------------------------------------
// estimateRevenueFromViews
// ---------------------------------------------------------------------------
describe('estimateRevenueFromViews — equivalence partitioning', () => {
  it('EP-REV-1 | 0 views → 0 revenue', () => {
    expect(estimateRevenueFromViews(0)).toBe(0);
  });

  it('EP-REV-2 | 1,000 views with default RPM (4) → 4 GHS', () => {
    expect(estimateRevenueFromViews(1_000)).toBe(4);
  });

  it('EP-REV-3 | 1,000,000 views with default RPM (4) → 4,000 GHS', () => {
    expect(estimateRevenueFromViews(1_000_000)).toBe(4_000);
  });

  it('EP-REV-4 | 1,000 views with finance topics (RPM=18) → 18 GHS', () => {
    expect(estimateRevenueFromViews(1_000, ['Finance investing'])).toBe(18);
  });

  it('EP-REV-5 | views × RPM formula is correct', () => {
    const views = 500_000;
    const categories = ['tech programming'];
    const expectedRpm = 12;
    expect(estimateRevenueFromViews(views, categories)).toBe((views / 1000) * expectedRpm);
  });
});

describe('estimateRevenueFromViews — boundary value analysis', () => {
  it('BVA-REV-1 | exactly 1 view → very small but positive', () => {
    const result = estimateRevenueFromViews(1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it('BVA-REV-2 | 999 views → less than 1 RPM unit', () => {
    expect(estimateRevenueFromViews(999)).toBeLessThan(4);
  });

  it('BVA-REV-3 | 1,000 views → exactly 1 RPM unit', () => {
    expect(estimateRevenueFromViews(1_000)).toBe(4);
  });

  it('BVA-REV-4 | very large view count → proportional', () => {
    const result = estimateRevenueFromViews(1_000_000_000);
    expect(result).toBe(4_000_000);
  });
});

// ---------------------------------------------------------------------------
// formatEstimatedRevenue (income form display)
// ---------------------------------------------------------------------------
describe('formatEstimatedRevenue — currency display (equivalence partitioning)', () => {
  it('EP-FMT-1 | small values → GH₵ symbol with raw number', () => {
    const result = formatEstimatedRevenue(500);
    expect(result).toContain('GH₵');
    expect(result).toContain('500');
  });

  it('EP-FMT-2 | thousands → K suffix', () => {
    const result = formatEstimatedRevenue(5_000);
    expect(result).toContain('GH₵');
    expect(result).toContain('5.0K');
  });

  it('EP-FMT-3 | millions → M suffix', () => {
    const result = formatEstimatedRevenue(2_500_000);
    expect(result).toContain('GH₵');
    expect(result).toContain('2.5M');
  });

  it('EP-FMT-4 | zero → GH₵ 0', () => {
    const result = formatEstimatedRevenue(0);
    expect(result).toContain('GH₵');
    expect(result).toContain('0');
  });

  it('EP-FMT-5 | never contains bare $ symbol', () => {
    for (const amount of [0, 1, 999, 1_000, 999_999, 1_000_000, 10_000_000]) {
      expect(formatEstimatedRevenue(amount)).not.toMatch(/\$/);
    }
  });
});

describe('formatEstimatedRevenue — boundary value analysis', () => {
  it('BVA-FMT-1 | 999 → no K suffix', () => {
    const result = formatEstimatedRevenue(999);
    expect(result).not.toContain('K');
    expect(result).not.toContain('M');
  });

  it('BVA-FMT-2 | 1,000 → K suffix applied', () => {
    const result = formatEstimatedRevenue(1_000);
    expect(result).toContain('K');
  });

  it('BVA-FMT-3 | 999,999 → K suffix (not yet M)', () => {
    const result = formatEstimatedRevenue(999_999);
    expect(result).toContain('K');
    expect(result).not.toContain('M');
  });

  it('BVA-FMT-4 | 1,000,000 → M suffix applied', () => {
    const result = formatEstimatedRevenue(1_000_000);
    expect(result).toContain('M');
  });
});

// ---------------------------------------------------------------------------
// formatCurrency — product.ts (income form formatting)
// ---------------------------------------------------------------------------
describe('formatCurrency — product.ts', () => {
  it('uses GH₵ symbol', () => {
    expect(formatCurrency(100)).toContain('GH₵');
  });

  it('compact mode formats thousands with K', () => {
    const result = formatCurrency(5_000, { compact: true });
    expect(result).toContain('5.0K');
  });

  it('compact mode formats millions with M', () => {
    const result = formatCurrency(2_500_000, { compact: true });
    expect(result).toContain('2.5M');
  });

  it('non-compact mode shows full number', () => {
    const result = formatCurrency(5_000);
    expect(result).toContain('GH₵');
    expect(result).not.toContain('K');
  });

  it('zero is formatted without error', () => {
    expect(() => formatCurrency(0)).not.toThrow();
    expect(formatCurrency(0)).toContain('GH₵');
  });
});

// ---------------------------------------------------------------------------
// formatCompactNumber — product.ts
// ---------------------------------------------------------------------------
describe('formatCompactNumber', () => {
  it('formats millions with M', () => {
    expect(formatCompactNumber(1_500_000)).toBe('1.5M');
  });

  it('formats thousands with K', () => {
    expect(formatCompactNumber(2_500)).toBe('2.5K');
  });

  it('returns raw number for values under 1,000', () => {
    const result = formatCompactNumber(500);
    expect(result).not.toContain('K');
    expect(result).not.toContain('M');
  });
});

// ---------------------------------------------------------------------------
// estimateTaxForPeriod (income form → tax projection)
// ---------------------------------------------------------------------------
describe('estimateTaxForPeriod — equivalence partitioning', () => {
  it('EP-TAXP-1 | channel with annual revenue only → produces tax', () => {
    const result = estimateTaxForPeriod({ estimatedAnnualRevenue: 100_000 }, 365);
    expect(result).toBeDefined();
    expect(result).toBeGreaterThan(0);
  });

  it('EP-TAXP-2 | channel with monthly revenue only → annualizes and taxes', () => {
    const result = estimateTaxForPeriod({ estimatedMonthlyRevenue: 10_000 }, 365);
    expect(result).toBeDefined();
    expect(result).toBeGreaterThan(0);
  });

  it('EP-TAXP-3 | channel with views only → estimates revenue then taxes', () => {
    // 10M views × RPM 4 = GHS 40,000 (above 5,880 tax-free threshold)
    const result = estimateTaxForPeriod({ totalViews: 10_000_000 }, 365);
    expect(result).toBeDefined();
    expect(result).toBeGreaterThan(0);
  });

  it('EP-TAXP-4 | channel with no financial data → undefined', () => {
    const result = estimateTaxForPeriod({}, 365);
    expect(result).toBeUndefined();
  });

  it('EP-TAXP-5 | 30-day period produces less tax than 365-day period', () => {
    const channel = { estimatedAnnualRevenue: 100_000 };
    const tax30 = estimateTaxForPeriod(channel, 30)!;
    const tax365 = estimateTaxForPeriod(channel, 365)!;
    expect(tax30).toBeLessThan(tax365);
  });

  it('EP-TAXP-6 | income below free threshold → 0 tax', () => {
    const result = estimateTaxForPeriod({ estimatedAnnualRevenue: 3_000 }, 365);
    expect(result).toBe(0);
  });
});

describe('estimateTaxForPeriod — boundary value analysis', () => {
  it('BVA-TAXP-1 | period = 0 days → 0 tax', () => {
    const result = estimateTaxForPeriod({ estimatedAnnualRevenue: 100_000 }, 0);
    expect(result).toBe(0);
  });

  it('BVA-TAXP-2 | period = 1 day → very small tax', () => {
    const result = estimateTaxForPeriod({ estimatedAnnualRevenue: 100_000 }, 1);
    expect(result).toBeDefined();
    expect(result!).toBeLessThan(100);
  });

  it('BVA-TAXP-3 | period = 365 days → full annual tax', () => {
    const result = estimateTaxForPeriod({ estimatedAnnualRevenue: 100_000 }, 365);
    expect(result).toBeDefined();
    expect(result!).toBeGreaterThan(0);
  });

  it('BVA-TAXP-4 | annual revenue = 5,880 (exact threshold) → 0 tax', () => {
    const result = estimateTaxForPeriod({ estimatedAnnualRevenue: 5_880 }, 365);
    expect(result).toBe(0);
  });

  it('BVA-TAXP-5 | annual revenue = 5,881 (just above threshold) → minimal tax', () => {
    const result = estimateTaxForPeriod({ estimatedAnnualRevenue: 5_881 }, 365);
    expect(result).toBeDefined();
    // 1 × 5% = 0.05 rounds to 0
    expect(result!).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// TAX_PERIOD_OPTIONS — structural (config correctness)
// ---------------------------------------------------------------------------
describe('TAX_PERIOD_OPTIONS — structural', () => {
  it('has at least 3 period options', () => {
    expect(TAX_PERIOD_OPTIONS.length).toBeGreaterThanOrEqual(3);
  });

  it('default period is 30 days', () => {
    expect(DEFAULT_TAX_PERIOD_DAYS).toBe(30);
  });

  it('includes 365-day (annual) option', () => {
    expect(TAX_PERIOD_OPTIONS.some((opt) => opt.days === 365)).toBe(true);
  });

  it('all options have positive day values', () => {
    for (const option of TAX_PERIOD_OPTIONS) {
      expect(option.days).toBeGreaterThan(0);
    }
  });

  it('all options have non-empty labels', () => {
    for (const option of TAX_PERIOD_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });
});
