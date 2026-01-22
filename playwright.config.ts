import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  testMatch: '**/*.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 180000, // 3 minutes per test
  use: {
    headless: false,
    viewport: { width: 1400, height: 900 },
    actionTimeout: 60000,
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: 300,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {},
    },
  ],
});
