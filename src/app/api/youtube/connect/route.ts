import { NextResponse } from 'next/server';

import { fetchAuthQuery, isAuthenticated } from '@/lib/auth-server';
import { api } from '~convex/_generated/api';

import { buildConnectAuthorizationUrl, sanitizeReturnTo } from '@/lib/youtube-connect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const channelId = requestUrl.searchParams.get('channelId')?.trim();
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get('returnTo'));

  if (!channelId) {
    return NextResponse.json({ error: 'Missing channelId query parameter.' }, { status: 400 });
  }

  try {
    if (!(await isAuthenticated())) {
      const signInUrl = new URL('/sign-in', requestUrl.origin);
      signInUrl.searchParams.set('returnTo', returnTo);
      signInUrl.searchParams.set('connectChannelId', channelId);
      return NextResponse.redirect(signInUrl);
    }

    const user = await fetchAuthQuery(api.auth.getCurrentUser);

    const target = await fetchAuthQuery(api.influencers.getChannelConnectionTarget, { channelId });
    if (!target) {
      return NextResponse.json({ error: 'Channel not found.' }, { status: 404 });
    }

    if (!target.connectable) {
      return NextResponse.json(
        { error: 'Import public YouTube channel data before connecting analytics.' },
        { status: 400 },
      );
    }

    const redirectUrl = buildConnectAuthorizationUrl({
      channelId: target.channelId,
      officerId: String(user._id),
      returnTo,
      origin: requestUrl.origin,
    });

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start YouTube connection.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
