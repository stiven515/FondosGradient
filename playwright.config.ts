import { defineConfig } from '@playwright/test'

// Locally: PW_CHANNEL=chrome npx playwright test   (uses the installed Chrome, no download)
// CI installs Chromium and leaves PW_CHANNEL unset.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    channel: process.env.PW_CHANNEL || undefined,
    viewport: { width: 1280, height: 720 },
    acceptDownloads: true,
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
    },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
