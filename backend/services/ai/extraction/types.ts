import type { GeminiVisionFindings } from "../core/types.js";

export type ExtractionPage = {
  page_num: number;
  text: string;
  method:
    | "text_layer"
    | "tesseract"
    | "gemini_vision"
    | "fitz_ocr"
    | "python-docx"
    | "plaintext"
    | "failed"
    | "no_ocr";
  char_count?: number;
  image_count?: number;
};

export type PageScanStatus = "success" | "partial" | "failed" | "skipped";

export type ScanSummary = {
  totalPages: number;
  pagesScanned: number;
  pagesFailed: number;
  pagesRemaining: number[];
  imagesDetected: number;
  imagesOcred: number;
  scanSuccessPercent: number;
  dataRetrievalPercent: number;
  pageDetails: {
    page_num: number;
    status: PageScanStatus;
    method: string;
    char_count: number;
    image_count: number;
  }[];
  summaryShort: string;
  primaryMethod: string;
};

export type DocumentExtractionResult = {
  full_text: string;
  pages: ExtractionPage[];
  page_count: number;
  primary_method: string;
  images_detected?: number;
  scan_summary?: ScanSummary;
  is_imaging_study?: boolean;
  /** Pages where Gemini vision ran after OCR/pdf-parse could not read content. */
  gemini_pages_used?: number;
  vision_findings?: GeminiVisionFindings | null;
};
