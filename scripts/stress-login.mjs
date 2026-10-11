import { performance } from 'node:perf_hooks';

const baseValue = process.env.FARMFIN_STRESS_BASE_URL;
if (!baseValue) {
  console.error('Set FARMFIN_STRESS_BASE_URL to a local or explicitly allow-listed staging URL.');
  process.exit(2);
}

let baseURL;
try {
  baseURL = new URL(baseValue);
} catch {
  console.error('FARMFIN_STRESS_BASE_URL must be a valid http(s) URL.');
  process.exit(2);
}

if (!['http:', 'https:'].includes(baseURL.protocol)) {
  console.error('FARMFIN_STRESS_BASE_URL must use http or https.');
  process.exit(2);
}
if (baseURL.username || baseURL.password) {
  console.error('Do not put credentials in FARMFIN_STRESS_BASE_URL.');
  process.exit(2);
}

const hostname = baseURL.hostname.toLowerCase();
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
const productionLikeHosts = [
  /^(www\.)?farm-fin\.com$/i,
  /^(www\.)?farmfin\.agro\.br$/i,
  /(^|\.)workers\.dev$/i,
  /(^|\.)pages\.dev$/i,
  /(^|\.)vercel\.app$/i,
];

if (productionLikeHosts.some((pattern) => pattern.test(hostname))) {
  console.error(
    'Production-like hosts are blocked. Use a local server or an allow-listed staging host.'
  );
  process.exit(2);
}

const isLocal = localHosts.has(hostname);
const stagingHost = (process.env.FARMFIN_STRESS_STAGING_HOST || '').trim().toLowerCase();
if (!isLocal && (!stagingHost || hostname !== stagingHost)) {
  console.error(
    'Remote stress targets require FARMFIN_STRESS_STAGING_HOST matching the exact non-production hostname.'
  );
  process.exit(2);
}

const scenario = (process.env.FARMFIN_STRESS_SCENARIO || 'auth').trim().toLowerCase();
if (!['auth', 'page'].includes(scenario)) {
  console.error('FARMFIN_STRESS_SCENARIO must be "auth" or "page".');
  process.exit(2);
}

const authMode = (process.env.FARMFIN_STRESS_AUTH_MODE || '').trim().toLowerCase();
if (scenario === 'auth' && !['email', 'username'].includes(authMode)) {
  console.error('Set FARMFIN_STRESS_AUTH_MODE to "email" or "username" for auth stress.');
  process.exit(2);
}

const identifier = (process.env.FARMFIN_STRESS_IDENTIFIER || '').trim().toLowerCase();
const password = process.env.FARMFIN_STRESS_PASSWORD;
if (scenario === 'auth') {
  if (!identifier || !password) {
    console.error('Auth stress requires FARMFIN_STRESS_IDENTIFIER and FARMFIN_STRESS_PASSWORD.');
    process.exit(2);
  }
  if (authMode === 'email' && !identifier.includes('@')) {
    console.error('FARMFIN_STRESS_IDENTIFIER must be an e-mail when auth mode is "email".');
    process.exit(2);
  }
  if (authMode === 'username' && identifier.includes('@')) {
    console.error('FARMFIN_STRESS_IDENTIFIER must be a username when auth mode is "username".');
    process.exit(2);
  }
}

const total = Number(process.env.FARMFIN_STRESS_REQUESTS || 250);
const concurrency = Number(process.env.FARMFIN_STRESS_CONCURRENCY || 20);
const timeoutMs = Number(process.env.FARMFIN_STRESS_TIMEOUT_MS || 15_000);
const maxP95Ms = Number(process.env.FARMFIN_STRESS_MAX_P95_MS || 2_000);
const maxFailureRate = Number(process.env.FARMFIN_STRESS_MAX_FAILURE_RATE || 0);
const expectedStatuses = new Set(
  (process.env.FARMFIN_STRESS_EXPECTED_STATUSES || '200')
    .split(',')
    .map((status) => Number(status.trim()))
    .filter((status) => Number.isInteger(status) && status >= 100 && status <= 599)
);

