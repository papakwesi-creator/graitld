import { estimateRevenueFromViews } from './revenue-estimate';

export const TAX_PERIOD_OPTIONS = [
  { days: 30, label: '30 days' },
  { days: 60, label: '60 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' },
] as const;

export const DEFAULT_TAX_PERIOD_DAYS = TAX_PERIOD_OPTIONS[0].days;
const DAYS_IN_YEAR = 365;

const GHA_TAX_BRACKETS: Array<{ limit: number; rate: number }> = [
  { limit: 5_880, rate: 0 },
  { limit: 1_320, rate: 0.05 },
  { limit: 1_560, rate: 0.1 },
  { limit: 38_000, rate: 0.175 },
  { limit: 192_000, rate: 0.25 },
  { limit: 366_240, rate: 0.3 },
  { limit: Infinity, rate: 0.35 },
];

function calculateGhanaTax(annualIncome: number): number {
  if (annualIncome <= 0) return 0;

  let tax = 0;
  let remaining = annualIncome;

  for (const bracket of GHA_TAX_BRACKETS) {
    if (remaining <= 0) break;
    const taxable = Number.isFinite(bracket.limit) ? Math.min(remaining, bracket.limit) : remaining;
    tax += taxable * bracket.rate;
    remaining -= taxable;
  }

  return Math.round(tax);
}

function estimateAnnualRevenue(channel: {
  estimatedAnnualRevenue?: number;
  estimatedMonthlyRevenue?: number;
  totalViews?: number;
  topicCategories?: string[];
}) {
  if (channel.estimatedAnnualRevenue !== undefined) {
    return channel.estimatedAnnualRevenue;
  }

  if (channel.estimatedMonthlyRevenue !== undefined) {
    return channel.estimatedMonthlyRevenue * 12;
  }

  if (channel.totalViews !== undefined) {
    return estimateRevenueFromViews(channel.totalViews, channel.topicCategories ?? []);
  }

  return undefined;
}

export function estimateTaxForPeriod(channel: {
  estimatedAnnualRevenue?: number;
  estimatedMonthlyRevenue?: number;
  totalViews?: number;
  topicCategories?: string[];
}, periodDays: number): number | undefined {
  const annualRevenue = estimateAnnualRevenue(channel);
  if (annualRevenue === undefined) return undefined;

  const annualTax = calculateGhanaTax(annualRevenue);
  return Math.round((annualTax * periodDays) / DAYS_IN_YEAR);
}
