import { version } from '../../package.json';

const commit = process.env.NEXT_PUBLIC_BUILD_SHA ?? '';
export const buildInfo = {
  version: process.env.NEXT_PUBLIC_APP_VERSION || version,
  commit: /^[a-f0-9]{40,64}$/i.test(commit) ? commit.toLowerCase() : '',
  dirty: process.env.NEXT_PUBLIC_BUILD_DIRTY === 'true',
};
