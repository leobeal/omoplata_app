import { defineConfig } from '@playwright/test';
import * as path from 'path';
import * as os from 'os';

// Use Chrome with existing user profile (logged into Google)
const userDataDir = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');

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
    channel: 'chrome', // Use installed Chrome
    launchOptions: {
      args: [
        `--user-data-dir=${userDataDir}`,
        '--profile-directory=Default',
      ],
      slowMo: 300,
    },
  },
  projects: [
    {
      name: 'chrome',
      use: {
        channel: 'chrome',
      },
    },
  ],
});
