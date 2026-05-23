/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_VIDEO_SERVICE_URL: string;
  readonly VITE_VIDEO_SIGNALING_PATH: string;
  readonly VITE_APP_URL: string;
  readonly VITE_VIDEO_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
