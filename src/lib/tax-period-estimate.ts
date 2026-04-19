import { estimateRevenueFromViews } from './revenue-estimate';

export const TAX_PERIOD_OPTIONS = [
  { days: 30, label: '30 days' },
  { days: 60, label: '60 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' },
] as const;

export const DEFAULT_TAX_PERIOD_DAYS = TAX_PERIOD_OPTIONS[0].days;
const DAYS_IN_YEAR = 365;

// Ghana Revenue Authority progressive personal income tax brackets (annual, GHS).
const GHA_TAX_BRACKETS: Array<{ limit: number; rate: number }> = [
  { limit: 5_880, rate: 0 },
  { limit: 1_320, rate: 0.05 },
  { limit: 1_560, rate: 0.1 },
  { limit: 38_000, rate: 0.175 },
  { limit: 192_000, rate: 0.25 },
  { limit: 366_240, rate: 0.3 },
  { limit: Infinity, rate: 0.35 },
];

function calculateProgressiveTax(
  income: number,
  brackets: Array<{ limit: number; rate: number }>,
): number {
  if (income <= 0) return 0;

  let tax = 0;
  let remaining = income;

  for (const bracket of brackets) {
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
  channelCreatedAt?: number;
}) {
  if (channel.estimatedAnnualRevenue !== undefined) {
    return channel.estimatedAnnualRevenue;
  }

  if (channel.estimatedMonthlyRevenue !== undefined) {
    return channel.estimatedMonthlyRevenue * 12;
  }

  if (channel.totalViews !== undefined) {
    const lifetimeRevenue = estimateRevenueFromViews(channel.totalViews, channel.topicCategories ?? []);
    if (!channel.channelCreatedAt) {
      return lifetimeRevenue;
    }

    const ageDays = Math.max(30, (Date.now() - channel.channelCreatedAt) / (1000 * 60 * 60 * 24));
    return lifetimeRevenue * (DAYS_IN_YEAR / ageDays);
  }

  return undefined;
}

export function estimateTaxForPeriod(channel: {
  estimatedAnnualRevenue?: number;
  estimatedMonthlyRevenue?: number;
  totalViews?: number;
  topicCategories?: string[];
  channelCreatedAt?: number;
}, periodDays: number): number | undefined {
  const annualRevenue = estimateAnnualRevenue(channel);
  if (annualRevenue === undefined) return undefined;

  const periodRevenue = (annualRevenue * periodDays) / DAYS_IN_YEAR;
  const periodBrackets = GHA_TAX_BRACKETS.map((bracket) => ({
    limit: Number.isFinite(bracket.limit) ? (bracket.limit * periodDays) / DAYS_IN_YEAR : Infinity,
    rate: bracket.rate,
  }));

  return calculateProgressiveTax(periodRevenue, periodBrackets);
}
