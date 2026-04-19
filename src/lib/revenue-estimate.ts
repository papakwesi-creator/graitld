import { currencyConfig } from './product';

type RpmBenchmark = {
  keywords: string[];
  rpm: number;
};

const RPM_BENCHMARKS: RpmBenchmark[] = [
  { keywords: ['finance', 'investing', 'investment', 'financial'], rpm: 18 },
  { keywords: ['tech', 'technology', 'software', 'programming', 'computing'], rpm: 12 },
  { keywords: ['education', 'howto', 'how-to', 'tutorial', 'learning', 'academic'], rpm: 8 },
  { keywords: ['gaming', 'game', 'video_game', 'videogame'], rpm: 4 },
  { keywords: ['entertainment', 'vlog', 'lifestyle', 'comedy', 'humor'], rpm: 3 },
];

const DEFAULT_RPM = 4;

export const ESTIMATED_REVENUE_DISCLAIMER =
  'Based on public view data and industry-average RPM. Connect your YouTube account for exact figures.';

export function getRpmForTopicCategories(topicCategories: string[]): number {
  if (topicCategories.length === 0) return DEFAULT_RPM;

  const combined = topicCategories.join(' ').toLowerCase();

  for (const benchmark of RPM_BENCHMARKS) {
    if (benchmark.keywords.some((keyword) => combined.includes(keyword))) {
      return benchmark.rpm;
    }
  }

  return DEFAULT_RPM;
}

export function estimateRevenueFromViews(
  totalViews: number,
  topicCategories: string[] = [],
): number {
  const rpm = getRpmForTopicCategories(topicCategories);
  return (totalViews / 1000) * rpm;
}

export function formatEstimatedRevenue(value: number): string {
  if (value >= 1_000_000) {
    return `${currencyConfig.symbol} ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${currencyConfig.symbol} ${(value / 1_000).toFixed(1)}K`;
  }
  return `${currencyConfig.symbol} ${Math.round(value).toLocaleString(currencyConfig.locale)}`;
}

/** @deprecated Use {@link formatEstimatedRevenue} instead. */
export const formatEstimatedRevenueUsd = formatEstimatedRevenue;
