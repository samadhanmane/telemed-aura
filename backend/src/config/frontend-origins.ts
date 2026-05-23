/** Comma- or newline-separated frontend origins (CORS + Socket.IO). Set FRONTEND_URL on Render. */
export function parseFrontendOrigins(): string[] {
  const isProd = process.env.NODE_ENV === "production";
  const raw = process.env.FRONTEND_URL?.trim();
  if (isProd && !raw) {
    console.warn(
      "[cors] FRONTEND_URL is not set — set your Vercel URL(s) on Render, e.g. https://your-app.vercel.app",
    );
  }

  const fromEnv = (raw ?? (isProd ? "" : "http://localhost:5173"))
    .split(/[,\n]+/)
    .map((u) => u.trim())
    .filter(Boolean);

  const devExtras = !isProd ? parseDevLocalhostOrigins() : [];

  const merged = [...new Set([...fromEnv, ...devExtras])];
  return merged.length > 0 ? merged : isProd ? [] : ["http://localhost:5173"];
}

/** In dev, also allow common Vite ports unless FRONTEND_DEV_PORTS=off */
function parseDevLocalhostOrigins(): string[] {
  if (process.env.FRONTEND_DEV_PORTS === "off") return [];
  const ports = (process.env.FRONTEND_DEV_PORTS ?? "5173,8080,8081")
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const hosts = ["localhost", "127.0.0.1"];
  const origins: string[] = [];
  for (const host of hosts) {
    for (const port of ports) {
      origins.push(`http://${host}:${port}`);
    }
  }
  return origins;
}

/** Express CORS origin callback — allows any listed FRONTEND_URL origin. */
export function corsOriginCheck(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  const allowed = parseFrontendOrigins();
  if (!origin || allowed.includes(origin)) {
    callback(null, true);
    return;
  }
  console.warn(
    `[cors] Blocked origin: ${origin}. Allowed: ${allowed.join(", ")}`,
  );
  callback(null, false);
}
