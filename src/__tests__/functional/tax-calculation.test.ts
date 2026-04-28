/**
 * Functional Test Suite — Tax Calculation & Summary
 * Black-box testing from the perspective of GRA quality assurance auditors.
 *
 * Tests the tax computation engine against the Income Tax Act, 2015
 * (Act 896) of Ghana, including progressive bracket calculation,
 * boundary values, rounding rules, and summary aggregation.
 *
 * Total Cases:  14
 * Passed:       14 (DEF-002 was rectified before this run)
 * Failed:       0
 * Defects:      DEF-002 (rectified) — upper bracket boundary rounding
 *
 * Technique:    Black-box functional testing
 * Requirement:  FR-TAX — Tax Calculation & Summary
 */

import { describe, expect, it } from 'vitest';

import { calculateGhanaTax, effectiveTaxRate } from '../../../convex/tax';
import { buildChannelSummaries } from '../../../convex/channelData';
import { estimateTaxForPeriod } from '../../../src/lib/tax-period-estimate';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type AnyId = string & { __tableName?: string };

function fakeId(table: string, index = 1): AnyId {
  return `${table}:${index}` as AnyId;
}

function emptyCollections() {
  return {
    channels: [] as any[],
    legacyInfluencers: [] as any[],
    manualFinancials: [] as any[],
    taxEstimates: [] as any[],
    oauthConnections: [] as any[],
    analyticsSyncs: [] as any[],
    taxAssessments: [] as any[],
  };
}

function makeChannel(overrides: Record<string, unknown> = {}) {
  return {
    _id: fakeId('channels'),
    _creationTime: Date.now(),
    channelId: 'UCtest1234567890123456789',
    handle: 'testchannel',
    name: 'Test Channel',
    complianceStatus: 'pending' as const,
    ...overrides,
  };
}

function makeTaxEstimate(overrides: Record<string, unknown> = {}) {
  return {
    _id: fakeId('taxEstimates'),
    _creationTime: Date.now(),
    channelId: 'UCtest1234567890123456789',
    periodStart: 1,
    periodEnd: 1,
    sourceType: 'manual' as const,
    grossRevenue: 120_000,
    taxableIncome: 120_000,
    taxRate: 0.25,
    currency: 'GHS',
    estimatedTax: 25_154,
    calculatedAt: Date.now(),
    ...overrides,
  };
}

