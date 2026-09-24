import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink, twoFactor } from 'better-auth/plugins';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { sendMagicLinkEmail } from './authMethods';

// OAuth providers are only registered when their credentials are configured
const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
    ? {
        microsoft: {
          clientId: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
        },
      }
    : {}),
};

export const auth = betterAuth({
  appName: 'Farm-Fin',
  secret: process.env.BETTER_AUTH_SECRET || 'farmfin_super_secret_better_auth_key_2026',
  baseURL:
    process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // Extra origins allowed to call the auth API, e.g. preview deploys:
  // BETTER_AUTH_TRUSTED_ORIGINS="https://*-farm-fin.<conta>.workers.dev"
  trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      twoFactor: schema.twoFactors,
    },
  }),
  advanced: {
    database: {
      // users.id (and the FKs pointing to it) are Postgres uuid columns, while the
      // other auth tables use varchar ids without a DB default - so always
      // generate a UUID here ('uuid' would defer to the DB and fail on those).
      generateId: () => crypto.randomUUID(),
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'Produtor',
        input: true,
      },
      organizationId: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
  },
  socialProviders,
  plugins: [
    magicLink({
      expiresIn: 5 * 60,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
    twoFactor({
      issuer: 'Farm-Fin',
    }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});
