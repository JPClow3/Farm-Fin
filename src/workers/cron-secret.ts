import { getCloudflareContext } from '@opennextjs/cloudflare';

/** Secret shared by the scheduled handler and the internal job route. */
export function readCronSecret(): string | null {
  try {
    const { env } = getCloudflareContext();
    const fromBinding = (env as { BETTER_AUTH_SECRET?: string }).BETTER_AUTH_SECRET;
    if (fromBinding) return fromBinding;
  } catch {
    // `next dev`, production build, and unit tests have no Workers request context.
  }
  return process.env.BETTER_AUTH_SECRET || null;
}
