/// <reference types="vite/client" />

type DataSource = "mock" | "api";
type AppEnv = "development" | "staging" | "production";

function readString(value: string | undefined, fallback = ""): string {
  return value?.trim() || fallback;
}

function readBoolean(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

function readDataSource(value: string | undefined): DataSource {
  return value === "api" ? "api" : "mock";
}

function readAppEnv(value: string | undefined): AppEnv {
  if (value === "staging" || value === "production") return value;
  return "development";
}

export const appConfig = {
  appName: readString(import.meta.env.VITE_APP_NAME, "Turnity"),
  appEnv: readAppEnv(import.meta.env.VITE_APP_ENV),
  dataSource: readDataSource(import.meta.env.VITE_DATA_SOURCE),
  apiBaseUrl: readString(import.meta.env.VITE_API_BASE_URL),
  cdnBaseUrl: readString(import.meta.env.VITE_CDN_BASE_URL),
  enableAnalytics: readBoolean(import.meta.env.VITE_ENABLE_ANALYTICS, true),
  enableDarkMode: readBoolean(import.meta.env.VITE_ENABLE_DARK_MODE, false),
};

export function assertApiConfigured(): void {
  if (!appConfig.apiBaseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is required when VITE_DATA_SOURCE=api."
    );
  }
}
