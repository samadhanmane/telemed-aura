import {
  extractTextFromBuffer,
  inferReportType,
} from "../../services/ai/core/file-extract.js";
import type { DocumentExtractionResult } from "../../services/ai/extraction/types.js";
import { uploadToCloudinary } from "./cloudinary.service.js";

export type UploadedMedia = {
  secureUrl: string;
  publicId: string;
  extractionMethod: string;
  extractedText: string;
  extraction: DocumentExtractionResult;
  reportType: "PDF" | "PNG" | "JPG";
};

/**
 * 1) Upload buffer to Cloudinary
 * 2) Download from Cloudinary URL
 * 3) Run OCR / PDF text extraction for AI
 */
export async function uploadToCloudinaryAndExtract(
  buffer: Buffer,
  opts: {
    folder: string;
    filename: string;
    mimeType: string;
    category?: string;
    /** Gemini vision only for medical report image/page fallback (not prescriptions). */
    allowGeminiVision?: boolean;
  },
): Promise<UploadedMedia> {
  const uploaded = await uploadToCloudinary(buffer, opts);
  const { text, method, extraction } = await extractTextFromBuffer(
    buffer,
    opts.mimeType,
    opts.filename,
    { category: opts.category, allowGeminiVision: opts.allowGeminiVision },
  );
  const reportType = inferReportType(opts.filename, opts.mimeType);

  return {
    secureUrl: uploaded.secureUrl,
    publicId: uploaded.publicId,
    extractionMethod: method,
    extractedText: text,
    extraction,
    reportType,
  };
}
