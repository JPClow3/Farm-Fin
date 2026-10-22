import { describe, expect, it } from 'vitest';
import { resolveBuildInfo } from '../../../scripts/build-info.mjs';

const sha = 'a'.repeat(40);
describe('build revision', () => {
  it('uses the Cloudflare revision before other environments or the local checkout', () => {
    expect(
      resolveBuildInfo({ WORKERS_CI_COMMIT_SHA: sha, GITHUB_SHA: 'b'.repeat(40) }, () => {
        throw new Error('git is unavailable');
      })
    ).toEqual({ commit: sha, dirty: false });
  });
  it('marks a modified local checkout without claiming a clean GitHub build', () => {
    expect(
      resolveBuildInfo({}, (args) => (args[0] === 'rev-parse' ? sha : ' M package.json'))
    ).toEqual({ commit: sha, dirty: true });
  });
  it('handles invalid environment data and missing Git metadata', () => {
    expect(
      resolveBuildInfo({ WORKERS_CI_COMMIT_SHA: 'invalid' }, () => {
        throw new Error('no git');
      })
    ).toEqual({ commit: '', dirty: false });
  });
});
