/**
 * Typed frontend env (from frontend/.env).
 * All keys must be prefixed with VITE_
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1",
  videoServiceUrl: import.meta.env.VITE_VIDEO_SERVICE_URL ?? "http://localhost:4003",
  videoSignalingPath: import.meta.env.VITE_VIDEO_SIGNALING_PATH ?? "/signaling",
  appUrl: import.meta.env.VITE_APP_URL ?? "http://localhost:5173",
  videoDebug: import.meta.env.VITE_VIDEO_DEBUG === "true",
} as const;
