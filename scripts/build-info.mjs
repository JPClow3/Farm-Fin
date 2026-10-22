import { execFileSync } from 'node:child_process';

/** Resolve the deployed revision from the build provider, or the local checkout. */
export function resolveBuildInfo(
  env = process.env,
  git = (args) =>
    execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
) {
  const providerCommit = [env.WORKERS_CI_COMMIT_SHA, env.GITHUB_SHA, env.CF_PAGES_COMMIT_SHA].find(
    (value) => /^[a-f0-9]{40,64}$/i.test(value ?? '')
  );
  if (providerCommit) return { commit: providerCommit.toLowerCase(), dirty: false };
  try {
    const commit = git(['rev-parse', 'HEAD']);
    if (!/^[a-f0-9]{40,64}$/i.test(commit)) return { commit: '', dirty: false };
    return {
      commit: commit.toLowerCase(),
      dirty: git(['status', '--porcelain', '--untracked-files=normal']).length > 0,
    };
  } catch {
    return { commit: '', dirty: false };
  }
}
