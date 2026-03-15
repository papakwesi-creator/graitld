import { NextResponse } from 'next/server';

import { fetchAuthMutation, fetchAuthQuery, isAuthenticated } from '@/lib/auth-server';
import { api } from '~convex/_generated/api';

import {
  exchangeGoogleAuthorizationCode,
  fetchGoogleUserInfo,
  fetchOwnedYouTubeChannelIds,
  fetchYouTubeRevenueSnapshot,
  parseConnectState,
  sanitizeReturnTo,
} from '@/lib/youtube-connect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const stateParam = requestUrl.searchParams.get('state');
  const oauthError = requestUrl.searchParams.get('error');

  const redirectWithMessage = (path: string, params: Record<string, string>) => {
    const url = new URL(path, requestUrl.origin);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return NextResponse.redirect(url);
  };

  if (oauthError) {
    return redirectWithMessage('/influencers', {
      connectError: oauthError,
    });
  }

  if (!code || !stateParam) {
    return redirectWithMessage('/influencers', {
      connectError: 'missing_oauth_parameters',
    });
  }

  try {
    const state = parseConnectState(stateParam);

    if (!(await isAuthenticated())) {
      return redirectWithMessage('/sign-in', {
        returnTo: '/influencers',
        connectChannelId: state.channelId,
      });
    }

    const officer = await fetchAuthQuery(api.auth.getCurrentUser);

    const returnTo = sanitizeReturnTo(state.returnTo);

    if (state.officerId !== String(officer._id)) {
      return redirectWithMessage(returnTo, {
        connectError: 'session_mismatch',
      });
    }

    const target = await fetchAuthQuery(api.influencers.getChannelConnectionTarget, {
      channelId: state.channelId,
    });

    if (!target || !target.connectable) {
      return redirectWithMessage(returnTo, {
        connectError: 'channel_not_connectable',
      });
    }

    const tokenResponse = await exchangeGoogleAuthorizationCode({
      code,
      origin: requestUrl.origin,
    });
    const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token);
    const ownedChannelIds = await fetchOwnedYouTubeChannelIds(tokenResponse.access_token);

    if (!ownedChannelIds.includes(state.channelId)) {
      return redirectWithMessage(returnTo, {
        connectError: 'google_account_does_not_manage_channel',
        channelId: state.channelId,
      });
    }

    let analytics;
    try {
      analytics = await fetchYouTubeRevenueSnapshot(tokenResponse.access_token);
    } catch (error) {
      analytics = {
        periodStart: Date.now() - 1000 * 60 * 60 * 24 * 30,
        periodEnd: Date.now(),
        syncStatus: 'failed' as const,
        syncError:
          error instanceof Error ? error.message : 'Failed to pull YouTube Analytics snapshot',
      };
    }

    await fetchAuthMutation(api.influencers.completeChannelAnalyticsConnection, {
      channelId: state.channelId,
      googleAccountId: userInfo.sub,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      accessTokenExpiresAt: Date.now() + tokenResponse.expires_in * 1000,
      grantedScopes: (tokenResponse.scope ?? '').split(' ').filter(Boolean),
      status: analytics.syncStatus === 'failed' ? 'refresh_failed' : 'active',
      lastRefreshError: analytics.syncStatus === 'failed' ? analytics.syncError : undefined,
      analytics,
    });

    return redirectWithMessage(returnTo, {
      connectSuccess: '1',
      channelId: state.channelId,
    });
  } catch (error) {
    return redirectWithMessage('/influencers', {
      connectError: error instanceof Error ? error.message : 'youtube_connect_failed',
    });
  }
}
