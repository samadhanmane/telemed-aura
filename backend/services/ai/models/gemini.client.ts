import { getAiConfig } from "../config/ai.config.js";
import {
  isGeminiQuotaBlocked,
  isGeminiModelNotFoundError,
  isGeminiQuotaError,
} from "./gemini-quota.js";
import {
  acquireGeminiSlot,
  releaseGeminiSlot,
  handleGeminiApiError,
  type GeminiSlotKind,
} from "./gemini-rate-manager.js";
import { recordGeminiApiCall } from "./gemini-usage.js";

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

const FALLBACK_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
] as const;

function resolveModelCandidates(preferred?: string): string[] {
  const cfg = getAiConfig();
  const primary = preferred ?? cfg.model;
  return [...new Set([primary, ...FALLBACK_MODELS])];
}

export async function getGeminiModel(modelId?: string, maxOutputTokens?: number) {
  const cfg = getAiConfig();
  if (!cfg.apiKey) return null;

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(cfg.apiKey);
  return genAI.getGenerativeModel({
    model: modelId ?? cfg.model,
    generationConfig: {
      temperature: 0.15,
      topP: 0.9,
      maxOutputTokens: maxOutputTokens ?? cfg.maxOutputTokensSynthesis,
    },
  });
}

export function parseJsonFromGeminiText(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const jsonBlock = trimmed.match(/```json\s*([\s\S]*?)```/) ?? trimmed.match(/```\s*([\s\S]*?)```/);
  const raw = jsonBlock ? jsonBlock[1]!.trim() : trimmed;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function generateGeminiContent(
  parts: GeminiPart[],
  opts?: {
    modelId?: string;
    maxOutputTokens?: number;
    slotKind?: GeminiSlotKind;
    waitForSlot?: boolean;
  },
): Promise<string | null> {
  const kind = opts?.slotKind ?? "generate";
  const acquired = await acquireGeminiSlot(kind, { wait: opts?.waitForSlot ?? false });
  if (!acquired) return null;

  const cfg = getAiConfig();
  const candidates = resolveModelCandidates(opts?.modelId);
  let lastError: unknown;

  try {
    for (const modelId of candidates) {
      const model = await getGeminiModel(modelId, opts?.maxOutputTokens);
      if (!model) {
        releaseGeminiSlot(kind);
        return null;
      }

      try {
        recordGeminiApiCall(`${kind}:${modelId}`);
        const result = await model.generateContent(parts);
        return result.response.text() ?? null;
      } catch (err) {
        lastError = err;
        if (isGeminiModelNotFoundError(err)) {
          console.warn(`[ai] Model ${modelId} not found, trying next…`);
          continue;
        }
        if (isGeminiQuotaError(err)) {
          console.warn(
            `[ai] ${modelId} rate limit — trying next model:`,
            (err as Error)?.message?.slice(0, 120) ?? err,
          );
          continue;
        }
        console.warn("[ai] Gemini generate failed:", (err as Error)?.message ?? err);
        return null;
      }
    }

    if (lastError) handleGeminiApiError(lastError);
    console.warn("[ai] No Gemini model available:", (lastError as Error)?.message ?? lastError);
    return null;
  } catch (err) {
    handleGeminiApiError(err);
    return null;
  }
}

export async function generateGeminiJson<T extends Record<string, unknown>>(
  parts: GeminiPart[],
  opts?: {
    modelId?: string;
    maxOutputTokens?: number;
    slotKind?: GeminiSlotKind;
    waitForSlot?: boolean;
  },
): Promise<T | null> {
  const text = await generateGeminiContent(parts, opts);
  if (!text) return null;
  const json = parseJsonFromGeminiText(text);
  return json as T | null;
}
