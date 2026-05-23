/** Cooldown after Gemini 429 — blocks further calls until window ends. */

let blockedUntilMs = 0;



export function isGeminiQuotaBlocked(): boolean {

  return Date.now() < blockedUntilMs;

}



/** Clear rate-limit cooldown (e.g. after fixing API quota). */

export function clearGeminiQuotaCooldown(): void {

  blockedUntilMs = 0;

}



export function markGeminiQuotaExceeded(retrySeconds = 120): void {

  blockedUntilMs = Date.now() + retrySeconds * 1000;

  console.warn(

    `[ai] Gemini rate limit — pausing API calls for ~${retrySeconds}s (OCR/rules still work).`,

  );

}



export function isGeminiQuotaError(err: unknown): boolean {

  if (!err || typeof err !== "object") return false;

  const e = err as { status?: number; message?: string };

  if (e.status === 429) return true;

  const msg = String(e.message ?? err);

  return msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests");

}



export function isGeminiModelNotFoundError(err: unknown): boolean {

  if (!err || typeof err !== "object") return false;

  const e = err as { status?: number; message?: string };

  if (e.status === 404) return true;

  const msg = String(e.message ?? err);

  return msg.includes("404") || msg.includes("not found") || msg.includes("is not supported");

}



export function parseRetrySecondsFromError(err: unknown): number | undefined {

  const msg = String((err as { message?: string })?.message ?? err);

  const m = msg.match(/retry in (\d+(?:\.\d+)?)\s*s/i);

  if (m) return Math.ceil(parseFloat(m[1]!) + 10);

  return undefined;

}