// ===================================================================
// FR-TAX — Tax Calculation & Summary (14 Cases)
// ===================================================================
describe('FR-TAX — Tax Calculation & Summary (14 cases)', () => {
  // FR-TAX-001: Tax-free threshold (0–5,880 GHS)
  it('FR-TAX-001 | Income at or below 5,880 GHS is tax-free', () => {
    expect(calculateGhanaTax(0)).toBe(0);
    expect(calculateGhanaTax(3_000)).toBe(0);
    expect(calculateGhanaTax(5_880)).toBe(0);
  });

  // FR-TAX-002: 5% bracket (5,881–7,200 GHS)
  it('FR-TAX-002 | Income in the 5% bracket (5,881–7,200) is correctly taxed', () => {
    // 7,200: 1,320 × 5% = 66
    expect(calculateGhanaTax(7_200)).toBe(66);
  });

  // FR-TAX-003: 10% bracket (7,201–8,760 GHS)
  it('FR-TAX-003 | Income in the 10% bracket (7,201–8,760) is correctly taxed', () => {
    // 8,760: 66 + 1,560 × 10% = 66 + 156 = 222
    expect(calculateGhanaTax(8_760)).toBe(222);
  });

  // FR-TAX-004: 17.5% bracket (8,761–46,760 GHS)
  it('FR-TAX-004 | Income in the 17.5% bracket (8,761–46,760) is correctly taxed', () => {
    // 46,760: 222 + 38,000 × 17.5% = 222 + 6,650 = 6,872
    expect(calculateGhanaTax(46_760)).toBe(6_872);
  });

  // FR-TAX-005: 25% bracket (46,761–238,760 GHS)
  it('FR-TAX-005 | Income in the 25% bracket (46,761–238,760) is correctly taxed', () => {
    // 100,000: 6,872 + (100,000 - 46,760) × 25% = 6,872 + 13,310 = 20,182
    expect(calculateGhanaTax(100_000)).toBe(20_182);
  });

  // FR-TAX-006: 30% bracket (238,761–605,000 GHS)
  it('FR-TAX-006 | Income in the 30% bracket (238,761–605,000) is correctly taxed', () => {
    // 605,000: 54,872 + 366,240 × 30% = 54,872 + 109,872 = 164,744
    expect(calculateGhanaTax(605_000)).toBe(164_744);
  });

  // FR-TAX-007: 35% bracket (above 605,000 GHS)
  it('FR-TAX-007 | Income above 605,000 GHS is taxed at 35% marginal rate', () => {
    // 1,000,000: 164,744 + 395,000 × 35% = 164,744 + 138,250 = 302,994
    expect(calculateGhanaTax(1_000_000)).toBe(302_994);
  });

  // FR-TAX-008: Negative income handled safely
  it('FR-TAX-008 | Negative income input returns 0 tax (safety guard)', () => {
    expect(calculateGhanaTax(-500)).toBe(0);
    expect(calculateGhanaTax(-100_000)).toBe(0);
  });

  // FR-TAX-009: Progressive tax is cumulative across brackets
  it('FR-TAX-009 | Tax calculation is cumulative across all applicable brackets', () => {
    // 10,000: 5,880×0 + 1,320×5% + 1,560×10% + 1,240×17.5%
    //       = 0 + 66 + 156 + 217 = 439
    expect(calculateGhanaTax(10_000)).toBe(439);
  });

  // FR-TAX-010: Effective tax rate is less than marginal rate
  it('FR-TAX-010 | Effective tax rate is always lower than top marginal rate', () => {
    const rate = effectiveTaxRate(700_000);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(0.35);

    // Equals tax / income
    expect(effectiveTaxRate(700_000)).toBeCloseTo(calculateGhanaTax(700_000) / 700_000, 10);
  });

  // FR-TAX-011: Tax summary integrates into channel summary
  it('FR-TAX-011 | Tax estimate integrates into the channel summary correctly', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];
    collections.taxEstimates = [makeTaxEstimate({ grossRevenue: 200_000, estimatedTax: 40_182 })];

    const result = buildChannelSummaries(collections);

    expect(result[0]!.hasTaxEstimate).toBe(true);
    expect(result[0]!.estimatedTax).toBe(40_182);
    expect(result[0]!.estimatedAnnualRevenue).toBe(200_000);
    expect(result[0]!.taxEstimateSource).toBe('manual');
  });

  // FR-TAX-012: Tax period projection (30/90/365 days)
  it('FR-TAX-012 | Tax is correctly pro-rated for sub-annual periods', () => {
    const channel = { estimatedAnnualRevenue: 100_000 };
    const tax365 = estimateTaxForPeriod(channel, 365)!;
    const tax90 = estimateTaxForPeriod(channel, 90)!;
    const tax30 = estimateTaxForPeriod(channel, 30)!;

    expect(tax365).toBeGreaterThan(0);
    expect(tax90).toBeLessThan(tax365);
    expect(tax30).toBeLessThan(tax90);
  });

  // FR-TAX-013: Upper bracket boundary rounding (DEF-002 rectified)
  it('FR-TAX-013 | Upper bracket boundary computes correctly (DEF-002 fix)', () => {
    // DEF-002: There was an inaccuracy in the tax calculation using the
    // uppermost value of the income bracket after rounding off using
    // Ghana Revenue Authority rounding rules. This was rectified.
    //
    // The system rounds to the nearest integer via Math.round().
    // Test all upper boundaries to ensure they produce exact integer results.

    // Bracket 2 upper: 7,200 → tax = 66 (exact)
    expect(Number.isInteger(calculateGhanaTax(7_200))).toBe(true);
    expect(calculateGhanaTax(7_200)).toBe(66);

    // Bracket 3 upper: 8,760 → tax = 222 (exact)
    expect(Number.isInteger(calculateGhanaTax(8_760))).toBe(true);
    expect(calculateGhanaTax(8_760)).toBe(222);

    // Bracket 4 upper: 46,760 → tax = 6,872 (exact)
    expect(Number.isInteger(calculateGhanaTax(46_760))).toBe(true);
    expect(calculateGhanaTax(46_760)).toBe(6_872);

    // Bracket 5 upper: 238,760 → tax = 54,872 (exact)
    expect(Number.isInteger(calculateGhanaTax(238_760))).toBe(true);
    expect(calculateGhanaTax(238_760)).toBe(54_872);

    // Bracket 6 upper: 605,000 → tax = 164,744 (exact)
    expect(Number.isInteger(calculateGhanaTax(605_000))).toBe(true);
    expect(calculateGhanaTax(605_000)).toBe(164_744);

    // GRA rounding rule: all calculated taxes must be integers
    const arbitraryIncomes = [5_881, 6_100, 8_000, 15_555, 99_999, 300_000, 750_000];
    for (const income of arbitraryIncomes) {
      expect(Number.isInteger(calculateGhanaTax(income))).toBe(true);
    }
  });

  // FR-TAX-014: Multiple channels produce aggregate tax summary
  it('FR-TAX-014 | Tax summary aggregates across multiple channels', () => {
    const collections = emptyCollections();
    collections.channels = [
      makeChannel({ _id: fakeId('channels', 1), channelId: 'UC_ch1', name: 'Channel A' }),
      makeChannel({ _id: fakeId('channels', 2), channelId: 'UC_ch2', name: 'Channel B' }),
      makeChannel({ _id: fakeId('channels', 3), channelId: 'UC_ch3', name: 'Channel C' }),
    ];
    collections.taxEstimates = [
      makeTaxEstimate({ _id: fakeId('taxEstimates', 1), channelId: 'UC_ch1', grossRevenue: 100_000, estimatedTax: 20_182 }),
      makeTaxEstimate({ _id: fakeId('taxEstimates', 2), channelId: 'UC_ch2', grossRevenue: 50_000, estimatedTax: 6_872 }),
      makeTaxEstimate({ _id: fakeId('taxEstimates', 3), channelId: 'UC_ch3', grossRevenue: 200_000, estimatedTax: 40_182 }),
    ];

    const summaries = buildChannelSummaries(collections);

    expect(summaries).toHaveLength(3);

    // Aggregate totals (as computed by getInfluencerStats / getDashboardMetrics)
    const totalTax = summaries.reduce((sum, ch) => sum + (ch.estimatedTax ?? 0), 0);
    const totalRevenue = summaries.reduce((sum, ch) => sum + (ch.estimatedAnnualRevenue ?? 0), 0);

    expect(totalTax).toBe(20_182 + 6_872 + 40_182);
    expect(totalRevenue).toBe(100_000 + 50_000 + 200_000);
  });
});
