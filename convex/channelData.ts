import type { Doc, Id } from './_generated/dataModel';
import type { DatabaseReader } from './_generated/server';

export const DEFAULT_TAX_RATE = 0.25;
const ANALYTICS_STALE_WINDOW_MS = 1000 * 60 * 60 * 24 * 35;

type ComplianceStatus =
  | 'compliant'
  | 'non-compliant'
  | 'pending'
  | 'under-review';

type AssessmentStatus = 'draft' | 'pending' | 'approved' | 'disputed';
type AnalyticsConnectionStatus =
  | 'active'
  | 'expired'
  | 'revoked'
  | 'refresh_failed'
  | 'scope_insufficient';
type AnalyticsSyncStatus = 'success' | 'partial' | 'failed';
type RevenueSource = 'manual' | 'analytics' | 'blended' | 'legacy_unknown' | 'none';
type PublicDataStatus = 'public_imported' | 'manual_only' | 'refresh_failed';
type AnalyticsStatus =
  | 'not_connected'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'refresh_failed'
  | 'scope_insufficient'
  | 'stale';

type ChannelDoc = Doc<'channels'>;
type LegacyInfluencerDoc = Doc<'influencers'>;
type ManualFinancialDoc = Doc<'manualFinancials'>;
type TaxEstimateDoc = Doc<'taxEstimates'>;
type OAuthConnectionDoc = Doc<'oauthConnections'>;
type AnalyticsSyncDoc = Doc<'analyticsSyncs'>;
type TaxAssessmentDoc = Doc<'taxAssessments'>;

export type ChannelSummary = {
  _id: Id<'channels'> | Id<'influencers'> | string;
  docId?: Id<'channels'>;
  legacyId?: Id<'influencers'>;
  channelId: string;
  handle: string;
  name: string;
  customUrl?: string;
  profileImageUrl?: string;
  description?: string;
  email?: string;
  phone?: string;
  taxIdNumber?: string;
  notes?: string;
  subscribers?: number;
  subscriberCountHidden?: boolean;
  totalViews?: number;
  avgEngagementRate?: number;
  totalVideos?: number;
  uploadsPlaylistId?: string;
  topicCategories?: string[];
  country?: string;
  channelCreatedAt?: number;
  sourceLookupValue?: string;
  sourceResolvedAt?: number;
  lastPublicRefresh?: number;
  publicRefreshError?: string;
  complianceStatus?: ComplianceStatus;
  complianceScore?: number;
  lastAssessedAt?: number;
  estimatedMonthlyRevenue?: number;
  estimatedAnnualRevenue?: number;
  estimatedTax?: number;
  revenueSource: RevenueSource;
  taxEstimateSource: RevenueSource;
  hasPublicData: boolean;
  hasManualFinancials: boolean;
  hasConnectedAnalytics: boolean;
  hasTaxEstimate: boolean;
  analyticsStatus: AnalyticsStatus;
  analyticsConnectionStatus?: AnalyticsConnectionStatus;
  analyticsLastSyncedAt?: number;
  analyticsSyncStatus?: AnalyticsSyncStatus;
  analyticsError?: string;
  publicDataStatus: PublicDataStatus;
  actionRequired: boolean;
  assessmentStatus?: AssessmentStatus;
};

type ChannelCollections = {
  channels: ChannelDoc[];
  legacyInfluencers: LegacyInfluencerDoc[];
  manualFinancials: ManualFinancialDoc[];
  taxEstimates: TaxEstimateDoc[];
  oauthConnections: OAuthConnectionDoc[];
  analyticsSyncs: AnalyticsSyncDoc[];
  taxAssessments: TaxAssessmentDoc[];
};

function normalizeHandle(handle: string | undefined, fallback: string) {
  const value = (handle ?? fallback).trim();
  return value.replace(/^@/, '');
}

function toBusinessChannelId(channelId: string | undefined, fallback: string) {
  return channelId?.trim() || fallback;
}

function pickLatest<T>(items: T[], getTimestamp: (item: T) => number | undefined) {
  return items.reduce<T | undefined>((latest, item) => {
    if (!latest) return item;
    return (getTimestamp(item) ?? 0) > (getTimestamp(latest) ?? 0) ? item : latest;
  }, undefined);
}

