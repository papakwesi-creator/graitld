export const PRODUCT_NAME = 'GRA YouTube Tax Dashboard';
export const PRODUCT_DESCRIPTION =
  'Source-aware YouTube channel oversight for public imports, optional connected analytics, and internal tax estimation.';

export const currencyConfig = {
  code: 'GHS',
  symbol: 'GH₵',
  locale: 'en-GH',
  taxRate: 0.25,
};

export function formatCurrency(value: number, options?: { compact?: boolean; maximumFractionDigits?: number }) {
  const { compact = false, maximumFractionDigits = 0 } = options ?? {};

  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      return `${currencyConfig.symbol} ${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `${currencyConfig.symbol} ${(value / 1_000).toFixed(1)}K`;
    }
  }

  return `${currencyConfig.symbol} ${value.toLocaleString(currencyConfig.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })}`;
}

export function formatCompactNumber(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString(currencyConfig.locale);
}

export function formatDate(value?: number, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString(currencyConfig.locale, options);
}

export function titleCaseLabel(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatRevenueSource(source: string) {
  switch (source) {
    case 'manual':
      return 'Manual financial inputs';
    case 'analytics':
      return 'Connected analytics';
    case 'blended':
      return 'Blended manual + analytics';
    case 'legacy_unknown':
      return 'Legacy source needs review';
    default:
      return 'No revenue source yet';
  }
}

export function formatAnalyticsStatus(status: string) {
  switch (status) {
    case 'not_connected':
      return 'Not connected';
    case 'refresh_failed':
      return 'Refresh failed';
    case 'scope_insufficient':
      return 'Scope insufficient';
    default:
      return titleCaseLabel(status);
  }
}

export function formatPublicStatus(status: string) {
  switch (status) {
    case 'public_imported':
      return 'Public import active';
    case 'manual_only':
      return 'Manual-only record';
    case 'refresh_failed':
      return 'Public refresh failed';
    default:
      return titleCaseLabel(status);
  }
}
