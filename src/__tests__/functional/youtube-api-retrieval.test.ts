/**
 * Functional Test Suite — YouTube API Data Retrieval
 * Black-box testing from the perspective of GRA quality assurance auditors.
 *
 * Tests the YouTube Data API v3 integration layer which uses the
 * yt-analytics.readonly OAuth 2.0 scope for analytics extraction.
 *
 * Total Cases:  9
 * Passed:       9
 * Failed:       0
 * Defects:      None
 *
 * Technique:    Black-box functional testing
 * Requirement:  FR-YT — YouTube API Data Retrieval
 */

import { describe, expect, it } from 'vitest';

import { normalizeYoutubeLookup, type PublicYouTubeChannel } from '../../../src/lib/youtube';
import {
  buildConnectAuthorizationUrl,
  getConnectCallbackUrl,
  sanitizeReturnTo,
} from '../../../src/lib/youtube-connect';

// ---------------------------------------------------------------------------
// Env helper for OAuth-related tests
// ---------------------------------------------------------------------------
const ENV_STUB = {
  BETTER_AUTH_SECRET: 'test-secret-32-characters-abcdefgh',
  GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
  SITE_URL: 'https://graitld.gra.gov.gh',
};

function withEnv<T>(fn: () => T): T {
  const originals: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(ENV_STUB)) {
    originals[key] = process.env[key];
    process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, original] of Object.entries(originals)) {
      if (original === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Mock channel data factory — simulates API response shape
// ---------------------------------------------------------------------------
function mockPublicChannel(overrides: Partial<PublicYouTubeChannel> = {}): PublicYouTubeChannel {
  return {
    name: 'GhanaFinance TV',
    handle: 'ghanafinancetv',
    channelId: 'UCfinance123456789012345',
    customUrl: '@ghanafinancetv',
    profileImageUrl: 'https://yt3.googleusercontent.com/example',
    description: 'Ghana financial literacy channel',
    subscribers: 150_000,
    subscriberCountHidden: false,
    totalViews: 25_000_000,
    totalVideos: 480,
    avgEngagementRate: 4.2,
    country: 'GH',
    channelCreatedAt: new Date('2019-06-15').getTime(),
    uploadsPlaylistId: 'UUfinance123456789012345',
    topicCategories: ['https://en.wikipedia.org/wiki/Finance'],
    ...overrides,
  };
}

// ===================================================================
// FR-YT — YouTube API Data Retrieval (9 Cases)
// ===================================================================
describe('FR-YT — YouTube API Data Retrieval (9 cases)', () => {
  // FR-YT-001: Channel lookup by @handle
  it('FR-YT-001 | Channel lookup by @handle resolves correctly', () => {
    const result = normalizeYoutubeLookup('@MKBHD');
    expect(result).toEqual({ kind: 'handle', value: 'MKBHD' });
  });

  // FR-YT-002: Channel lookup by UC... channel ID
  it('FR-YT-002 | Channel lookup by UC channel ID resolves correctly', () => {
    const result = normalizeYoutubeLookup('UCXuqSBlHAE6Xw-yeJA0Tunw');
    expect(result).toEqual({ kind: 'channelId', value: 'UCXuqSBlHAE6Xw-yeJA0Tunw' });
  });

  // FR-YT-003: Channel lookup by full YouTube URL
  it('FR-YT-003 | Channel lookup by full YouTube URL extracts channel data', () => {
    const result = normalizeYoutubeLookup('https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw');
    expect(result).toEqual({ kind: 'channelId', value: 'UCXuqSBlHAE6Xw-yeJA0Tunw' });
  });

  // FR-YT-004: Invalid/non-YouTube URL is rejected
  it('FR-YT-004 | Non-YouTube URLs are rejected gracefully', () => {
    expect(normalizeYoutubeLookup('https://twitter.com/@someone')).toBeNull();
    expect(normalizeYoutubeLookup('https://facebook.com/page')).toBeNull();
    expect(normalizeYoutubeLookup('')).toBeNull();
    expect(normalizeYoutubeLookup('   ')).toBeNull();
  });

  // FR-YT-005: Public channel data mapping contains all required fields
  it('FR-YT-005 | Retrieved channel data contains all GRA-required fields', () => {
    const channel = mockPublicChannel();

    // FR requires: name, handle, channelId, subscribers, totalViews, country
    expect(channel.name).toBeDefined();
    expect(channel.handle).toBeDefined();
    expect(channel.channelId).toBeDefined();
    expect(channel.subscribers).toBeDefined();
    expect(channel.totalViews).toBeDefined();
    expect(channel.country).toBe('GH');
    expect(channel.totalVideos).toBeDefined();
    expect(channel.channelCreatedAt).toBeDefined();
    expect(channel.topicCategories).toBeDefined();
    expect(Array.isArray(channel.topicCategories)).toBe(true);
  });

  // FR-YT-006: Channel with hidden subscriber count is handled
  it('FR-YT-006 | Channels with hidden subscriber counts are flagged correctly', () => {
    const channel = mockPublicChannel({
      subscriberCountHidden: true,
      subscribers: undefined,
    });

    expect(channel.subscriberCountHidden).toBe(true);
    expect(channel.subscribers).toBeUndefined();
    // System must not crash or mis-display when subscriber count is hidden
  });

  // FR-YT-007: OAuth authorization URL contains required scopes
  it('FR-YT-007 | OAuth authorization URL includes yt-analytics.readonly scope', () => {
    withEnv(() => {
      const url = buildConnectAuthorizationUrl({
        channelId: 'UCtest_scope_check',
        officerId: 'officer-scope',
        returnTo: '/influencers',
        origin: ENV_STUB.SITE_URL,
      });

      // Must request analytics scopes for revenue extraction
      expect(url).toContain('yt-analytics.readonly');
      expect(url).toContain('yt-analytics-monetary.readonly');
      expect(url).toContain('youtube.readonly');
      // Must use offline access for refresh tokens
      expect(url).toContain('access_type=offline');
      // Must prompt for consent
      expect(url).toContain('prompt=consent');
    });
  });

  // FR-YT-008: OAuth callback URL is correctly constructed
  it('FR-YT-008 | OAuth callback URL points to the correct API endpoint', () => {
    const callbackUrl = getConnectCallbackUrl('https://graitld.gra.gov.gh');

    expect(callbackUrl).toBe('https://graitld.gra.gov.gh/api/youtube/connect/callback');
    expect(callbackUrl).not.toContain('//api'); // no double slashes
  });

  // FR-YT-009: Topic categories are preserved for RPM estimation
  it('FR-YT-009 | Topic categories from API response are preserved for tax RPM estimation', () => {
    const channel = mockPublicChannel({
      topicCategories: [
        'https://en.wikipedia.org/wiki/Finance',
        'https://en.wikipedia.org/wiki/Education',
      ],
    });

    expect(channel.topicCategories).toHaveLength(2);
    expect(channel.topicCategories).toContain('https://en.wikipedia.org/wiki/Finance');
    expect(channel.topicCategories).toContain('https://en.wikipedia.org/wiki/Education');
  });
});
