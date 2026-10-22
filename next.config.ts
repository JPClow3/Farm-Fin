import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';
import { resolveBuildInfo } from './scripts/build-info.mjs';
import { version } from './package.json';

const buildInfo = resolveBuildInfo();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_BUILD_SHA: buildInfo.commit,
    NEXT_PUBLIC_BUILD_DIRTY: String(buildInfo.dirty),
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? 'joao-paulo-goncalves-santos',
  project: process.env.SENTRY_PROJECT ?? 'farm-fin',
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
