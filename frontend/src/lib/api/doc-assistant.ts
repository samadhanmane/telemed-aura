import { apiClient } from "./client";
import type { ReportAiAnalysis, ReportScanSummary } from "./clinical";
import type { PrescriptionOcrResult } from "./ai";
import { askDocumentChat, MAX_REPORT_FILE_BYTES } from "./ai";

export { MAX_REPORT_FILE_BYTES, askDocumentChat };

export type DocumentType = "report" | "prescription";

export type LibraryDocument = {
  id: string;
  documentType: DocumentType;
  name: string;
  mimeType: string;
  category?: string;
  fileUrl?: string;
  uploadedAt: string;
  scanSummary?: ReportScanSummary;
  pageCount?: number;
  aiAnalysis?: ReportAiAnalysis;
  medicines?: PrescriptionOcrResult["medicines"];
  extractionMethod?: string;
};

export type UploadDocumentResponse =
  | {
      documentType: "report";
      report: { id: string; name: string; aiAnalysis?: ReportAiAnalysis };
      extractionMethod?: string;
      pageCount?: number;
      scanSummary?: ReportScanSummary;
      chunkIndexed?: number;
    }
  | {
      documentType: "prescription";
      result: PrescriptionOcrResult & {
        uploadId?: string;
        fileUrl?: string;
        scanSummary?: ReportScanSummary;
        pageCount?: number;
      };
      extractionMethod?: string;
      uploadId?: string;
      scanSummary?: ReportScanSummary;
      pageCount?: number;
    };

export async function fetchDocumentLibrary() {
  const { data } = await apiClient.get<{ documents: LibraryDocument[] }>("/ai/documents");
  return data.documents;
}

export async function uploadDocument(
  file: File,
  opts: { documentType: DocumentType; name?: string; category?: string },
) {
  const form = new FormData();
  form.append("file", file);
  form.append("documentType", opts.documentType);
  if (opts.name) form.append("name", opts.name);
  if (opts.category) form.append("category", opts.category);
  const { data } = await apiClient.post<UploadDocumentResponse>("/ai/documents/upload", form);
  return data;
}

export const REPORT_CATEGORIES = [
  "General",
  "Blood test",
  "Pathology",
  "Cardiology",
  "Radiology",
  "X-Ray",
  "CT scan",
  "MRI",
  "ECG",
  "Dermatology",
] as const;

/** Client-side validation before upload (mirrors backend MIME allowlist). */
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function validateDocFile(file: File): string | null {
  if (file.size > MAX_REPORT_FILE_BYTES) {
    return "File must be 20MB or smaller";
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".doc") && !name.endsWith(".docx")) {
    return "Legacy .doc is not supported. Save as .docx or PDF.";
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    if (!name.match(/\.(pdf|png|jpe?g|docx)$/)) {
      return "Use PDF, PNG, JPG, or DOCX only.";
    }
  }
  return null;
}

export const ACCEPTED_FILE_TYPES =
  ".pdf,.png,.jpg,.jpeg,.docx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
