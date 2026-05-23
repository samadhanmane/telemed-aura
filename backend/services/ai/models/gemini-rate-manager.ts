import { getAiConfig } from "../config/ai.config.js";
import {
  isGeminiQuotaBlocked,
  isGeminiQuotaError,
  markGeminiQuotaExceeded,
  parseRetrySecondsFromError,
} from "./gemini-quota.js";

export type GeminiSlotKind = "generate" | "embed" | "vision" | "chat";

type SlotOpts = {
  /** If false, return immediately when budget/RPM full (no wait). */
  wait?: boolean;
  /** Bypass per-upload/chat budget (still respects RPM + global disable). */
  ignoreBudget?: boolean;
};

let queueTail: Promise<void> = Promise.resolve();
const callTimestamps: number[] = [];

let uploadBudget = 0;
let chatBudget = 0;

function rpmLimit(): number {
  return Math.max(1, Number(process.env.AI_GEMINI_RPM ?? 5));
}

function minDelayMs(): number {
  return Math.max(500, Number(process.env.AI_GEMINI_MIN_DELAY_MS ?? 1500));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function pruneTimestamps(): void {
  const cutoff = Date.now() - 60_000;
  while (callTimestamps.length && callTimestamps[0]! < cutoff) {
    callTimestamps.shift();
  }
}

function geminiGloballyDisabled(): boolean {
  return process.env.AI_DISABLE_GEMINI === "true" || !getAiConfig().apiKey;
}

/** Call at start of upload — budget > 0 only for reports (Gemini page vision). */
export function beginUploadGeminiBudget(forReport = false): void {
  uploadBudget = forReport
    ? Math.max(2, Number(process.env.AI_GEMINI_CALLS_PER_UPLOAD ?? 5))
    : 0;
}

/** One Gemini generate call budget per chat question. */
export function beginChatGeminiBudget(): void {
  chatBudget = Math.max(1, Number(process.env.AI_GEMINI_CALLS_PER_CHAT ?? 1));
}

export function getRemainingUploadBudget(): number {
  return uploadBudget;
}

/**
 * Reserve a slot before calling Gemini. All generate/embed/vision calls should use this.
 * Requests are queued globally with spacing to avoid RPM bursts.
 */
export async function acquireGeminiSlot(kind: GeminiSlotKind, opts?: SlotOpts): Promise<boolean> {
  if (geminiGloballyDisabled() || isGeminiQuotaBlocked()) {
    return false;
  }

  const wait = opts?.wait ?? false;
  const ignoreBudget = opts?.ignoreBudget ?? false;

  return new Promise((resolve) => {
    queueTail = queueTail.then(async () => {
      try {
        if (geminiGloballyDisabled() || isGeminiQuotaBlocked()) {
          resolve(false);
          return;
        }

        if (!ignoreBudget) {
          if (kind === "chat" && chatBudget <= 0) {
            resolve(false);
            return;
          }
          if ((kind === "generate" || kind === "vision" || kind === "embed") && uploadBudget <= 0) {
            resolve(false);
            return;
          }
        }

        pruneTimestamps();

        while (callTimestamps.length >= rpmLimit()) {
          if (!wait) {
            resolve(false);
            return;
          }
          const oldest = callTimestamps[0]!;
          const waitMs = Math.min(30_000, 60_000 - (Date.now() - oldest) + 200);
          await sleep(waitMs);
          pruneTimestamps();
        }

        if (callTimestamps.length > 0) {
          await sleep(minDelayMs());
        }

        if (!ignoreBudget) {
          if (kind === "chat") chatBudget -= 1;
          else if (kind === "generate" || kind === "vision" || kind === "embed") uploadBudget -= 1;
        }

        callTimestamps.push(Date.now());
        resolve(true);
      } catch {
        resolve(false);
      }
    });
  });
}

/** If API call failed before sending, release reserved budget. */
export function releaseGeminiSlot(kind: GeminiSlotKind): void {
  if (kind === "chat") chatBudget += 1;
  else uploadBudget += 1;
  if (callTimestamps.length) callTimestamps.pop();
}

export function handleGeminiApiError(err: unknown): void {
  if (isGeminiQuotaError(err)) {
    const retrySec = parseRetrySecondsFromError(err) ?? 120;
    markGeminiQuotaExceeded(Math.max(retrySec, 120));
  }
}

export function isUploadSynthesisEnabled(): boolean {
  return process.env.AI_ENABLE_UPLOAD_SYNTHESIS === "true";
}

export function isRagRewriteEnabled(): boolean {
  return process.env.AI_RAG_REWRITE === "true";
}

export function isRagAuditEnabled(): boolean {
  return process.env.AI_RAG_AUDIT === "true";
}

export function isRagCompletenessEnabled(): boolean {
  return process.env.AI_RAG_COMPLETENESS === "true";
}
