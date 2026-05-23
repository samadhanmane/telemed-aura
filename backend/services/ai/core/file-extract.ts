import fs from "fs/promises";
import path from "path";
import {
  extractDocumentPages,
  joinPagesForAnalysis,
} from "../extraction/document-extractor.js";
import type { DocumentExtractionResult } from "../extraction/types.js";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function validateUploadMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export function validateUploadSize(size: number): boolean {
  return size > 0 && size <= MAX_UPLOAD_BYTES;
}

/** Page-wise extraction (multi-page PDF, OCR per sparse page). */
export async function extractDocumentFromBuffer(
  buffer: Buffer,
  mimeType: string,
  opts?: { category?: string; filename?: string; mimeType?: string; allowGeminiVision?: boolean },
): Promise<DocumentExtractionResult> {
  return extractDocumentPages(buffer, mimeType, {
    ...opts,
    mimeType: opts?.mimeType ?? mimeType,
  });
}

/** Legacy flat text + method for pipelines that expect a single string. */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  label = "file",
  opts?: { category?: string; allowGeminiVision?: boolean },
): Promise<{ text: string; method: string; extraction: DocumentExtractionResult }> {
  const extraction = await extractDocumentFromBuffer(buffer, mimeType, {
    filename: label,
    category: opts?.category,
    mimeType,
    allowGeminiVision: opts?.allowGeminiVision,
  });
  return {
    text: joinPagesForAnalysis(extraction),
    method: extraction.primary_method,
    extraction,
  };
}

export async function extractTextFromUrl(
  fileUrl: string,
  mimeType: string,
  label = "file",
): Promise<{ text: string; method: string; extraction: DocumentExtractionResult }> {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Could not download file for analysis (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return extractTextFromBuffer(buffer, mimeType, label);
}

export async function extractTextFromFile(
  filePath: string,
  mimeType: string,
): Promise<{ text: string; method: string; extraction: DocumentExtractionResult }> {
  const buffer = await fs.readFile(filePath);
  return extractTextFromBuffer(buffer, mimeType, path.basename(filePath));
}

export function inferReportType(filename: string, mime: string): "PDF" | "PNG" | "JPG" {
  const ext = path.extname(filename).toLowerCase();
  if (mime === "application/pdf" || ext === ".pdf") return "PDF";
  if (ext === ".png" || mime === "image/png") return "PNG";
  if (ext === ".docx" || ext === ".doc") return "PDF";
  return "JPG";
}
