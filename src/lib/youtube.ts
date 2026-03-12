type YouTubeThumbnailMap = Partial<
  Record<'default' | 'medium' | 'high' | 'standard' | 'maxres', { url?: string }>
>;

type YouTubeChannelItem = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    customUrl?: string;
    publishedAt?: string;
    country?: string;
    thumbnails?: YouTubeThumbnailMap;
  };
  statistics?: {
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
    viewCount?: string;
    videoCount?: string;
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
  topicDetails?: {
    topicCategories?: string[];
  };
};

type YouTubePlaylistItem = {
  contentDetails?: {
    videoId?: string;
  };
};

type YouTubeVideoItem = {
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
};

export type PublicYouTubeChannel = {
  name: string;
  handle: string;
  channelId: string;
  customUrl?: string;
  profileImageUrl?: string;
  description?: string;
  subscribers?: number;
  subscriberCountHidden: boolean;
  totalViews?: number;
  totalVideos?: number;
  avgEngagementRate?: number;
  country?: string;
  channelCreatedAt?: number;
  uploadsPlaylistId?: string;
  topicCategories: string[];
};

type NormalizedLookup = {
  kind: 'channelId' | 'handle' | 'username' | 'custom';
  value: string;
};

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing YOUTUBE_API_KEY environment variable');
  }
  return apiKey;
}

function pickBestThumbnail(thumbnails?: YouTubeThumbnailMap) {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url
  );
}

function parseCount(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sanitizeLookupInput(input: string) {
  const trimmed = input.trim();
  if (/^(www\.)?youtube\.com\//i.test(trimmed) || /^m\.youtube\.com\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function normalizeYoutubeLookup(input: string): NormalizedLookup | null {
  const raw = sanitizeLookupInput(input);
  if (!raw) return null;

  const withoutQuery = raw.split('?')[0]?.split('#')[0] ?? raw;
  const trimmed = withoutQuery.replace(/\/+$/, '');

  if (/^UC[\w-]{20,}$/.test(trimmed)) {
    return { kind: 'channelId', value: trimmed };
  }

  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1).trim();
    return handle ? { kind: 'handle', value: handle } : null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }

    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    const isYouTubeHost =
      host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be';
    if (!isYouTubeHost) {
      return null;
    }

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 0) {
      return null;
    }

    const [first, second] = parts;
    if (first.startsWith('@')) {
      return { kind: 'handle', value: first.slice(1) };
    }
    if (first === 'channel' && second) {
      return { kind: 'channelId', value: second };
    }
    if (first === 'user' && second) {
      return { kind: 'username', value: second };
    }
    if (first === 'c' && second) {
      return { kind: 'custom', value: second };
    }
    return { kind: 'custom', value: second ?? first };
  }

  if (/^[A-Za-z0-9._-]+$/.test(trimmed)) {
    return { kind: 'handle', value: trimmed.replace(/^@/, '') };
  }

  return { kind: 'custom', value: trimmed };
}

