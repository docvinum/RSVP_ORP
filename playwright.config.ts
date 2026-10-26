import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4173);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' },
  },
  snapshotPathTemplate: '{testDir}/visual/__screenshots__/{arg}-{projectName}{ext}',
  projects: [
    {
      name: 'desktop',
      testMatch: /reader\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } },
    },
    {
      name: 'mobile',
      testMatch: /reader\/.*\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'integration',
      testMatch: /integration\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } },
    },
    {
      name: 'visual',
      testMatch: /visual\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } },
    },
  ],
  webServer: {
    command: `node scripts/serve.mjs`,
    url: `http://localhost:${PORT}/dist/manifest.json`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
});
