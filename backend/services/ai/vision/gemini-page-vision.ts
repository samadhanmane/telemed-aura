import type { GeminiVisionFindings } from "../core/types.js";
import { getAiConfig } from "../config/ai.config.js";
import { generateGeminiContent } from "../models/gemini.client.js";
import { isGeminiQuotaBlocked } from "../models/gemini-quota.js";
import { getRemainingUploadBudget } from "../models/gemini-rate-manager.js";
import type { ExtractionPage } from "../extraction/types.js";
import { scanMedicalImageWithGemini } from "./gemini-image-scan.js";

const MAX_GEMINI_PAGES = Number(process.env.AI_MAX_GEMINI_PAGES_PER_DOC ?? 3);

function geminiAllowed(): boolean {
  return (
    process.env.AI_DISABLE_GEMINI !== "true" &&
    Boolean(getAiConfig().apiKey) &&
    !isGeminiQuotaBlocked()
  );
}

function buildPageFallbackPrompt(input: {
  category: string;
  filename: string;
  pageNum: number;
  ocrSnippet: string;
  hasImages: boolean;
}): string {
  return `Medical document page ${input.pageNum} (${input.category}). File: ${input.filename}.
Local OCR (pdf-parse / Tesseract) could not read this page well.
${input.hasImages ? "This page contains images or scans." : ""}
Prior OCR attempt: "${input.ocrSnippet.slice(0, 200)}"
List only what you can read: lab values, labels, handwriting, imaging findings. Plain text. No diagnosis. No severity score.`;
}

/** One Gemini vision call for a single page image (PNG screenshot or photo). */
export async function extractPageTextWithGemini(
  imagePng: Buffer,
  input: { category: string; filename: string; pageNum: number; ocrSnippet: string; hasImages: boolean },
): Promise<string | null> {
  if (!geminiAllowed()) return null;

  const text = await generateGeminiContent(
    [
      { text: buildPageFallbackPrompt(input) },
      { inlineData: { mimeType: "image/png", data: imagePng.toString("base64") } },
    ],
    { modelId: getAiConfig().visionModel, maxOutputTokens: 400, slotKind: "vision" },
  );

  return text?.trim() || null;
}

function pageNeedsGeminiFallback(page: ExtractionPage): boolean {
  const len = page.char_count ?? page.text.length;
  if (page.method === "failed" || page.method === "no_ocr") return true;
  if (page.text.includes("[No text") || page.text.includes("[OCR")) return true;
  if (len < 50) return true;
  if ((page.image_count ?? 0) > 0 && len < 100) return true;
  return false;
}

function mergeVisionFindings(
  acc: GeminiVisionFindings | null,
  pageText: string,
  pageNum: number,
): GeminiVisionFindings {
  const line = `Page ${pageNum}: ${pageText.slice(0, 280)}`;
  if (!acc) {
    return {
      documentType: "mixed",
      imagingSummary: line,
      visibleFindings: [line.slice(0, 120)],
      clinicalFlags: [],
    };
  }
  return {
    ...acc,
    imagingSummary: `${acc.imagingSummary ?? ""} ${line}`.slice(0, 500),
    visibleFindings: [...(acc.visibleFindings ?? []), line.slice(0, 120)].slice(0, 5),
  };
}

export type SelectiveGeminiResult = {
  pages: ExtractionPage[];
  geminiPagesUsed: number;
  visionFindings: GeminiVisionFindings | null;
};

/**
 * After pdf-parse + Tesseract: Gemini only for pages that still lack text (esp. images).
 */
export async function enrichPagesWithSelectiveGemini(
  pages: ExtractionPage[],
  pageScreenshots: Map<number, Buffer>,
  opts: { category: string; filename: string },
): Promise<SelectiveGeminiResult> {
  if (!geminiAllowed()) {
    return { pages, geminiPagesUsed: 0, visionFindings: null };
  }

  const updated = pages.map((p) => ({ ...p }));
  let geminiPagesUsed = 0;
  let visionFindings: GeminiVisionFindings | null = null;

  const budgetCap = Math.max(0, getRemainingUploadBudget());
  const pageLimit = Math.min(MAX_GEMINI_PAGES, budgetCap);

  const candidates = updated
    .filter((p) => pageNeedsGeminiFallback(p) && pageScreenshots.has(p.page_num))
    .slice(0, pageLimit);

  for (const page of candidates) {
    const shot = pageScreenshots.get(page.page_num);
    if (!shot) continue;

    const geminiText = await extractPageTextWithGemini(shot, {
      category: opts.category,
      filename: opts.filename,
      pageNum: page.page_num,
      ocrSnippet: page.text,
      hasImages: (page.image_count ?? 0) > 0,
    });

    if (!geminiText || geminiText.length < 10) continue;

    geminiPagesUsed += 1;
    page.text = geminiText;
    page.method = "gemini_vision";
    page.char_count = geminiText.length;
    visionFindings = mergeVisionFindings(visionFindings, geminiText, page.page_num);
  }

  if (geminiPagesUsed > 0) {
    console.info(
      `[extract] Gemini vision used on ${geminiPagesUsed} page(s) only (OCR/pdf-parse handled the rest)`,
    );
  }

  return { pages: updated, geminiPagesUsed, visionFindings };
}

/** @deprecated Use scanMedicalImageWithGemini */
export async function analyzeImageWithGeminiVision(
  buffer: Buffer,
  mimeType: string,
  opts: { category: string; filename: string; ocrSnippet: string },
): Promise<{ text: string; visionFindings: GeminiVisionFindings | null }> {
  const scan = await scanMedicalImageWithGemini(buffer, mimeType, opts);
  if (!scan) return { text: opts.ocrSnippet, visionFindings: null };
  return { text: scan.text, visionFindings: scan.visionFindings };
}

/**
 * Every uploaded image is scanned by Gemini vision (not only when OCR is short).
 */
export async function enrichImageWithSelectiveGemini(
  buffer: Buffer,
  tesseractText: string,
  opts: { category: string; filename: string; mimeType?: string },
): Promise<{ text: string; method: ExtractionPage["method"]; visionFindings: GeminiVisionFindings | null }> {
  const mimeType = opts.mimeType ?? "image/jpeg";

  const scan = await scanMedicalImageWithGemini(buffer, mimeType, {
    category: opts.category,
    filename: opts.filename,
    ocrSnippet: tesseractText,
  });

  if (scan) {
    return {
      text: scan.text,
      method: scan.method,
      visionFindings: scan.visionFindings,
    };
  }

  if (!geminiAllowed()) {
    return {
      text: tesseractText || "[No text extracted from image — AI vision unavailable]",
      method: tesseractText ? "tesseract" : "no_ocr",
      visionFindings: null,
    };
  }

  return {
    text: tesseractText || "[Gemini vision could not read this image — try again or use a clearer photo]",
    method: tesseractText ? "tesseract" : "no_ocr",
    visionFindings: null,
  };
}
