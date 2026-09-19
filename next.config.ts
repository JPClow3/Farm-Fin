import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? "joao-paulo-goncalves-santos",
  project: process.env.SENTRY_PROJECT ?? "farm-fin",
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
