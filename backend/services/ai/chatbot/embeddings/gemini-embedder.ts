import { getAiConfig } from "../../config/ai.config.js";
import { isGeminiQuotaBlocked } from "../../models/gemini-quota.js";
import { acquireGeminiSlot, handleGeminiApiError } from "../../models/gemini-rate-manager.js";
import { recordGeminiApiCall } from "../../models/gemini-usage.js";

const EMBED_DIM = 768;

/** Deterministic fallback when Gemini embeddings unavailable. */
function hashEmbed(text: string): number[] {
  const vec = new Array<number>(EMBED_DIM).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  for (const tok of tokens) {
    let h = 0;
    for (let i = 0; i < tok.length; i++) h = (h * 31 + tok.charCodeAt(i)) >>> 0;
    const idx = h % EMBED_DIM;
    vec[idx]! += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const cfg = getAiConfig();
  const useHashOnly =
    process.env.AI_USE_GEMINI_EMBEDDINGS === "false" ||
    !cfg.apiKey ||
    texts.length === 0 ||
    isGeminiQuotaBlocked();

  if (useHashOnly) {
    if (texts.length > 0 && process.env.AI_LOG_GEMINI_CALLS === "true") {
      console.info(`[rag] Using local hash embeddings for ${texts.length} chunk(s) (no Gemini embed API)`);
    }
    return texts.map(hashEmbed);
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(cfg.apiKey);
    const model = genAI.getGenerativeModel({ model: cfg.embeddingModel });

    const out: number[][] = [];
    for (const t of texts) {
      const acquired = await acquireGeminiSlot("embed");
      if (!acquired) {
        out.push(hashEmbed(t));
        continue;
      }
      try {
        recordGeminiApiCall("embedContent");
        const r = await model.embedContent(t.slice(0, 8000));
        const values = r.embedding?.values;
        if (!values?.length) {
          out.push(hashEmbed(t));
          continue;
        }
        const norm = Math.sqrt(values.reduce((s, v) => s + v * v, 0)) || 1;
        out.push(values.map((v) => v / norm));
      } catch (err) {
        handleGeminiApiError(err);
        out.push(hashEmbed(t));
      }
    }
    return out;
  } catch (err) {
    handleGeminiApiError(err);
    console.warn("[chatbot] Gemini embed failed, using hash fallback:", (err as Error)?.message ?? err);
    return texts.map(hashEmbed);
  }
}

export async function embedSingle(text: string): Promise<number[]> {
  return (await embedTexts([text]))[0]!;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i]! * b[i]!;
  return dot;
}