async function youtubeFetch<T>(path: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  searchParams.set('key', getApiKey());

  const response = await fetch(`${YOUTUBE_API_BASE}/${path}?${searchParams.toString()}`, {
    cache: 'no-store',
  });

  const data = await response.json();
  if (!response.ok) {
    const message =
      data?.error?.message || `YouTube API request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

async function getChannelById(channelId: string) {
  const data = await youtubeFetch<{ items?: YouTubeChannelItem[] }>('channels', {
    part: 'snippet,statistics,contentDetails,topicDetails,status',
    id: channelId,
  });
  return data.items?.[0] ?? null;
}

async function getChannelByHandle(handle: string) {
  const data = await youtubeFetch<{ items?: YouTubeChannelItem[] }>('channels', {
    part: 'snippet,statistics,contentDetails,topicDetails,status',
    forHandle: handle,
  });
  return data.items?.[0] ?? null;
}

async function getChannelByUsername(username: string) {
  const data = await youtubeFetch<{ items?: YouTubeChannelItem[] }>('channels', {
    part: 'snippet,statistics,contentDetails,topicDetails,status',
    forUsername: username,
  });
  return data.items?.[0] ?? null;
}

async function searchChannelId(query: string) {
  const normalizedQuery = query.trim().toLowerCase().replace(/^@/, '');

  const data = await youtubeFetch<{
    items?: Array<{
      id?: { channelId?: string };
      snippet?: { title?: string; customUrl?: string };
    }>;
  }>('search', {
    part: 'snippet',
    q: query,
    type: 'channel',
    maxResults: 5,
  });

  const items = (data.items ?? []).filter((item) => item.id?.channelId);

  const customUrlMatches = items.filter((item) => {
    const customUrl = item.snippet?.customUrl?.trim().toLowerCase().replace(/^@/, '');
    return customUrl === normalizedQuery;
  });

  if (customUrlMatches.length === 1) {
    return customUrlMatches[0]?.id?.channelId ?? null;
  }

  const titleMatches = items.filter((item) => {
    const title = item.snippet?.title?.trim().toLowerCase();
    return title === normalizedQuery;
  });

  if (titleMatches.length === 1) {
    return titleMatches[0]?.id?.channelId ?? null;
  }

  return null;
}

async function getRecentVideoIds(uploadsPlaylistId: string, maxResults = 10) {
  const data = await youtubeFetch<{ items?: YouTubePlaylistItem[] }>('playlistItems', {
    part: 'contentDetails',
    playlistId: uploadsPlaylistId,
    maxResults,
  });

  return (data.items ?? [])
    .map((item) => item.contentDetails?.videoId)
    .filter((videoId): videoId is string => Boolean(videoId));
}

async function getAverageEngagementRate(videoIds: string[]) {
  if (videoIds.length === 0) return undefined;

  const data = await youtubeFetch<{ items?: YouTubeVideoItem[] }>('videos', {
    part: 'statistics',
    id: videoIds.join(','),
    maxResults: videoIds.length,
  });

  const rates = (data.items ?? [])
    .map((item) => {
      const views = parseCount(item.statistics?.viewCount);
      const likes = parseCount(item.statistics?.likeCount) ?? 0;
      const comments = parseCount(item.statistics?.commentCount) ?? 0;
      if (!views || views <= 0) return null;
      return ((likes + comments) / views) * 100;
    })
    .filter((value): value is number => value !== null);

  if (rates.length === 0) return undefined;
  return Number((rates.reduce((sum, value) => sum + value, 0) / rates.length).toFixed(2));
}

function toPublicChannel(
  channel: YouTubeChannelItem,
  avgEngagementRate?: number,
): PublicYouTubeChannel {
  const handle = channel.snippet?.customUrl
    ? channel.snippet.customUrl.replace(/^@/, '')
    : channel.id;

  return {
    name: channel.snippet?.title ?? 'Unknown channel',
    handle,
    channelId: channel.id,
    customUrl: channel.snippet?.customUrl,
    profileImageUrl: pickBestThumbnail(channel.snippet?.thumbnails),
    description: channel.snippet?.description,
    subscribers: parseCount(channel.statistics?.subscriberCount),
    subscriberCountHidden: channel.statistics?.hiddenSubscriberCount ?? false,
    totalViews: parseCount(channel.statistics?.viewCount),
    totalVideos: parseCount(channel.statistics?.videoCount),
    avgEngagementRate,
    country: channel.snippet?.country,
    channelCreatedAt: channel.snippet?.publishedAt
      ? new Date(channel.snippet.publishedAt).getTime()
      : undefined,
    uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
    topicCategories: channel.topicDetails?.topicCategories ?? [],
  };
}

export async function lookupPublicYouTubeChannel(input: string) {
  const normalized = normalizeYoutubeLookup(input);
  if (!normalized) {
    return {
      code: 'invalid_input' as const,
      error: 'Enter a YouTube handle, channel ID, or channel URL.' as const,
    };
  }

  let channel: YouTubeChannelItem | null = null;

  if (normalized.kind === 'channelId') {
    channel = await getChannelById(normalized.value);
  } else if (normalized.kind === 'handle') {
    channel = await getChannelByHandle(normalized.value);
    if (!channel) {
      const channelId = await searchChannelId(normalized.value);
      if (channelId) {
        channel = await getChannelById(channelId);
      }
    }
  } else if (normalized.kind === 'username') {
    channel = await getChannelByUsername(normalized.value);
    if (!channel) {
      const channelId = await searchChannelId(normalized.value);
      if (channelId) {
        channel = await getChannelById(channelId);
      }
    }
  } else {
    const channelId = await searchChannelId(normalized.value);
    if (channelId) {
      channel = await getChannelById(channelId);
    }
  }

  if (!channel) {
    return {
      code: 'not_found' as const,
      error: 'No public YouTube channel matched that lookup.' as const,
    };
  }

  let avgEngagementRate: number | undefined;
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (uploadsPlaylistId) {
    const videoIds = await getRecentVideoIds(uploadsPlaylistId, 10);
    avgEngagementRate = await getAverageEngagementRate(videoIds);
  }

  return {
    data: toPublicChannel(channel, avgEngagementRate),
  };
}
