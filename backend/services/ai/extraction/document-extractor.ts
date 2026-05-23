/**
 * Page-wise document extraction (PDF multi-page, images, X-ray/MRI PDFs).
 * PDF: per-page text; sparse pages → screenshot OCR; embedded images counted.
 */
import { createWorker } from "tesseract.js";
import { computeScanSummary } from "./scan-stats.js";
import { normalizeMedicalReportText } from "./text-normalize.js";
import { enrichImageWithSelectiveGemini, enrichPagesWithSelectiveGemini } from "../vision/gemini-page-vision.js";
import type { DocumentExtractionResult, ExtractionPage } from "./types.js";

const MIN_PAGE_CHARS = 50;
const MIN_PAGE_CHARS_LAB = 25;
const LAB_DOC_HINT = /cbc|complete\s*blood|hemoglobin|hematocrit|pathology|blood\s*test|lab\s*report/i;
const MAX_PAGES = 40;
const MAX_TOTAL_CHARS = 80_000;

const IMAGING_HINTS = /x-?ray|xray|radiology|mri|ct\s*scan|ultrasound|sonography|mammogram|dexa|pet\s*scan/i;

async function ocrImageBuffer(pngOrImage: Buffer): Promise<string> {
  try {
    const worker = await createWorker("eng");
    try {
      const { data } = await worker.recognize(pngOrImage);
      return (data.text ?? "").trim();
    } finally {
      await worker.terminate();
    }
  } catch (e) {
    console.warn("[extract] Tesseract OCR failed:", e instanceof Error ? e.message : e);
    return "";
  }
}

async function countPdfImages(
  parser: { getImage: (p?: { partial?: number[]; imageThreshold?: number }) => Promise<{ pages?: { pageNumber: number; images?: unknown[] }[] }> },
  pageNums: number[],
): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  try {
    const imgResult = await parser.getImage({ partial: pageNums, imageThreshold: 40 });
    for (const pg of imgResult.pages ?? []) {
      const n = pg.images?.length ?? 0;
      if (n > 0) counts.set(pg.pageNumber, n);
    }
  } catch {
    /* optional */
  }
  return counts;
}

async function importPdfParse() {
  const { PDFParse } = await import("pdf-parse");
  return PDFParse;
}

export type ExtractDocumentOpts = {
  category?: string;
  filename?: string;
  mimeType?: string;
  /** When false, skip Gemini vision (prescriptions, DOCX, etc.). */
  allowGeminiVision?: boolean;
};

async function extractPdfPages(
  buffer: Buffer,
  categoryHint = "",
  opts?: ExtractDocumentOpts,
): Promise<DocumentExtractionResult> {
  const PDFParse = await importPdfParse();
  const parser = new PDFParse({ data: buffer });
  const pages: ExtractionPage[] = [];
  const pageScreenshots = new Map<number, Buffer>();
  let imagesDetected = 0;
  let documentFullText = "";

  try {
    const textResult = await parser.getText();
    documentFullText = normalizeMedicalReportText((textResult.text ?? "").trim());
    const isLabDoc = LAB_DOC_HINT.test(`${categoryHint} ${documentFullText.slice(0, 2000)}`);
    const minChars = isLabDoc ? MIN_PAGE_CHARS_LAB : MIN_PAGE_CHARS;
    const pageList = textResult.pages ?? [];
    const nums = pageList.slice(0, MAX_PAGES).map((p) => p.num);
    const imageCounts = await countPdfImages(parser, nums);

    for (const p of pageList.slice(0, MAX_PAGES)) {
      let text = (p.text ?? "").trim();
      let method: ExtractionPage["method"] = "text_layer";
      const image_count = imageCounts.get(p.num) ?? 0;
      imagesDetected += image_count;

      const needsTesseract =
        text.length < minChars || (image_count > 0 && text.length < minChars * 2);

      if (needsTesseract) {
        try {
          const shots = await parser.getScreenshot({
            partial: [p.num],
            imageBuffer: true,
            scale: 2,
          });
          const shot = shots.pages?.find((s) => s.pageNumber === p.num) ?? shots.pages?.[0];
          if (shot?.data) {
            const shotBuf = Buffer.from(shot.data);
            pageScreenshots.set(p.num, shotBuf);
            const ocrText = await ocrImageBuffer(shotBuf);
            if (ocrText.length > text.length) {
              text = ocrText;
              method = "tesseract";
            }
          }
        } catch {
          /* keep text_layer */
        }
      }

      if (!text) text = "[No text on this page]";
      pages.push({
        page_num: p.num,
        text,
        method,
        char_count: text.length,
        image_count,
      });
    }

    if (!pages.length && textResult.text?.trim()) {
      pages.push({
        page_num: 1,
        text: textResult.text.trim(),
        method: "text_layer",
        char_count: textResult.text.trim().length,
        image_count: 0,
      });
    }
  } finally {
    await parser.destroy().catch(() => undefined);
  }

  const category = opts?.category ?? categoryHint;
  const filename = opts?.filename ?? "document.pdf";
  const geminiEnriched =
    opts?.allowGeminiVision === true
      ? await enrichPagesWithSelectiveGemini(pages, pageScreenshots, {
          category,
          filename,
        })
      : { pages, geminiPagesUsed: 0, visionFindings: null };

  const is_imaging_study = IMAGING_HINTS.test(categoryHint);
  const result = finalizeResult(
    geminiEnriched.pages,
    geminiEnriched.geminiPagesUsed > 0
      ? "pdf-parse+tesseract+gemini-pages"
      : "pdf-parse+tesseract",
    imagesDetected,
    is_imaging_study,
    documentFullText,
  );
  result.gemini_pages_used = geminiEnriched.geminiPagesUsed;
  result.vision_findings = geminiEnriched.visionFindings;
  return result;
}

