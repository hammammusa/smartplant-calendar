import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3200);
/** Tests run against the static export (`out/`) served like GitHub Pages (domain root by default). */
export const BASE_PATH = process.env.E2E_BASE_PATH ?? "";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "ar",
    timezoneId: "Asia/Hebron",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: `node scripts/serve-static.mjs ${PORT}`,
        url: `http://localhost:${PORT}${BASE_PATH}/`,
        reuseExistingServer: true,
        timeout: 60_000,
        env: { BASE_PATH },
      },
});
