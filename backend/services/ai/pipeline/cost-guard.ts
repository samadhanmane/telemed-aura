import type { SeverityLevel } from "../core/types.js";
import { getAiConfig } from "../config/ai.config.js";
import { isGeminiQuotaBlocked } from "../models/gemini-quota.js";
import { isUploadSynthesisEnabled } from "../models/gemini-rate-manager.js";

function geminiCallsAllowed(): boolean {
  if (process.env.AI_DISABLE_GEMINI === "true") return false;
  if (!getAiConfig().apiKey) return false;
  if (isGeminiQuotaBlocked()) return false;
  return true;
}

/**
 * Vision is expensive (image tokens). Only when OCR is weak or true imaging study.
 * A 10-page lab PDF with good text does NOT need vision.
 */
export function shouldRunGeminiVision(
  mimeType: string,
  category: string,
  extractedTextLength: number,
  opts?: { isImagingStudy?: boolean; scanSuccessPercent?: number },
): boolean {
  if (!geminiCallsAllowed()) return false;

  if (mimeType.startsWith("image/")) {
    return extractedTextLength < 400;
  }

  if ((opts?.scanSuccessPercent ?? 100) < 50) return true;

  const cat = category.toLowerCase();
  const imagingCategory = /x-ray|radiology|ct scan|mri|ecg|ultrasound/i.test(cat);

  if (opts?.isImagingStudy && extractedTextLength < 350) return true;

  if (imagingCategory && extractedTextLength < 150) return true;

  if (extractedTextLength < 60) return true;

  return false;
}

/** Gemini clinical report brief + possible diseases (1 generate call per upload). */
export function shouldRunGeminiClinicalAnalysis(
  textLength: number,
  opts?: {
    isImagingStudy?: boolean;
    mimeType?: string;
    hasVisionFindings?: boolean;
  },
): boolean {
  if (!geminiCallsAllowed()) return false;
  if (process.env.AI_DISABLE_REPORT_GEMINI_ANALYSIS === "true") return false;
  if (opts?.isImagingStudy || opts?.mimeType?.startsWith("image/")) return true;
  if (opts?.hasVisionFindings) return true;
  if (isUploadSynthesisEnabled()) return true;
  return textLength >= 40;
}
