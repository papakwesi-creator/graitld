import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { ConvexError } from 'convex/values';

import { components } from './_generated/api';
import { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import authConfig from './auth.config';

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              redirectURI: process.env.GOOGLE_REDIRECT_URI,
              accessType: 'offline',
              prompt: 'select_account consent',
              scope: [
                'openid',
                'email',
                'profile',
                'https://www.googleapis.com/auth/youtube.readonly',
                'https://www.googleapis.com/auth/yt-analytics.readonly',
                'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
              ],
            },
          }
        : undefined,
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
    ],
  });
};

export const requireAuth = async (ctx: GenericCtx<DataModel>) => {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new ConvexError('Unauthenticated');
  }
  return user;
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
