import { NextResponse } from 'next/server';

import { lookupPublicYouTubeChannel } from '@/lib/youtube';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';

  if (!query) {
    return NextResponse.json({ error: 'Missing q query parameter.' }, { status: 400 });
  }

  try {
    const result = await lookupPublicYouTubeChannel(query);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown YouTube lookup failure';
    const status =
      message.includes('quota') || message.includes('Quota')
        ? 429
        : message.includes('Missing q query parameter')
          ? 400
          : message.includes('YOUTUBE_API_KEY')
            ? 500
            : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
