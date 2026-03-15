import { createHmac, timingSafeEqual } from 'node:crypto';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const YOUTUBE_CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';
const YOUTUBE_ANALYTICS_URL = 'https://youtubeanalytics.googleapis.com/v2/reports';
const STATE_MAX_AGE_MS = 1000 * 60 * 15;

type ConnectState = {
  channelId: string;
  officerId: string;
  issuedAt: number;
  returnTo: string;
};

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
};

type AnalyticsSnapshot = {
  periodStart: number;
  periodEnd: number;
  estimatedRevenue?: number;
  estimatedAdRevenue?: number;
  estimatedRedRevenue?: number;
  monetizedPlaybacks?: number;
  cpm?: number;
  views?: number;
  watchTimeMinutes?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  subscribersGained?: number;
  subscribersLost?: number;
  syncStatus: 'success' | 'partial' | 'failed';
  syncError?: string;
};

function getRequiredEnv(name: 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET' | 'SITE_URL') {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

function getStateSecret() {
  return process.env.BETTER_AUTH_SECRET ?? getRequiredEnv('GOOGLE_CLIENT_SECRET');
}

function signState(encodedState: string) {
  return createHmac('sha256', getStateSecret()).update(encodedState).digest('base64url');
}

function serializeState(state: ConnectState) {
  const encodedState = Buffer.from(JSON.stringify(state)).toString('base64url');
  return `${encodedState}.${signState(encodedState)}`;
}

export function parseConnectState(value: string) {
  const [encodedState, signature] = value.split('.');
  if (!encodedState || !signature) {
    throw new Error('Invalid OAuth state');
  }

  const expectedSignature = signState(encodedState);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid OAuth state signature');
  }

  const state = JSON.parse(Buffer.from(encodedState, 'base64url').toString('utf8')) as ConnectState;
  if (Date.now() - state.issuedAt > STATE_MAX_AGE_MS) {
    throw new Error('OAuth state expired');
  }
  return state;
}

export function getConnectCallbackUrl(origin?: string) {
  return new URL('/api/youtube/connect/callback', origin ?? getRequiredEnv('SITE_URL')).toString();
}

export function sanitizeReturnTo(value: string | null | undefined, fallback = '/influencers') {
  if (!value || !value.startsWith('/')) {
    return fallback;
  }
  return value;
}

export function buildConnectAuthorizationUrl(args: {
  channelId: string;
  officerId: string;
  returnTo: string;
  origin?: string;
}) {
  const searchParams = new URLSearchParams({
    client_id: getRequiredEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: getConnectCallbackUrl(args.origin),
    response_type: 'code',
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent select_account',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
    ].join(' '),
    state: serializeState({
      channelId: args.channelId,
      officerId: args.officerId,
      issuedAt: Date.now(),
      returnTo: args.returnTo,
    }),
  });

  return `${GOOGLE_AUTH_URL}?${searchParams.toString()}`;
}

export async function exchangeGoogleAuthorizationCode(args: {
  code: string;
  origin?: string;
}) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: args.code,
      client_id: getRequiredEnv('GOOGLE_CLIENT_ID'),
      client_secret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: getConnectCallbackUrl(args.origin),
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });

  const data = (await response.json()) as GoogleTokenResponse & {
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description ?? data.error ?? 'Google token exchange failed');
  }

  return data;
}

async function fetchGoogleJson<T>(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });
  const data = (await response.json()) as T & {
    error?: { message?: string; status?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Google request failed with status ${response.status}`);
  }

  return data;
}

export async function fetchGoogleUserInfo(accessToken: string) {
  return fetchGoogleJson<GoogleUserInfo>(GOOGLE_USERINFO_URL, accessToken);
}

export async function fetchOwnedYouTubeChannelIds(accessToken: string) {
  const data = await fetchGoogleJson<{
    items?: Array<{ id?: string }>;
  }>(
    `${YOUTUBE_CHANNELS_URL}?part=id&mine=true&maxResults=50`,
    accessToken,
  );

  return (data.items ?? []).map((item) => item.id).filter((channelId): channelId is string => Boolean(channelId));
}

function toIsoDateString(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function toOptionalNumber(value: unknown) {
  if (typeof value !== 'number') {
    return undefined;
  }
  return Number.isFinite(value) ? value : undefined;
}

export async function fetchYouTubeRevenueSnapshot(accessToken: string): Promise<AnalyticsSnapshot> {
  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() - 1);

  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - 29);

  const url = new URL(YOUTUBE_ANALYTICS_URL);
  url.searchParams.set('ids', 'channel==MINE');
  url.searchParams.set(
    'metrics',
    [
      'estimatedRevenue',
      'estimatedAdRevenue',
      'estimatedRedRevenue',
      'monetizedPlaybacks',
      'cpm',
      'views',
      'estimatedMinutesWatched',
      'likes',
      'comments',
      'shares',
      'subscribersGained',
      'subscribersLost',
    ].join(','),
  );
  url.searchParams.set('startDate', toIsoDateString(startDate.getTime()));
  url.searchParams.set('endDate', toIsoDateString(endDate.getTime()));

  const data = await fetchGoogleJson<{
    columnHeaders?: Array<{ name?: string }>;
    rows?: Array<Array<number | string>>;
  }>(url.toString(), accessToken);

  const headers = (data.columnHeaders ?? []).map((entry) => entry.name ?? '');
  const row = data.rows?.[0] ?? [];
  const values = Object.fromEntries(headers.map((header, index) => [header, row[index]]));

  return {
    periodStart: startDate.getTime(),
    periodEnd: endDate.getTime(),
    estimatedRevenue: toOptionalNumber(values.estimatedRevenue),
    estimatedAdRevenue: toOptionalNumber(values.estimatedAdRevenue),
    estimatedRedRevenue: toOptionalNumber(values.estimatedRedRevenue),
    monetizedPlaybacks: toOptionalNumber(values.monetizedPlaybacks),
    cpm: toOptionalNumber(values.cpm),
    views: toOptionalNumber(values.views),
    watchTimeMinutes: toOptionalNumber(values.estimatedMinutesWatched),
    likes: toOptionalNumber(values.likes),
    comments: toOptionalNumber(values.comments),
    shares: toOptionalNumber(values.shares),
    subscribersGained: toOptionalNumber(values.subscribersGained),
    subscribersLost: toOptionalNumber(values.subscribersLost),
    syncStatus: 'success',
  };
}
