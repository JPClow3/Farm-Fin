# Cloudflare CI/CD

The existing farm-fin Workers Builds trigger owns main releases. It runs lint, unit tests, Next type generation and TypeScript checks. `npx wrangler deploy --keep-vars --autoconfig=false` then uses the checked-in custom Worker configuration, runs its configured OpenNext build once and deploys. Disabling framework autodetection prevents Wrangler from invoking OpenNext's deploy command before the artifact exists. GitHub CI remains available for pull requests and explicit manual runs. An unsupported Next.js version still blocks the release; this migration does not bypass the OpenNext version check.

Configured on 2026-10-22. Cloudflare settings live outside Git. Rollback: restore the prior build settings and re-enable push triggers in the retained GitHub workflow. Never run both automatic deployment owners at the same time.
