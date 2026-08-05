import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const useLocalServers = !process.env.PLAYWRIGHT_BASE_URL;
const python = process.env.E2E_PYTHON ?? "../.venv/bin/python";
const databaseUrl = process.env.E2E_DATABASE_URL ?? "";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: useLocalServers
    ? [
        {
          command: `cd ../nzeroesg-api && APP_ENV=development DATABASE_URL=${databaseUrl} CORS_ORIGINS=http://127.0.0.1:3000 ${python} -m uvicorn main:app --host 127.0.0.1 --port 8000`,
          url: "http://127.0.0.1:8000/health",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command:
            "NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000 npm run dev -- --hostname 127.0.0.1 --port 3000",
          url: "http://127.0.0.1:3000/login",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ]
    : undefined,
});
