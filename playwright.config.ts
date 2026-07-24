import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_APP_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${port}`;
const supabasePort = Number(process.env.PLAYWRIGHT_SUPABASE_PORT ?? 54329);
const supabaseURL =
  process.env.PLAYWRIGHT_SUPABASE_URL ?? `http://127.0.0.1:${supabasePort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never" }]
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: [
    {
      command: "node e2e/support/mock-supabase-server.cjs",
      url: supabaseURL,
      reuseExistingServer: Boolean(process.env.PLAYWRIGHT_REUSE_SERVER),
      env: {
        PORT: String(supabasePort)
      }
    },
    {
      command: "node e2e/support/start-next-dev.cjs",
      url: baseURL,
      reuseExistingServer: false,
      env: {
        PORT: String(port),
        NODE_ENV: "development",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SUPABASE_URL: supabaseURL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
        RESEND_API_KEY: "",
        RESEND_FROM_EMAIL: ""
      }
    }
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] }
    }
  ]
});