function pickManualRevenue(financial: ManualFinancialDoc | undefined) {
  if (!financial) return undefined;
  return financial.declaredRevenue ?? financial.estimatedRevenue;
}

function estimateAnnualRevenueFromAnalytics(sync: AnalyticsSyncDoc | undefined) {
  if (!sync?.estimatedRevenue) return undefined;

  const durationMs = sync.periodEnd - sync.periodStart;
  const oneDay = 1000 * 60 * 60 * 24;
  const durationDays = durationMs > 0 ? durationMs / oneDay : 0;

  if (durationDays >= 330) {
    return sync.estimatedRevenue;
  }

  if (durationDays >= 25 && durationDays <= 45) {
    return sync.estimatedRevenue * 12;
  }

  return sync.estimatedRevenue;
}

function estimateMonthlyRevenueFromAnalytics(sync: AnalyticsSyncDoc | undefined) {
  if (!sync?.estimatedRevenue) return undefined;

  const durationMs = sync.periodEnd - sync.periodStart;
  const oneDay = 1000 * 60 * 60 * 24;
  const durationDays = durationMs > 0 ? durationMs / oneDay : 0;

  if (durationDays >= 330) {
    return sync.estimatedRevenue / 12;
  }

  return sync.estimatedRevenue;
}

function determineAnalyticsStatus(
  connection: OAuthConnectionDoc | undefined,
  latestSync: AnalyticsSyncDoc | undefined,
): AnalyticsStatus {
  if (!connection) return 'not_connected';

  if (connection.status !== 'active') {
    return connection.status;
  }

  if (latestSync?.syncedAt && latestSync.syncedAt < Date.now() - ANALYTICS_STALE_WINDOW_MS) {
    return 'stale';
  }

  return 'active';
}

function determinePublicDataStatus(
  hasPublicData: boolean,
  publicRefreshError: string | undefined,
): PublicDataStatus {
  if (publicRefreshError) return 'refresh_failed';
  if (hasPublicData) return 'public_imported';
  return 'manual_only';
}

function determineRevenueSource(
  taxEstimate: TaxEstimateDoc | undefined,
  manualRevenue: number | undefined,
  analyticsRevenue: number | undefined,
  legacyRevenue: number | undefined,
): RevenueSource {
  if (taxEstimate?.sourceType) {
    return taxEstimate.sourceType;
  }
  if (manualRevenue !== undefined && analyticsRevenue !== undefined) {
    return 'blended';
  }
  if (manualRevenue !== undefined) {
    return 'manual';
  }
  if (analyticsRevenue !== undefined) {
    return 'analytics';
  }
  if (legacyRevenue !== undefined) {
    return 'legacy_unknown';
  }
  return 'none';
}

function hasPublicChannelData(channel: ChannelDoc | undefined, legacy: LegacyInfluencerDoc | undefined) {
  return Boolean(
    channel?.lastPublicRefresh ||
      channel?.sourceLookupValue ||
      channel?.subscribers !== undefined ||
      channel?.totalViews !== undefined ||
      channel?.profileImageUrl ||
      legacy?.source === 'youtube_api' ||
      legacy?.sourceLookupValue ||
      legacy?.lastDataRefresh ||
      legacy?.subscribers !== undefined ||
      legacy?.totalViews !== undefined,
  );
}

export async function loadChannelCollections(db: DatabaseReader): Promise<ChannelCollections> {
  const [
    channels,
    legacyInfluencers,
    manualFinancials,
    taxEstimates,
    oauthConnections,
    analyticsSyncs,
    taxAssessments,
  ] = await Promise.all([
    db.query('channels').collect(),
    db.query('influencers').collect(),
    db.query('manualFinancials').collect(),
    db.query('taxEstimates').collect(),
    db.query('oauthConnections').collect(),
    db.query('analyticsSyncs').collect(),
    db.query('taxAssessments').collect(),
  ]);

  return {
    channels,
    legacyInfluencers,
    manualFinancials,
    taxEstimates,
    oauthConnections,
    analyticsSyncs,
    taxAssessments,
  };
}

