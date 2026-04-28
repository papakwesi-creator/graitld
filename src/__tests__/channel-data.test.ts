/**
 * Channel Summary / Data Aggregation Unit Tests — convex/channelData.ts
 *
 * Tests the buildChannelSummaries function which merges data from
 * channels, legacy influencers, manual financials, tax estimates,
 * OAuth connections, analytics syncs, and tax assessments into a
 * unified ChannelSummary[].
 *
 * Equivalence partitioning and boundary value analysis applied.
 */

import { describe, expect, it } from 'vitest';

import { buildChannelSummaries, type ChannelSummary } from '../../convex/channelData';

// ---------------------------------------------------------------------------
// Helpers — minimal document factories
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

function makeLegacyInfluencer(overrides: Record<string, unknown> = {}) {
  return {
    _id: fakeId('influencers'),
    _creationTime: Date.now(),
    name: 'Legacy Channel',
    platform: 'youtube' as const,
    handle: 'legacychannel',
    ...overrides,
  };
}

function makeManualFinancial(overrides: Record<string, unknown> = {}) {
  return {
    _id: fakeId('manualFinancials'),
    _creationTime: Date.now(),
    channelId: 'UCtest1234567890123456789',
    periodStart: 0,
    periodEnd: 0,
    periodType: 'annual' as const,
    estimatedRevenue: 120_000,
    enteredBy: 'officer-1',
    enteredAt: Date.now(),
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

function makeOAuthConnection(overrides: Record<string, unknown> = {}) {
  return {
    _id: fakeId('oauthConnections'),
    _creationTime: Date.now(),
    channelId: 'UCtest1234567890123456789',
    accessToken: 'ya29.test',
    accessTokenExpiresAt: Date.now() + 3600_000,
    grantedScopes: ['https://www.googleapis.com/auth/yt-analytics.readonly'],
    status: 'active' as const,
    connectedAt: Date.now(),
    ...overrides,
  };
}

function makeAnalyticsSync(overrides: Record<string, unknown> = {}) {
  return {
    _id: fakeId('analyticsSyncs'),
    _creationTime: Date.now(),
    channelId: 'UCtest1234567890123456789',
    connectionId: fakeId('oauthConnections'),
    periodStart: Date.now() - 30 * 86_400_000,
    periodEnd: Date.now(),
    estimatedRevenue: 10_000,
    views: 500_000,
    syncedAt: Date.now(),
    syncStatus: 'success' as const,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// EP — Empty / Single / Multiple Collections
// ---------------------------------------------------------------------------
describe('buildChannelSummaries — equivalence partitioning', () => {
  it('EP-CS-1 | empty collections → empty summaries', () => {
    const result = buildChannelSummaries(emptyCollections());
    expect(result).toEqual([]);
  });

  it('EP-CS-2 | one channel, no extras → basic summary with defaults', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];

    const result = buildChannelSummaries(collections);

    expect(result).toHaveLength(1);
    expect(result[0]!.channelId).toBe('UCtest1234567890123456789');
    expect(result[0]!.name).toBe('Test Channel');
    expect(result[0]!.hasManualFinancials).toBe(false);
    expect(result[0]!.hasConnectedAnalytics).toBe(false);
    expect(result[0]!.revenueSource).toBe('none');
    expect(result[0]!.analyticsStatus).toBe('not_connected');
  });

  it('EP-CS-3 | one channel with manual financials → hasManualFinancials=true', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];
    collections.manualFinancials = [makeManualFinancial()];

    const result = buildChannelSummaries(collections);

    expect(result[0]!.hasManualFinancials).toBe(true);
    expect(result[0]!.estimatedAnnualRevenue).toBe(120_000);
  });

  it('EP-CS-4 | one channel with tax estimate → hasTaxEstimate=true, revenue from estimate', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];
    collections.taxEstimates = [makeTaxEstimate()];

    const result = buildChannelSummaries(collections);

    expect(result[0]!.hasTaxEstimate).toBe(true);
    expect(result[0]!.estimatedTax).toBe(25_154);
    expect(result[0]!.estimatedAnnualRevenue).toBe(120_000);
    expect(result[0]!.revenueSource).toBe('manual');
  });

  it('EP-CS-5 | one channel with OAuth connection → hasConnectedAnalytics=true', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];
    collections.oauthConnections = [makeOAuthConnection()];

    const result = buildChannelSummaries(collections);

    expect(result[0]!.hasConnectedAnalytics).toBe(true);
    expect(result[0]!.analyticsStatus).toBe('active');
  });

  it('EP-CS-6 | legacy influencer with no matching channel → creates standalone summary', () => {
    const collections = emptyCollections();
    collections.legacyInfluencers = [
      makeLegacyInfluencer({ channelId: 'UClegacy12345678901234567' }),
    ];

    const result = buildChannelSummaries(collections);

    expect(result).toHaveLength(1);
    expect(result[0]!.channelId).toBe('UClegacy12345678901234567');
    expect(result[0]!.name).toBe('Legacy Channel');
  });

  it('EP-CS-7 | channel and legacy with same channelId → merged (channel wins)', () => {
    const collections = emptyCollections();
    const channelId = 'UCshared1234567890123456';
    collections.channels = [makeChannel({ channelId, name: 'New Channel Name' })];
    collections.legacyInfluencers = [
      makeLegacyInfluencer({ channelId, name: 'Old Legacy Name' }),
    ];

    const result = buildChannelSummaries(collections);

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('New Channel Name'); // channel wins
    expect(result[0]!.channelId).toBe(channelId);
  });

  it('EP-CS-8 | multiple channels → sorted alphabetically by name', () => {
    const collections = emptyCollections();
    collections.channels = [
      makeChannel({ _id: fakeId('channels', 1), channelId: 'UC_z', name: 'Zelda Channel' }),
      makeChannel({ _id: fakeId('channels', 2), channelId: 'UC_a', name: 'Alpha Channel' }),
      makeChannel({ _id: fakeId('channels', 3), channelId: 'UC_m', name: 'Middle Channel' }),
    ];

    const result = buildChannelSummaries(collections);

    expect(result).toHaveLength(3);
    expect(result[0]!.name).toBe('Alpha Channel');
    expect(result[1]!.name).toBe('Middle Channel');
    expect(result[2]!.name).toBe('Zelda Channel');
  });
});