async function extractDocxPages(
  buffer: Buffer,
  mimeType?: string,
): Promise<DocumentExtractionResult> {
  if (mimeType === "application/msword") {
    const pages: ExtractionPage[] = [
      {
        page_num: 1,
        text: "[Legacy .doc format is not supported. Please save as .docx or PDF and upload again.]",
        method: "failed",
        char_count: 0,
        image_count: 0,
      },
    ];
    return finalizeResult(pages, "legacy-doc-unsupported", 0, false);
  }
  try {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    const text = (value ?? "").trim();
    const pages = splitTextIntoVirtualPages(text || "[Empty DOCX]", "python-docx");
    return finalizeResult(pages, "mammoth-docx", 0, false);
  } catch (e) {
    const pages: ExtractionPage[] = [
      {
        page_num: 1,
        text: `[DOCX read error: ${e instanceof Error ? e.message : "unknown"}]`,
        method: "failed",
        char_count: 0,
        image_count: 0,
      },
    ];
    return finalizeResult(pages, "docx-failed", 0, false);
  }
}

function splitTextIntoVirtualPages(text: string, method: ExtractionPage["method"], linesPerPage = 55): ExtractionPage[] {
  const lines = text.split("\n");
  if (lines.length <= linesPerPage) {
    return [{ page_num: 1, text, method, char_count: text.length, image_count: 0 }];
  }
  const pages: ExtractionPage[] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    const chunk = lines.slice(i, i + linesPerPage).join("\n");
    if (chunk.trim()) {
      pages.push({
        page_num: pages.length + 1,
        text: chunk,
        method,
        char_count: chunk.length,
        image_count: 0,
      });
    }
  }
  return pages.length ? pages : [{ page_num: 1, text, method, char_count: text.length, image_count: 0 }];
}

async function extractImagePages(
  buffer: Buffer,
  opts?: ExtractDocumentOpts,
): Promise<DocumentExtractionResult> {
  const tesseractText = await ocrImageBuffer(buffer);
  const enriched =
    opts?.allowGeminiVision === true
      ? await enrichImageWithSelectiveGemini(buffer, tesseractText, {
          category: opts?.category ?? "General",
          filename: opts?.filename ?? "image",
          mimeType: opts?.mimeType ?? "image/jpeg",
        })
      : {
          text: tesseractText || "[No text extracted from image]",
          method: (tesseractText ? "tesseract" : "no_ocr") as ExtractionPage["method"],
          visionFindings: null,
        };
  const pages: ExtractionPage[] = [
    {
      page_num: 1,
      text: enriched.text,
      method: enriched.method,
      char_count: enriched.text.length,
      image_count: 1,
    },
  ];
  const result = finalizeResult(
    pages,
    enriched.method === "gemini_vision" ? "tesseract+gemini" : "tesseract",
    1,
    true,
  );
  if (enriched.method === "gemini_vision") {
    result.gemini_pages_used = 1;
    result.vision_findings = enriched.visionFindings;
  }
  return result;
}

function finalizeResult(
  pages: ExtractionPage[],
  primaryMethod: string,
  imagesDetected: number,
  isImaging: boolean,
  documentFullText = "",
): DocumentExtractionResult {
  let full_text = normalizeMedicalReportText(pages.map((p) => p.text).join("\n\n"));
  const merged = documentFullText.trim();
  if (merged.length > full_text.length * 1.05) {
    full_text = `${merged}\n\n${full_text}`.trim();
  }
  full_text = full_text.slice(0, MAX_TOTAL_CHARS);
  const base: DocumentExtractionResult = {
    full_text,
    pages,
    page_count: pages.length,
    primary_method: primaryMethod,
    images_detected: imagesDetected,
    is_imaging_study: isImaging,
  };
  base.scan_summary = computeScanSummary(base);
  return base;
}

/** Master extractor — routes by MIME type. */
export async function extractDocumentPages(
  buffer: Buffer,
  mimeType: string,
  opts?: ExtractDocumentOpts,
): Promise<DocumentExtractionResult> {
  const hint = `${opts?.category ?? ""} ${opts?.filename ?? ""}`;

  if (mimeType === "application/pdf") {
    try {
      return await extractPdfPages(buffer, hint, opts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      console.warn("[extract] PDF parse failed:", msg);
      return finalizeResult(
        [
          {
            page_num: 1,
            text: `[PDF could not be read: ${msg}]. Try re-exporting the PDF or upload PNG/JPG scans.]`,
            method: "failed",
            char_count: 0,
            image_count: 0,
          },
        ],
        "pdf-parse-failed",
        0,
        IMAGING_HINTS.test(hint),
      );
    }
  }

  if (mimeType.startsWith("image/")) {
    return extractImagePages(buffer, { ...opts, mimeType });
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return extractDocxPages(buffer, mimeType);
  }

  const text = buffer.toString("utf-8", 0, Math.min(buffer.length, MAX_TOTAL_CHARS));
  return finalizeResult(
    [{ page_num: 1, text, method: "plaintext", char_count: text.length, image_count: 0 }],
    "plaintext",
    0,
    false,
  );
}

export function joinPagesForAnalysis(result: DocumentExtractionResult): string {
  return normalizeMedicalReportText(result.full_text).slice(0, 15_000);
}

export { computeScanSummary } from "./scan-stats.js";
