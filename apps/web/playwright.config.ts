import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // Software-rendered WebGL plus the live audio engine can starve the main
  // thread for seconds at a time; a 30s ceiling turns that into flakes.
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  // Each test runs a live WebGL scene on a software rasterizer plus a Web
  // Audio engine; four parallel workers starve input handling on an 8-core
  // machine (observed as multi-second click latency). Two workers keep the
  // suite deterministic without weakening any assertion.
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    launchOptions: {
      args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
