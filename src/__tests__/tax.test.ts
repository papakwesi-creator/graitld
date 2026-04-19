import { describe, expect, it } from 'vitest';

import { calculateGhanaTax, effectiveTaxRate } from '../../convex/tax';

describe('calculateGhanaTax', () => {
  it('returns 0 for zero income', () => {
    expect(calculateGhanaTax(0)).toBe(0);
  });

  it('returns 0 for negative income', () => {
    expect(calculateGhanaTax(-1000)).toBe(0);
  });

  // Bracket 1: 0–5,880 at 0%
  it('is tax-free up to 5,880', () => {
    expect(calculateGhanaTax(1)).toBe(0);
    expect(calculateGhanaTax(2_940)).toBe(0);
    expect(calculateGhanaTax(5_880)).toBe(0);
  });

  // Bracket 2: 5,881–7,200 at 5%
  it('applies 5% to income in the 5,881–7,200 band', () => {
    // Income = 5,881 → 1 * 0.05 = 0.05 → rounds to 0
    expect(calculateGhanaTax(5_881)).toBe(0);
    // Income = 7,200 → 1,320 * 0.05 = 66
    expect(calculateGhanaTax(7_200)).toBe(66);
  });

  // Bracket 3: 7,201–8,760 at 10%
  it('applies 10% to income in the 7,201–8,760 band', () => {
    // Income = 8,760 → 66 + 1,560 * 0.10 = 66 + 156 = 222
    expect(calculateGhanaTax(8_760)).toBe(222);
  });

  // Bracket 4: 8,761–46,760 at 17.5%
  it('applies 17.5% to income in the 8,761–46,760 band', () => {
    // Income = 46,760 → 66 + 156 + 38,000 * 0.175 = 222 + 6,650 = 6,872
    expect(calculateGhanaTax(46_760)).toBe(6_872);
  });

  // Bracket 5: 46,761–238,760 at 25%
  it('applies 25% to income in the 46,761–238,760 band', () => {
    // Income = 238,760 → 6,872 + 192,000 * 0.25 = 6,872 + 48,000 = 54,872
    expect(calculateGhanaTax(238_760)).toBe(54_872);
  });

  // Bracket 6: 238,761–605,000 at 30%
  it('applies 30% to income in the 238,761–605,000 band', () => {
    // Income = 605,000 → 54,872 + 366,240 * 0.30 = 54,872 + 109,872 = 164,744
    expect(calculateGhanaTax(605_000)).toBe(164_744);
  });

  // Bracket 7: above 605,000 at 35%
  it('applies 35% to income above 605,000', () => {
    // Income = 700,000 → 164,744 + 95,000 * 0.35 = 164,744 + 33,250 = 197,994
    expect(calculateGhanaTax(700_000)).toBe(197_994);
    // Income = 1,000,000 → 164,744 + 395,000 * 0.35 = 164,744 + 138,250 = 302,994
    expect(calculateGhanaTax(1_000_000)).toBe(302_994);
  });

  it('is cumulative (uses all lower brackets before higher ones)', () => {
    // Income = 10,000 uses four brackets:
    // 5,880*0 + 1,320*0.05 + 1,560*0.10 + 1,240*0.175
    // = 0 + 66 + 156 + 217 = 439
    expect(calculateGhanaTax(10_000)).toBe(439);
  });
});

describe('effectiveTaxRate', () => {
  it('is 0 for zero income', () => {
    expect(effectiveTaxRate(0)).toBe(0);
  });

  it('is 0 for income below the first taxable threshold', () => {
    expect(effectiveTaxRate(5_880)).toBe(0);
  });

  it('is below the top marginal rate for income in higher brackets', () => {
    const rate = effectiveTaxRate(700_000);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(0.35); // effective < marginal
  });

  it('equals tax / income', () => {
    const income = 100_000;
    expect(effectiveTaxRate(income)).toBeCloseTo(calculateGhanaTax(income) / income);
  });
});