export function buildChannelSummaries(collections: ChannelCollections): ChannelSummary[] {
  const legacyByChannelId = new Map<string, LegacyInfluencerDoc>();
  const legacyById = new Map<Id<'influencers'>, LegacyInfluencerDoc>();

  for (const legacy of collections.legacyInfluencers) {
    legacyById.set(legacy._id, legacy);
    const key = toBusinessChannelId(legacy.channelId, `legacy:${legacy._id}`);
    if (!legacyByChannelId.has(key)) {
      legacyByChannelId.set(key, legacy);
    }
  }

  const allChannelIds = new Set<string>();

  for (const channel of collections.channels) {
    allChannelIds.add(channel.channelId);
  }

  for (const legacy of collections.legacyInfluencers) {
    allChannelIds.add(toBusinessChannelId(legacy.channelId, `legacy:${legacy._id}`));
  }

  const summaries: ChannelSummary[] = [];

  for (const channelId of allChannelIds) {
    const channel = collections.channels.find((entry) => entry.channelId === channelId);
    const legacy = legacyByChannelId.get(channelId);

    const manualFinancialEntries = collections.manualFinancials.filter(
      (entry) => entry.channelId === channelId,
    );
    const taxEstimateEntries = collections.taxEstimates.filter((entry) => entry.channelId === channelId);
    const oauthEntries = collections.oauthConnections.filter((entry) => entry.channelId === channelId);
    const analyticsEntries = collections.analyticsSyncs.filter((entry) => entry.channelId === channelId);

    const assessmentEntries = collections.taxAssessments.filter((entry) => {
      if (entry.channelId && entry.channelId === channelId) {
        return true;
      }

      if (entry.influencerId) {
        const legacyInfluencer = legacyById.get(entry.influencerId);
        return (
          legacyInfluencer !== undefined &&
          toBusinessChannelId(legacyInfluencer.channelId, `legacy:${legacyInfluencer._id}`) === channelId
        );
      }

      return false;
    });

    const latestManual = pickLatest(manualFinancialEntries, (entry) => entry.updatedAt ?? entry.enteredAt);
    const latestManualAnnual =
      manualFinancialEntries
        .filter((entry) => entry.periodType === 'annual')
        .sort((left, right) => (right.updatedAt ?? right.enteredAt) - (left.updatedAt ?? left.enteredAt))[0] ??
      latestManual;
    const latestManualMonthly =
      manualFinancialEntries
        .filter((entry) => entry.periodType === 'monthly')
        .sort((left, right) => (right.updatedAt ?? right.enteredAt) - (left.updatedAt ?? left.enteredAt))[0] ??
      latestManual;
    const latestTaxEstimate = pickLatest(taxEstimateEntries, (entry) => entry.calculatedAt);
    const latestConnection = pickLatest(oauthEntries, (entry) => entry.lastTokenRefresh ?? entry.connectedAt);
    const latestAnalytics = pickLatest(analyticsEntries, (entry) => entry.syncedAt);
    const latestAssessment = pickLatest(assessmentEntries, (entry) => entry.assessmentDate);

    const manualAnnualRevenue = pickManualRevenue(latestManualAnnual);
    const manualMonthlyRevenue = pickManualRevenue(latestManualMonthly);
    const analyticsAnnualRevenue = estimateAnnualRevenueFromAnalytics(latestAnalytics);
    const analyticsMonthlyRevenue = estimateMonthlyRevenueFromAnalytics(latestAnalytics);
    const legacyAnnualRevenue = legacy?.estimatedAnnualRevenue;
    const legacyMonthlyRevenue = legacy?.estimatedMonthlyRevenue;

    const estimatedAnnualRevenue =
      latestTaxEstimate?.grossRevenue ??
      manualAnnualRevenue ??
      analyticsAnnualRevenue ??
      legacyAnnualRevenue;
    const estimatedMonthlyRevenue =
      manualMonthlyRevenue ??
      analyticsMonthlyRevenue ??
      legacyMonthlyRevenue ??
      (estimatedAnnualRevenue !== undefined ? estimatedAnnualRevenue / 12 : undefined);
    const estimatedTax = latestTaxEstimate?.estimatedTax ?? legacy?.taxLiability;

    const hasManualFinancials =
      manualFinancialEntries.length > 0 ||
      legacy?.estimatedMonthlyRevenue !== undefined ||
      legacy?.estimatedAnnualRevenue !== undefined ||
      legacy?.source === 'manual';
    const hasTaxEstimate = taxEstimateEntries.length > 0 || legacy?.taxLiability !== undefined;
    const hasConnectedAnalytics = oauthEntries.length > 0;
    const hasPublicData = hasPublicChannelData(channel, legacy);
    const analyticsStatus = determineAnalyticsStatus(latestConnection, latestAnalytics);
    const publicRefreshError = channel?.publicRefreshError ?? legacy?.sourceRefreshError;
    const publicDataStatus = determinePublicDataStatus(hasPublicData, publicRefreshError);
    const revenueSource = determineRevenueSource(
      latestTaxEstimate,
      manualAnnualRevenue,
      analyticsAnnualRevenue,
      legacyAnnualRevenue,
    );
    const actionRequired =
      publicDataStatus === 'refresh_failed' ||
      analyticsStatus === 'expired' ||
      analyticsStatus === 'refresh_failed' ||
      analyticsStatus === 'revoked' ||
      analyticsStatus === 'scope_insufficient' ||
      analyticsStatus === 'stale';

    summaries.push({
      _id: channel?._id ?? legacy?._id ?? channelId,
      docId: channel?._id,
      legacyId: legacy?._id,
      channelId,
      handle: normalizeHandle(channel?.handle ?? legacy?.handle, channelId),
      name: channel?.name ?? legacy?.name ?? 'Untitled channel',
      customUrl: channel?.customUrl ?? legacy?.customUrl,
      profileImageUrl: channel?.profileImageUrl ?? legacy?.profileImageUrl,
      description: channel?.description ?? legacy?.description,
      email: channel?.email ?? legacy?.email,
      phone: channel?.phone ?? legacy?.phone,
      taxIdNumber: channel?.taxIdNumber ?? legacy?.taxIdNumber,
      notes: channel?.notes ?? legacy?.notes,
      subscribers: channel?.subscribers ?? legacy?.subscribers,
      subscriberCountHidden: channel?.subscriberCountHidden ?? legacy?.subscriberCountHidden,
      totalViews: channel?.totalViews ?? legacy?.totalViews,
      avgEngagementRate: channel?.avgEngagementRate ?? legacy?.avgEngagementRate,
      totalVideos: channel?.totalVideos ?? legacy?.totalVideos,
      uploadsPlaylistId: channel?.uploadsPlaylistId ?? legacy?.uploadsPlaylistId,
      topicCategories: channel?.topicCategories ?? legacy?.topicCategories,
      country: channel?.country ?? legacy?.country,
      channelCreatedAt: channel?.channelCreatedAt ?? legacy?.channelCreatedAt,
      sourceLookupValue: channel?.sourceLookupValue ?? legacy?.sourceLookupValue,
      sourceResolvedAt: channel?.sourceResolvedAt ?? legacy?.sourceResolvedAt,
      lastPublicRefresh: channel?.lastPublicRefresh ?? legacy?.lastDataRefresh,
      publicRefreshError,
      complianceStatus: channel?.complianceStatus ?? legacy?.complianceStatus ?? 'pending',
      complianceScore: channel?.complianceScore ?? legacy?.complianceScore,
      lastAssessedAt: channel?.lastAssessedAt ?? legacy?.lastAssessedAt,
      estimatedMonthlyRevenue,
      estimatedAnnualRevenue,
      estimatedTax,
      revenueSource,
      taxEstimateSource: latestTaxEstimate?.sourceType ?? (estimatedTax !== undefined ? 'legacy_unknown' : 'none'),
      hasPublicData,
      hasManualFinancials,
      hasConnectedAnalytics,
      hasTaxEstimate,
      analyticsStatus,
      analyticsConnectionStatus: latestConnection?.status,
      analyticsLastSyncedAt: latestAnalytics?.syncedAt,
      analyticsSyncStatus: latestAnalytics?.syncStatus,
      analyticsError: latestConnection?.lastRefreshError ?? latestAnalytics?.syncError,
      publicDataStatus,
      actionRequired,
      assessmentStatus: latestAssessment?.status,
    });
  }

  return summaries.sort((left, right) => left.name.localeCompare(right.name));
}

export async function loadChannelSummaries(db: DatabaseReader) {
  const collections = await loadChannelCollections(db);
  return buildChannelSummaries(collections);
}
