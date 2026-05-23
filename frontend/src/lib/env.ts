/**
 * Frontend config — values come only from .env / Vercel (VITE_*).
 * Set defaults in frontend/.env (see frontend/.env.example).
 */

function readEnv(name: keyof ImportMetaEnv): string {
  return (import.meta.env[name] ?? "").trim();
}

function originFromApiUrl(apiUrl: string): string {
  if (!apiUrl) return "";
  try {
    return new URL(apiUrl).origin;
  } catch {
    console.warn(`[env] VITE_API_URL is not a valid URL: ${apiUrl}`);
    return "";
  }
}

const apiUrlFromEnv = readEnv("VITE_API_URL");
/** Dev fallback when frontend/.env is missing (avoids requests to :8080 instead of the API). */
const apiUrl =
  apiUrlFromEnv || (import.meta.env.DEV ? "http://localhost:4000/api/v1" : "");

if (import.meta.env.DEV && !apiUrlFromEnv) {
  console.warn(
    "[env] VITE_API_URL is not set — using http://localhost:4000/api/v1. Copy frontend/.env.example to frontend/.env.",
  );
}
const videoServiceUrlFromEnv = readEnv("VITE_VIDEO_SERVICE_URL");
const videoServiceUrl = videoServiceUrlFromEnv || originFromApiUrl(apiUrl);
const videoSignalingPath = readEnv("VITE_VIDEO_SIGNALING_PATH");
const appUrlFromEnv = readEnv("VITE_APP_URL");
const videoDebug = readEnv("VITE_VIDEO_DEBUG") === "true";

if (import.meta.env.PROD) {
  if (!apiUrl) {
    console.error("[env] VITE_API_URL is required — set it in Vercel / frontend/.env");
  }
  if (!videoServiceUrl) {
    console.error(
      "[env] VITE_VIDEO_SERVICE_URL or a valid VITE_API_URL is required for video signaling",
    );
  }
}

/** Browser uses the current tab; SSR/build uses VITE_APP_URL from .env. */
function resolveAppUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return appUrlFromEnv;
}

export const env = {
  apiUrl,
  videoServiceUrl,
  videoSignalingPath,
  get appUrl() {
    return resolveAppUrl();
  },
  videoDebug,
  isDev: import.meta.env.DEV,
} as const;
