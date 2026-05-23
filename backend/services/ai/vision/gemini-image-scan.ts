import type { GeminiVisionFindings } from "../core/types.js";
import { getAiConfig } from "../config/ai.config.js";
import { generateGeminiContent, generateGeminiJson } from "../models/gemini.client.js";
import { isGeminiQuotaBlocked } from "../models/gemini-quota.js";
import { truncateForPrompt } from "../prompts/prompt-utils.js";

export type ImageScanResult = {
  text: string;
  visionFindings: GeminiVisionFindings;
  method: "gemini_vision";
};

type VisionJson = {
  documentType?: string;
  imagingSummary?: string;
  visibleFindings?: string[];
  clinicalFlags?: string[];
  suggestedFollowUp?: string[];
};

/** Prefer the user's AI_MODEL (often flash-lite) — flash may 429 on free tier keys. */
const VISION_MODEL_FALLBACKS = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
] as const;

function buildImageScanPrompt(input: {
  category: string;
  filename: string;
  ocrSnippet: string;
}): string {
  const cfg = getAiConfig();
  return `You are a medical image reader for telehealth. Study the attached image carefully.

File: ${input.filename}
Category: ${input.category}
OCR labels (may be wrong — trust the image): ${truncateForPrompt(input.ocrSnippet, cfg.maxVisionOcrPreview)}

Describe what is actually visible (X-ray, lab slip, skin, prescription, ECG, etc.).
If chest X-ray: comment on lung fields, heart size, visible tubes/lines, bones. If it looks within normal limits, say that clearly.
If you cannot tell, say what limits the read.

Return ONLY valid JSON (no markdown fences):
{"documentType":"xray|lab_report|prescription|ecg|ct_scan|skin|other","imagingSummary":"2-4 plain-language sentences for the patient","visibleFindings":["up to 5 short objective observations"],"clinicalFlags":["up to 3 concern phrases, or empty if none"],"suggestedFollowUp":["up to 2 next steps"]}`;
}

function visionJsonToFindings(json: VisionJson): GeminiVisionFindings | null {
  const summary = String(json.imagingSummary ?? "").trim();
  const findings = (json.visibleFindings ?? []).map(String).filter((s) => s.length > 2);
  if (!summary && findings.length === 0) return null;

  const docType = String(json.documentType ?? "other").toLowerCase();
  return {
    documentType: docType,
    imagingSummary: summary.slice(0, 500),
    visibleFindings: findings.slice(0, 6),
    clinicalFlags: (json.clinicalFlags ?? []).map(String).slice(0, 5),
    suggestedFollowUp: (json.suggestedFollowUp ?? []).map(String).slice(0, 3),
  };
}

function visionFindingsToText(vf: GeminiVisionFindings): string {
  return [
    vf.imagingSummary,
    ...(vf.visibleFindings ?? []).map((f) => `• ${f}`),
    ...(vf.clinicalFlags ?? []).map((f) => `Flag: ${f}`),
    ...(vf.suggestedFollowUp ?? []).map((f) => `Follow-up: ${f}`),
  ]
    .filter(Boolean)
    .join("\n");
}

function plainTextToFindings(text: string): GeminiVisionFindings {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 8);
  return {
    documentType: "other",
    imagingSummary: text.slice(0, 500),
    visibleFindings: lines.slice(0, 5),
    clinicalFlags: [],
  };
}

/**
 * Mandatory Gemini vision read for every uploaded medical image.
 * Tries JSON, then plain-text fallback; tries multiple vision-capable models.
 */
export async function scanMedicalImageWithGemini(
  buffer: Buffer,
  mimeType: string,
  opts: { category: string; filename: string; ocrSnippet: string },
): Promise<ImageScanResult | null> {
  if (process.env.AI_DISABLE_GEMINI === "true") return null;
  if (!getAiConfig().apiKey) return null;
  if (isGeminiQuotaBlocked()) {
    console.warn("[vision] Gemini quota blocked — image scan skipped");
    return null;
  }

  const prompt = buildImageScanPrompt(opts);
  const imagePart = {
    inlineData: {
      mimeType: mimeType.startsWith("image/") ? mimeType : "image/jpeg",
      data: buffer.toString("base64"),
    },
  };

  const cfg = getAiConfig();
  const models = [
    process.env.AI_MODEL,
    process.env.AI_VISION_MODEL,
    cfg.visionModel,
    ...VISION_MODEL_FALLBACKS,
  ].filter(Boolean) as string[];
  const uniqueModels = [...new Set(models)];

  const tryModels = uniqueModels.slice(0, 4);

  for (const modelId of tryModels) {
    if (isGeminiQuotaBlocked()) break;

    const json = await generateGeminiJson<VisionJson>(
      [{ text: prompt }, imagePart],
      {
        modelId,
        maxOutputTokens: Math.max(cfg.maxOutputTokensVision, 640),
        slotKind: "vision",
        waitForSlot: true,
      },
    );

    if (json) {
      const vf = visionJsonToFindings(json);
      if (vf) {
        console.info(`[vision] Image scan OK (${modelId}): ${opts.filename}`);
        return {
          text: visionFindingsToText(vf),
          visionFindings: vf,
          method: "gemini_vision",
        };
      }
    }
  }

  for (const modelId of tryModels) {
    if (isGeminiQuotaBlocked()) break;

    const prose = await generateGeminiContent(
      [
        {
          text: `${prompt}\n\nReply with 4-6 plain sentences describing what you see in this medical image.`,
        },
        imagePart,
      ],
      {
        modelId,
        maxOutputTokens: 700,
        slotKind: "vision",
        waitForSlot: true,
      },
    );

    if (prose && prose.trim().length > 30) {
      const vf = plainTextToFindings(prose.trim());
      console.info(`[vision] Image scan OK (prose, ${modelId}): ${opts.filename}`);
      return {
        text: prose.trim(),
        visionFindings: vf,
        method: "gemini_vision",
      };
    }
  }

  console.warn(`[vision] Image scan failed for ${opts.filename} — no model returned usable text`);
  return null;
}