// ---------------------------------------------------------------------------
// Revenue Source Precedence
// ---------------------------------------------------------------------------
describe('buildChannelSummaries — revenue source precedence', () => {
  it('tax estimate gross revenue takes precedence over manual revenue', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];
    collections.manualFinancials = [makeManualFinancial({ estimatedRevenue: 80_000 })];
    collections.taxEstimates = [makeTaxEstimate({ grossRevenue: 200_000 })];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.estimatedAnnualRevenue).toBe(200_000);
  });

  it('manual revenue is used when no tax estimate exists', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];
    collections.manualFinancials = [makeManualFinancial({ estimatedRevenue: 80_000 })];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.estimatedAnnualRevenue).toBe(80_000);
  });

  it('legacy revenue is used as last resort', () => {
    const collections = emptyCollections();
    collections.legacyInfluencers = [
      makeLegacyInfluencer({
        channelId: 'UClegacy_rev',
        estimatedAnnualRevenue: 50_000,
      }),
    ];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.estimatedAnnualRevenue).toBe(50_000);
    expect(result[0]!.revenueSource).toBe('legacy_unknown');
  });
});

// ---------------------------------------------------------------------------
// Analytics Status
// ---------------------------------------------------------------------------
describe('buildChannelSummaries — analytics status', () => {
  it('no connection → not_connected', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.analyticsStatus).toBe('not_connected');
  });

  it('active connection → active', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];
    collections.oauthConnections = [makeOAuthConnection({ status: 'active' })];
    collections.analyticsSyncs = [makeAnalyticsSync()];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.analyticsStatus).toBe('active');
  });

  it('expired connection → expired', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];
    collections.oauthConnections = [makeOAuthConnection({ status: 'expired' })];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.analyticsStatus).toBe('expired');
    expect(result[0]!.actionRequired).toBe(true);
  });

  it('revoked connection → revoked + actionRequired', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];
    collections.oauthConnections = [makeOAuthConnection({ status: 'revoked' })];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.analyticsStatus).toBe('revoked');
    expect(result[0]!.actionRequired).toBe(true);
  });

  it('stale analytics (>35 days old sync) → stale + actionRequired', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];
    collections.oauthConnections = [makeOAuthConnection({ status: 'active' })];
    const staleDate = Date.now() - 1000 * 60 * 60 * 24 * 40; // 40 days ago
    collections.analyticsSyncs = [makeAnalyticsSync({ syncedAt: staleDate })];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.analyticsStatus).toBe('stale');
    expect(result[0]!.actionRequired).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Public Data Status
// ---------------------------------------------------------------------------
describe('buildChannelSummaries — public data status', () => {
  it('channel with subscribers data → hasPublicData=true, publicDataStatus=public_imported', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel({ subscribers: 100_000 })];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.hasPublicData).toBe(true);
    expect(result[0]!.publicDataStatus).toBe('public_imported');
  });

  it('channel with publicRefreshError → publicDataStatus=refresh_failed + actionRequired', () => {
    const collections = emptyCollections();
    collections.channels = [
      makeChannel({ subscribers: 100_000, publicRefreshError: 'quota exceeded' }),
    ];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.publicDataStatus).toBe('refresh_failed');
    expect(result[0]!.actionRequired).toBe(true);
  });

  it('channel with no public signals → publicDataStatus=manual_only', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.publicDataStatus).toBe('manual_only');
  });
});

// ---------------------------------------------------------------------------
// Action Required
// ---------------------------------------------------------------------------
describe('buildChannelSummaries — actionRequired flag', () => {
  it('healthy channel → actionRequired=false', () => {
    const collections = emptyCollections();
    collections.channels = [makeChannel()];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.actionRequired).toBe(false);
  });

  it('public refresh failure → actionRequired=true', () => {
    const collections = emptyCollections();
    collections.channels = [
      makeChannel({ subscribers: 100, publicRefreshError: 'error' }),
    ];

    const result = buildChannelSummaries(collections);
    expect(result[0]!.actionRequired).toBe(true);
  });
});
