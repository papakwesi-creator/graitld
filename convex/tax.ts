// Ghana Revenue Authority progressive income tax brackets (annual, GHS)
const GHA_TAX_BRACKETS: Array<{ limit: number; rate: number }> = [
  { limit: 5_880, rate: 0 },       // First 5,880 — tax free
  { limit: 1_320, rate: 0.05 },    // Next 1,320 at 5%   (5,881–7,200)
  { limit: 1_560, rate: 0.10 },    // Next 1,560 at 10%  (7,201–8,760)
  { limit: 38_000, rate: 0.175 },  // Next 38,000 at 17.5% (8,761–46,760)
  { limit: 192_000, rate: 0.25 },  // Next 192,000 at 25% (46,761–238,760)
  { limit: 366_240, rate: 0.30 },  // Next 366,240 at 30% (238,761–605,000)
  { limit: Infinity, rate: 0.35 }, // Above 605,000 at 35%
];

/**
 * Calculate Ghana annual income tax using progressive brackets (GHS).
 * Returns the total tax owed, rounded to the nearest whole cedi.
 */
export function calculateGhanaTax(annualIncome: number): number {
  if (annualIncome <= 0) return 0;

  let tax = 0;
  let remaining = annualIncome;

  for (const bracket of GHA_TAX_BRACKETS) {
    if (remaining <= 0) break;
    const taxable = isFinite(bracket.limit)
      ? Math.min(remaining, bracket.limit)
      : remaining;
    tax += taxable * bracket.rate;
    remaining -= taxable;
  }

  return Math.round(tax);
}

/**
 * Compute the effective (blended) tax rate for a given annual income.
 */
export function effectiveTaxRate(annualIncome: number): number {
  if (annualIncome <= 0) return 0;
  return calculateGhanaTax(annualIncome) / annualIncome;
}
