# YouTube Public Lookup Plan

## Goal

Replace mock YouTube channel data with real public data from YouTube Data API v3 for channel lookup and import.

This plan is for **public lookup only**.

- Use **YouTube Data API v3** only
- Do **not** use YouTube Analytics API
- Do **not** add OAuth for creators
- Do **not** treat `estimatedRevenue` as available in this mode

## Confirmed API Scope

Public lookup should use these YouTube Data API v3 endpoints:

- `channels.list`
- `playlistItems.list`
- `videos.list`
- `search.list` only as a fallback

Public lookup should **not** rely on YouTube Analytics metrics like:

- `estimatedRevenue`
- `estimatedAdRevenue`
- `grossRevenue`
- `cpm`

Those belong to the YouTube Analytics API and require owner-authorized OAuth access, which is out of scope for this feature.

## Recommended Lookup Flow

Normalize user input first. Supported inputs:

- `@handle`
- `UC...` channel ID
- `https://www.youtube.com/@handle`
- `https://www.youtube.com/channel/UC...`
- `https://www.youtube.com/user/...`
- `https://www.youtube.com/c/...`

Resolve channels in this order:

1. If input is a channel ID, call `channels.list?id=...`
2. If input is a handle, call `channels.list?forHandle=...`
3. If input is a legacy username, call `channels.list?forUsername=...`
4. If input is a custom URL or unresolved text, fall back to `search.list?type=channel&q=...`
5. Once resolved, fetch full channel details with `channels.list`

Use `search.list` sparingly because it has a much higher quota cost than `channels.list`.

## Data To Fetch

Primary channel request:

- endpoint: `channels.list`
- parts: `snippet,statistics,contentDetails,topicDetails,status`

Useful fields:

- `id`
- `snippet.title`
- `snippet.description`
- `snippet.customUrl`
- `snippet.publishedAt`
- `snippet.country`
- `snippet.thumbnails`
- `statistics.subscriberCount`
- `statistics.viewCount`
- `statistics.videoCount`
- `contentDetails.relatedPlaylists.uploads`
- `topicDetails.topicCategories`

Optional recent-video enrichment:

1. Read uploads playlist ID from `contentDetails.relatedPlaylists.uploads`
2. Call `playlistItems.list` for latest uploads
3. Call `videos.list` for those video IDs

Useful recent video fields:

- `snippet.title`
- `snippet.publishedAt`
- `statistics.viewCount`
- `statistics.likeCount`
- `statistics.commentCount`
- `contentDetails.duration`

## Data Model Mapping

Map API data into the app like this:

- `name` <- `snippet.title`
- `channelId` <- `id`
- `handle` <- normalized input or `snippet.customUrl`
- `profileImageUrl` <- best thumbnail URL
- `subscribers` <- `statistics.subscriberCount`
- `totalViews` <- `statistics.viewCount`
- `totalVideos` <- `statistics.videoCount`
- `description` <- `snippet.description`
- `country` <- `snippet.country`
- `channelCreatedAt` <- `snippet.publishedAt`
- `uploadsPlaylistId` <- `contentDetails.relatedPlaylists.uploads`
- `topicCategories` <- `topicDetails.topicCategories`
- `lastDataRefresh` <- current timestamp
- `source` <- `youtube_api`
- `sourceLookupValue` <- raw lookup input
- `sourceResolvedAt` <- current timestamp

## Fields That Should Not Be API-Backed In Public Mode

These should be blank, optional, or clearly marked unavailable:

- `estimatedMonthlyRevenue`
- `estimatedAnnualRevenue`
- `taxLiability`

If the UI currently depends on them, show `--` or `Not available from public YouTube data`.

If desired later, some non-revenue metrics can be derived from recent public video data, but they should be labeled as derived rather than API-native.

## Implementation Plan

### 1. Add server-side YouTube integration

Create a server-only integration layer so the API key stays private.

Recommended files:

- `src/lib/youtube.ts`
- `src/app/api/youtube/channel/route.ts`

Responsibilities:

- normalize lookup input
- resolve channel ID
- fetch public channel details
- optionally fetch recent uploads
- map raw API responses into one app-level shape
- return clear error states for not found, quota, and invalid input

### 2. Add environment configuration

Add:

- `YOUTUBE_API_KEY`

Setup notes:

- enable **YouTube Data API v3** in Google Cloud
- restrict the key to that API
- keep requests server-side only

### 3. Re-enable channel lookup UI

Update `src/app/(dashboard)/channel-lookup/page.tsx` to:

- accept channel URL, handle, username, or channel ID
- call the new server route
- render loading, success, empty, and error states
- preview resolved channel data
- import or update the influencer record

Remove any remaining mock data generation from this flow.

### 4. Extend Convex persistence

Update `convex/influencers.ts` to:

- support import from public YouTube lookup
- accept and store `profileImageUrl`
- accept new public-source metadata fields
- upsert by `channelId` so imports are idempotent

Update `convex/schema.ts` to add any missing fields needed for:

- source tracking
- refresh timestamps
- description and country
- uploads playlist ID
- channel creation date
- topic categories

### 5. Update downstream UI assumptions

Review these files for assumptions that revenue always exists:

- `src/app/(dashboard)/page.tsx`
- `src/app/(dashboard)/analytics/page.tsx`
- `src/app/(dashboard)/reports/page.tsx`

Adjust them so public YouTube imports do not imply revenue came from the API.

## Recommended Canonical Identifier

Use `channelId` as the canonical YouTube identifier.

- Handles can change
- Usernames are legacy
- Search results can be ambiguous
- Channel IDs are the most stable key

## Error Handling

Handle these cases explicitly:

- invalid input format
- channel not found
- ambiguous custom URL search result
- quota exceeded
- missing optional fields like country or custom URL
- hidden or rounded subscriber counts

## Refresh Strategy

Store refresh metadata and support re-fetching channel data later.

Suggested fields:

- `lastDataRefresh`
- `sourceResolvedAt`
- `sourceRefreshError`

Also note that YouTube API policy guidance requires stored metadata from the Data API to be refreshed or deleted within 30 days.

## Suggested Delivery Order

1. Add `YOUTUBE_API_KEY` support
2. Build `src/lib/youtube.ts`
3. Build `src/app/api/youtube/channel/route.ts`
4. Re-enable `src/app/(dashboard)/channel-lookup/page.tsx`
5. Extend `convex/schema.ts`
6. Extend `convex/influencers.ts`
7. Update dashboard, analytics, and reports pages for missing revenue values
8. Test valid and invalid lookup inputs

## Verification Checklist

- Lookup works for `@handle`
- Lookup works for `UC...` channel IDs
- Lookup works for `/channel/...` URLs
- Lookup works for `/user/...` URLs where available
- Fallback works for unresolved `/c/...` URLs
- Import creates or updates one influencer per `channelId`
- No client-side API key exposure
- No mock YouTube data remains in the lookup path
- Revenue fields are not falsely presented as public API data
