import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Backend package root (`telemed-aura/backend`) */
export function getBackendRoot(): string {
  return path.resolve(__dirname, "../..");
}

/** Load `backend/.env` only — shared by API + email / ai / video services */
export function loadEnv(): void {
  dotenv.config({ path: path.join(getBackendRoot(), ".env") });
}
