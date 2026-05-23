import { truncateForPrompt } from "./prompt-utils.js";
import { getAiConfig } from "../config/ai.config.js";

export function buildPrescriptionVisionPrompt(ocrHint: string, filename?: string): string {
  const cfg = getAiConfig();
  const hint = ocrHint.trim()
    ? `Optional noisy OCR (do not trust over the image): ${truncateForPrompt(ocrHint, 800)}`
    : "No OCR — read directly from the prescription image.";

  return `You are a pharmacy assistant reading a doctor's prescription (often handwritten).

File: ${filename ?? "prescription"}
${hint}

Read the attached prescription image/PDF carefully. Handwriting is common — interpret medical abbreviations (OD, BD, TDS, SOS, HS, etc.).

Return ONLY valid JSON (no markdown):
{
  "medicines": [
    {"name": "medicine name", "dosage": "strength e.g. 500mg", "frequency": "e.g. twice daily", "duration": "e.g. 5 days"}
  ],
  "notes": "1 short sentence: patient instructions or doctor notes if visible",
  "fullText": "brief plain-text copy of what you read from the Rx"
}

Include every medicine you can identify. Use "—" for unknown dosage/frequency/duration fields.`;
}
