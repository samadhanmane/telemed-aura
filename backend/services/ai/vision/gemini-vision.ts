import type { GeminiVisionFindings } from "../core/types.js";
import { getAiConfig } from "../config/ai.config.js";
import { buildVisionPrompt } from "../prompts/document.prompts.js";
import { generateGeminiJson } from "../models/gemini.client.js";

export async function analyzeMedicalImageWithGemini(input: {
  imageBuffer: Buffer;
  mimeType: string;
  category: string;
  reportName: string;
  extractedTextPreview: string;
}): Promise<GeminiVisionFindings | null> {
  const cfg = getAiConfig();
  if (!cfg.apiKey) return null;

  const prompt = buildVisionPrompt({
    category: input.category,
    reportName: input.reportName,
    ocrPreview: input.extractedTextPreview,
  });

  const json = await generateGeminiJson<{
    documentType?: string;
    imagingSummary?: string;
    visibleFindings?: string[];
    clinicalFlags?: string[];
    suggestedFollowUp?: string[];
  }>(
    [
      { text: prompt },
      { inlineData: { mimeType: input.mimeType, data: input.imageBuffer.toString("base64") } },
    ],
    { modelId: cfg.visionModel, maxOutputTokens: cfg.maxOutputTokensVision },
  );

  if (!json) return null;

  return {
    documentType: json.documentType ? String(json.documentType) : undefined,
    imagingSummary: json.imagingSummary ? String(json.imagingSummary) : undefined,
    visibleFindings: Array.isArray(json.visibleFindings)
      ? json.visibleFindings.map(String).slice(0, 5)
      : [],
    clinicalFlags: Array.isArray(json.clinicalFlags)
      ? json.clinicalFlags.map(String).slice(0, 4)
      : [],
    suggestedFollowUp: Array.isArray(json.suggestedFollowUp)
      ? json.suggestedFollowUp.map(String).slice(0, 4)
      : [],
  };
}

export { shouldRunGeminiVision } from "../pipeline/cost-guard.js";