if (
  !Number.isInteger(total) ||
  total < 1 ||
  total > 5000 ||
  !Number.isInteger(concurrency) ||
  concurrency < 1 ||
  concurrency > 100
) {
  console.error('Use 1-5000 requests and concurrency between 1 and 100.');
  process.exit(2);
}
if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 60_000) {
  console.error('FARMFIN_STRESS_TIMEOUT_MS must be between 1000 and 60000.');
  process.exit(2);
}
if (!Number.isFinite(maxP95Ms) || maxP95Ms < 1) {
  console.error('FARMFIN_STRESS_MAX_P95_MS must be a positive number.');
  process.exit(2);
}
if (!Number.isFinite(maxFailureRate) || maxFailureRate < 0 || maxFailureRate > 1) {
  console.error('FARMFIN_STRESS_MAX_FAILURE_RATE must be between 0 and 1.');
  process.exit(2);
}
if (expectedStatuses.size === 0) {
  console.error('FARMFIN_STRESS_EXPECTED_STATUSES must contain at least one HTTP status.');
  process.exit(2);
}

function appendPath(pathname) {
  const result = new URL(baseURL.href);
  const prefix = result.pathname.replace(/\/+$/, '');
  result.pathname = `${prefix}/${pathname}`;
  result.search = '';
  result.hash = '';
  return result;
}

const target =
  scenario === 'auth' ? appendPath(`api/auth/sign-in/${authMode}`) : appendPath('login');

const requestInit =
  scenario === 'auth'
    ? {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          authMode === 'email'
            ? { email: identifier, password }
            : { username: identifier, password }
        ),
        redirect: 'manual',
      }
    : { redirect: 'manual' };

const durations = [];
const statuses = new Map();
let nextRequest = 0;
let failures = 0;

async function worker() {
  while (true) {
    const index = nextRequest++;
    if (index >= total) return;

    const started = performance.now();
    try {
      const response = await fetch(target, {
        ...requestInit,
        signal: AbortSignal.timeout(timeoutMs),
      });
      durations.push(performance.now() - started);
      statuses.set(response.status, (statuses.get(response.status) || 0) + 1);
      await response.body?.cancel();
    } catch {
      failures++;
    }
  }
}

const started = performance.now();
await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker));
const elapsed = performance.now() - started;
durations.sort((a, b) => a - b);

const percentile = (p) => {
  if (!durations.length) return null;
  const index = Math.min(durations.length - 1, Math.max(0, Math.ceil(durations.length * p) - 1));
  return durations[index];
};

const unexpectedResponses = [...statuses.entries()]
  .filter(([status]) => !expectedStatuses.has(status))
  .reduce((count, [, amount]) => count + amount, 0);
const failedRequests = failures + unexpectedResponses;
const failureRate = failedRequests / total;
const p95 = percentile(0.95);
const thresholdViolations = [];

if (failures > 0) thresholdViolations.push(`${failures} requests failed or timed out`);
if (unexpectedResponses > 0) {
  thresholdViolations.push(`${unexpectedResponses} responses had unexpected HTTP statuses`);
}
if (p95 !== null && p95 > maxP95Ms) {
  thresholdViolations.push(`p95 latency ${Math.round(p95)}ms exceeded ${maxP95Ms}ms`);
}
if (failureRate > maxFailureRate) {
  thresholdViolations.push(
    `failure rate ${(failureRate * 100).toFixed(2)}% exceeded ${(maxFailureRate * 100).toFixed(2)}%`
  );
}

console.log(
  JSON.stringify(
    {
      target: `${target.origin}${target.pathname}`,
      scenario,
      authMode: scenario === 'auth' ? authMode : undefined,
      requests: total,
      concurrency,
      durationMs: Math.round(elapsed),
      requestsPerSecond: Number((total / (elapsed / 1000)).toFixed(1)),
      latencyMs: durations.length
        ? {
            p50: Math.round(percentile(0.5)),
            p95: Math.round(p95),
            max: Math.round(durations.at(-1)),
          }
        : null,
      statuses: Object.fromEntries(statuses),
      failures,
      failureRate: Number(failureRate.toFixed(4)),
      thresholds: {
        expectedStatuses: [...expectedStatuses],
        maxP95Ms,
        maxFailureRate,
      },
      thresholdViolations,
    },
    null,
    2
  )
);

if (thresholdViolations.length > 0) process.exitCode = 1;
