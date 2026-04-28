/**
 * YouTube Input Normalization Unit Tests — src/lib/youtube.ts
 *
 * Tests the normalizeYoutubeLookup function which parses user input
 * (handles, channel IDs, URLs) into a canonical lookup shape.
 *
 * Equivalence partitioning and boundary value analysis applied.
 */

import { describe, expect, it } from 'vitest';

import { normalizeYoutubeLookup } from '../../src/lib/youtube';

// ---------------------------------------------------------------------------
// Equivalence Partitioning — Input Classes
// ---------------------------------------------------------------------------
describe('normalizeYoutubeLookup — equivalence partitioning', () => {
  // Class 1: @handle format
  it('EP-YT-1 | @handle → kind=handle', () => {
    const result = normalizeYoutubeLookup('@MKBHD');
    expect(result).toEqual({ kind: 'handle', value: 'MKBHD' });
  });

  it('EP-YT-1b | @handle with whitespace → trimmed', () => {
    const result = normalizeYoutubeLookup('  @TechChannel  ');
    expect(result).toEqual({ kind: 'handle', value: 'TechChannel' });
  });

  // Class 2: Channel ID format (UC...)
  it('EP-YT-2 | UC channel ID → kind=channelId', () => {
    const result = normalizeYoutubeLookup('UCXuqSBlHAE6Xw-yeJA0Tunw');
    expect(result).toEqual({ kind: 'channelId', value: 'UCXuqSBlHAE6Xw-yeJA0Tunw' });
  });

  // Class 3: Full YouTube URL with @handle
  it('EP-YT-3 | https://youtube.com/@handle → kind=handle', () => {
    const result = normalizeYoutubeLookup('https://www.youtube.com/@LinusTechTips');
    expect(result).toEqual({ kind: 'handle', value: 'LinusTechTips' });
  });

  // Class 4: Full YouTube URL with /channel/UC...
  it('EP-YT-4 | https://youtube.com/channel/UC... → kind=channelId', () => {
    const result = normalizeYoutubeLookup(
      'https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw',
    );
    expect(result).toEqual({ kind: 'channelId', value: 'UCXuqSBlHAE6Xw-yeJA0Tunw' });
  });

  // Class 5: Legacy /user/ URL
  it('EP-YT-5 | https://youtube.com/user/... → kind=username', () => {
    const result = normalizeYoutubeLookup('https://www.youtube.com/user/PewDiePie');
    expect(result).toEqual({ kind: 'username', value: 'PewDiePie' });
  });

  // Class 6: Custom /c/ URL
  it('EP-YT-6 | https://youtube.com/c/... → kind=custom', () => {
    const result = normalizeYoutubeLookup('https://www.youtube.com/c/Veritasium');
    expect(result).toEqual({ kind: 'custom', value: 'Veritasium' });
  });

  // Class 7: Non-YouTube URL → null
  it('EP-YT-7 | non-YouTube URL → null', () => {
    expect(normalizeYoutubeLookup('https://twitter.com/@someone')).toBeNull();
    expect(normalizeYoutubeLookup('https://google.com/channel/test')).toBeNull();
  });

  // Class 8: Empty / whitespace-only input → null
  it('EP-YT-8 | empty input → null', () => {
    expect(normalizeYoutubeLookup('')).toBeNull();
    expect(normalizeYoutubeLookup('   ')).toBeNull();
  });

  // Class 9: @ with nothing after → null
  it('EP-YT-9 | bare @ symbol → null', () => {
    expect(normalizeYoutubeLookup('@')).toBeNull();
    expect(normalizeYoutubeLookup('@  ')).toBeNull();
  });

  // Class 10: Plain text username (no @ or URL)
  it('EP-YT-10 | plain alphanumeric text → kind=handle', () => {
    const result = normalizeYoutubeLookup('MKBHD');
    expect(result).toEqual({ kind: 'handle', value: 'MKBHD' });
  });
});

// ---------------------------------------------------------------------------
// Boundary Value Analysis
// ---------------------------------------------------------------------------
describe('normalizeYoutubeLookup — boundary value analysis', () => {
  it('BVA-YT-1 | channel ID at minimum UC... length (22 chars) → accepted', () => {
    // UC + 20 chars minimum
    const channelId = 'UC' + 'a'.repeat(20);
    const result = normalizeYoutubeLookup(channelId);
    expect(result).toEqual({ kind: 'channelId', value: channelId });
  });

  it('BVA-YT-2 | UC prefix with 19 chars → not a channelId (too short for regex)', () => {
    const shortId = 'UC' + 'a'.repeat(19);
    const result = normalizeYoutubeLookup(shortId);
    // Falls through to handle since it is alphanumeric
    expect(result?.kind).not.toBe('channelId');
  });

  it('BVA-YT-3 | URL with query parameters → strips them', () => {
    const result = normalizeYoutubeLookup(
      'https://www.youtube.com/@MKBHD?sub_confirmation=1',
    );
    expect(result).toEqual({ kind: 'handle', value: 'MKBHD' });
  });

  it('BVA-YT-4 | URL with hash fragment → strips it', () => {
    const result = normalizeYoutubeLookup('https://www.youtube.com/@MKBHD#featured');
    expect(result).toEqual({ kind: 'handle', value: 'MKBHD' });
  });

  it('BVA-YT-5 | URL with trailing slashes → strips them', () => {
    const result = normalizeYoutubeLookup('https://youtube.com/@MKBHD///');
    expect(result).toEqual({ kind: 'handle', value: 'MKBHD' });
  });

  it('BVA-YT-6 | m.youtube.com (mobile) → accepted', () => {
    const result = normalizeYoutubeLookup('https://m.youtube.com/@MKBHD');
    expect(result).toEqual({ kind: 'handle', value: 'MKBHD' });
  });

  it('BVA-YT-7 | youtube.com root URL without path → null', () => {
    const result = normalizeYoutubeLookup('https://www.youtube.com/');
    expect(result).toBeNull();
  });

  it('BVA-YT-8 | URL without protocol prefix auto-fixed → accepted', () => {
    const result = normalizeYoutubeLookup('www.youtube.com/@MKBHD');
    expect(result).toEqual({ kind: 'handle', value: 'MKBHD' });
  });

  it('BVA-YT-9 | youtube.com/SomeChannel (no /c/ prefix) → kind=custom', () => {
    const result = normalizeYoutubeLookup('https://youtube.com/SomeChannel');
    expect(result).toEqual({ kind: 'custom', value: 'SomeChannel' });
  });

  it('BVA-YT-10 | handle with dots and hyphens → accepted', () => {
    const result = normalizeYoutubeLookup('tech-channel.gh');
    expect(result).toEqual({ kind: 'handle', value: 'tech-channel.gh' });
  });
});

// ---------------------------------------------------------------------------
// URL Parsing — Structural
// ---------------------------------------------------------------------------
describe('normalizeYoutubeLookup — structural URL parsing', () => {
  it('correctly extracts handle from youtube.com/@handle/videos', () => {
    const result = normalizeYoutubeLookup('https://www.youtube.com/@MKBHD/videos');
    // The parser splits on / and takes the @handle part
    expect(result?.kind).toBe('handle');
    expect(result?.value).toBe('MKBHD');
  });

  it('handles HTTP (not HTTPS) URLs', () => {
    const result = normalizeYoutubeLookup('http://youtube.com/@MKBHD');
    expect(result).toEqual({ kind: 'handle', value: 'MKBHD' });
  });

  it('rejects youtu.be root without path', () => {
    const result = normalizeYoutubeLookup('https://youtu.be/');
    expect(result).toBeNull();
  });
});
