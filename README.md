# Graitld

A dashboard application for managing influencers and channel analytics.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Convex
- **Auth**: Better Auth
- **UI Components**: Shadcn/ui, Base UI, HugeIcons

## Getting Started

### Prerequisites

- Bun
- Convex account

### Installation

```bash
bun install
```

### Environment

Add the following to `.env.local`:

```bash
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
```

The key should have **YouTube Data API v3** enabled and should be used server-side only.

### Development

Run both frontend and backend:

```bash
bun dev
```

Or run separately:

```bash
bun dev:frontend  # Next.js dev server
bun dev:backend   # Convex dev server
```

### Build

```bash
bun run build
bun run start
```

## Scripts

| Command        | Description                           |
| -------------- | ------------------------------------- |
| `dev`          | Run frontend and backend concurrently |
| `dev:frontend` | Start Next.js dev server              |
| `dev:backend`  | Start Convex dev server               |
| `build`        | Build for production                  |
| `start`        | Start production server               |
| `lint`         | Run ESLint                            |
| `format`       | Format code with oxfmt                |

## Project Structure

```
src/
  app/
    (dashboard)/     # Dashboard pages
    api/             # API routes
  components/
    ui/              # Shadcn components
  hooks/
  lib/
convex/              # Backend functions and schema
```

## YouTube Public Lookup

The `Channel Lookup` page now uses the public YouTube Data API v3 for channel import.

- supported inputs: `@handle`, channel IDs, and channel URLs
- uses public metadata and public stats only
- does not use YouTube Analytics or OAuth
- does not expose public revenue metrics because the public API does not provide them
