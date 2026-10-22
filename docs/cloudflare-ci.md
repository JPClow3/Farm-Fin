# Cloudflare CI/CD

The existing farm-fin Workers Builds trigger owns main releases. It runs lint, unit tests, Next type generation and TypeScript checks. Wrangler then runs its configured OpenNext build once and deploys. GitHub CI remains available for pull requests and explicit manual runs. An unsupported Next.js version still blocks the release; this migration does not bypass the OpenNext version check.

Configured on 2026-10-22. Cloudflare settings live outside Git. Rollback: restore the prior build settings and re-enable push triggers in the retained GitHub workflow. Never run both automatic deployment owners at the same time.
