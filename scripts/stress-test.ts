import autocannon, { Result } from 'autocannon';
import { spawn, execSync, ChildProcess } from 'child_process';
import http from 'http';

interface BenchmarkScenario {
  name: string;
  urlPath: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  connections: number;
  duration: number; // in seconds
}

const BASE_URL = process.env.FARMFIN_STRESS_BASE_URL || 'http://127.0.0.1:3000';

const SCENARIOS: BenchmarkScenario[] = [
  {
    name: '1. GET /login (HTML Delivery Throughput)',
    urlPath: '/login',
    method: 'GET',
    connections: 10,
    duration: 5,
  },
  {
    name: '2. POST /api/auth/sign-in/username (Auth Latency)',
    urlPath: '/api/auth/sign-in/username',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      username: 'paraiba',
      password: 'melhorprofessor',
    }),
    connections: 10,
    duration: 5,
  },
  {
    name: '3. GET /api/auth/get-session (Session Cache & Verification)',
    urlPath: '/api/auth/get-session',
    method: 'GET',
    connections: 10,
    duration: 5,
  },
  {
    name: '4. GET / (Dashboard SSR Page Delivery Under Load)',
    urlPath: '/',
    method: 'GET',
    connections: 10,
    duration: 5,
  },
  {
    name: '5. GET /contas-a-pagar (Contas a Pagar SSR Under Load)',
    urlPath: '/contas-a-pagar',
    method: 'GET',
    connections: 10,
    duration: 5,
  },
];

function killProcessTree(pid: number | undefined) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {}
}

async function isServerRunning(urlStr: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const req = http.request(
        {
          hostname: u.hostname,
          port: u.port || 3000,
          path: '/login',
          method: 'GET',
          timeout: 3000,
        },
        (res) => {
          res.resume();
          resolve(Boolean(res.statusCode && res.statusCode < 500));
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function waitForServer(urlStr: string, timeoutMs: number = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerRunning(urlStr)) {
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timeout waiting for server at ${urlStr} after ${timeoutMs}ms`);
}

async function warmupRoute(urlStr: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const req = http.request(
        {
          hostname: u.hostname,
          port: u.port || 3000,
          path: u.pathname,
          method: 'GET',
          timeout: 10000,
        },
        (res) => {
          res.resume();
          res.on('end', () => resolve());
        }
      );
      req.on('error', () => resolve());
      req.on('timeout', () => {
        req.destroy();
        resolve();
      });
      req.end();
    } catch {
      resolve();
    }
  });
}

function runBenchmark(opts: autocannon.Options): Promise<Result> {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function fmt(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0.0';
  return val.toFixed(1);
}

function formatTable(metrics: Array<{
  scenario: string;
  reqSec: number;
  avgLatency: number;
  p50: number;
  p95: number;
  p99: number;
  totalReqs: number;
  errors: number;
}>) {
  console.log('\n' + '='.repeat(105));
  console.log('FARM-FIN AUTOCANNON BENCHMARK REPORT');
  console.log('='.repeat(105));
  console.log(
    'Scenario'.padEnd(46) +
    'Req/s'.padStart(10) +
    'Avg(ms)'.padStart(10) +
    'p50(ms)'.padStart(10) +
    'p95(ms)'.padStart(10) +
    'p99(ms)'.padStart(10) +
    'Total'.padStart(9)
  );
  console.log('-'.repeat(105));

  for (const m of metrics) {
    console.log(
      m.scenario.padEnd(46).slice(0, 46) +
      fmt(m.reqSec).padStart(10) +
      fmt(m.avgLatency).padStart(10) +
      fmt(m.p50).padStart(10) +
      fmt(m.p95).padStart(10) +
      fmt(m.p99).padStart(10) +
      m.totalReqs.toString().padStart(9)
    );
  }
  console.log('='.repeat(105) + '\n');
}

async function main() {
  console.log(`[stress-test] Initializing benchmark suite against: ${BASE_URL}`);

  let devServerProcess: ChildProcess | null = null;
  const running = await isServerRunning(BASE_URL);

  if (!running) {
    console.log('[stress-test] Server not detected on port 3000. Launching Next.js dev server...');
    devServerProcess = spawn('npx', ['next', 'dev', '--port', '3000', '--hostname', '127.0.0.1'], {
      shell: process.platform === 'win32',
      stdio: 'ignore',
      env: {
        ...process.env,
        PORT: '3000',
        NODE_ENV: 'development',
        BETTER_AUTH_SECRET: 'farm-fin-e2e-only-secret-at-least-32-characters',
        BETTER_AUTH_URL: BASE_URL,
      },
    });

    console.log('[stress-test] Waiting for Next.js to start serving...');
    await waitForServer(BASE_URL, 60000);
    console.log('[stress-test] Next.js dev server ready.');
  } else {
    console.log('[stress-test] Connected to running instance.');
  }

  console.log('[stress-test] Warming up routes before benchmarking...');
  for (const scenario of SCENARIOS) {
    await warmupRoute(`${BASE_URL}${scenario.urlPath}`);
  }
  console.log('[stress-test] Warm-up complete. Starting benchmark runs...');

  const collectedMetrics = [];

  try {
    for (const scenario of SCENARIOS) {
      console.log(`\n[stress-test] Running: ${scenario.name} (connections: ${scenario.connections}, duration: ${scenario.duration}s)...`);
      const targetUrl = `${BASE_URL}${scenario.urlPath}`;

      const result = await runBenchmark({
        url: targetUrl,
        connections: scenario.connections,
        duration: scenario.duration,
        pipelining: 1,
        method: scenario.method || 'GET',
        headers: scenario.headers,
        body: scenario.body,
      });

      const latencyAny = result.latency as any;
      const p95Val = latencyAny.p95 ?? latencyAny.p97_5 ?? latencyAny.p90 ?? result.latency.p50 ?? 0;

      collectedMetrics.push({
        scenario: scenario.name,
        reqSec: result.requests.average,
        avgLatency: result.latency.average,
        p50: result.latency.p50,
        p95: p95Val,
        p99: result.latency.p99,
        totalReqs: result.requests.total,
        errors: result.errors,
      });

      console.log(
        `  -> Throughput: ${fmt(result.requests.average)} req/s | Latency (avg: ${fmt(result.latency.average)}ms, p50: ${fmt(result.latency.p50)}ms, p95: ${fmt(p95Val)}ms, p99: ${fmt(result.latency.p99)}ms)`
      );
    }

    formatTable(collectedMetrics);
    console.log('[stress-test] Benchmark suite completed successfully.');
  } finally {
    if (devServerProcess?.pid) {
      console.log('[stress-test] Shutting down spawned Next.js server...');
      killProcessTree(devServerProcess.pid);
    }
  }
}

main().catch((err) => {
  console.error('[stress-test] Fatal benchmark error:', err);
  process.exit(1);
});
