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

const apiUrl = readEnv("VITE_API_URL");
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
