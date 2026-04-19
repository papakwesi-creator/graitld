import { describe, expect, it } from 'vitest';

import { formatEstimatedRevenue } from '../../src/lib/revenue-estimate';

describe('formatEstimatedRevenue', () => {
  it('uses GH₵ symbol, not $', () => {
    const result = formatEstimatedRevenue(1000);
    expect(result).not.toContain('$');
    expect(result).toContain('GH₵');
  });

  it('formats small values with the cedi symbol', () => {
    const result = formatEstimatedRevenue(500);
    expect(result).toContain('GH₵');
    expect(result).toContain('500');
  });

  it('formats thousands with K suffix', () => {
    const result = formatEstimatedRevenue(5_000);
    expect(result).toContain('GH₵');
    expect(result).toContain('5.0K');
  });

  it('formats millions with M suffix', () => {
    const result = formatEstimatedRevenue(2_500_000);
    expect(result).toContain('GH₵');
    expect(result).toContain('2.5M');
  });

  it('never outputs a bare dollar sign', () => {
    for (const amount of [0, 1, 999, 1_000, 999_999, 1_000_000, 10_000_000]) {
      expect(formatEstimatedRevenue(amount)).not.toMatch(/\$/);
    }
  });
});
