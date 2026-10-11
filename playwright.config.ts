import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';

const baseURL = process.env.FARMFIN_E2E_BASE_URL || 'http://localhost:3000';

const chromePath = [
  process.env.FARMFIN_E2E_CHROMIUM_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/*.spec.ts', '**/*.e2e.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    launchOptions: chromePath ? { executablePath: chromePath } : undefined,
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev',
    url: `${baseURL}/login`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      PORT: '3000',
      BETTER_AUTH_SECRET: 'farm-fin-e2e-only-secret-at-least-32-characters',
      BETTER_AUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
      NODE_ENV: 'development',
    },
  },
});
