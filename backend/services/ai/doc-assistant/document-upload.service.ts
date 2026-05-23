import { MedicalReport, PrescriptionUpload } from "../../../src/database/models/index.js";
import * as aiService from "../../../src/modules/ai/ai.service.js";

export type DocumentLibraryItem = {
  id: string;
  documentType: "report" | "prescription";
  name: string;
  mimeType: string;
  category?: string;
  fileUrl?: string;
  uploadedAt: string;
  scanSummary?: Record<string, unknown>;
  pageCount?: number;
  aiAnalysis?: Record<string, unknown>;
  medicines?: { name: string; dosage: string; frequency: string; duration: string }[];
  extractionMethod?: string;
};

export async function listPatientDocuments(patientId: string): Promise<DocumentLibraryItem[]> {
  const [reports, rxUploads] = await Promise.all([
    MedicalReport.find({ patientId }).sort({ createdAt: -1 }).lean(),
    PrescriptionUpload.find({ patientId }).sort({ createdAt: -1 }).lean(),
  ]);

  const items: DocumentLibraryItem[] = [];

  for (const r of reports) {
    const scan = r.aiAnalysis?.pipeline?.scanSummary as Record<string, unknown> | undefined;
    items.push({
      id: r._id.toString(),
      documentType: "report",
      name: r.name,
      mimeType: r.type === "PDF" ? "application/pdf" : `image/${r.type.toLowerCase()}`,
      category: r.category,
      fileUrl: r.fileUrl,
      uploadedAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
      scanSummary: scan,
      pageCount: r.aiAnalysis?.pipeline?.pageCount,
      aiAnalysis: r.aiAnalysis as Record<string, unknown> | undefined,
      extractionMethod: r.aiAnalysis?.pipeline?.extractionMethod,
    });
  }

  for (const u of rxUploads) {
    items.push({
      id: u._id.toString(),
      documentType: "prescription",
      name: u.originalName,
      mimeType: u.mimeType,
      fileUrl: u.fileUrl,
      uploadedAt: u.createdAt.toISOString(),
      medicines: u.medicines,
      scanSummary: u.scanSummary as Record<string, unknown> | undefined,
      pageCount: u.pageCount,
      extractionMethod:
        u.extractionMethod ??
        (u.ocrConfidence != null ? `ocr-${Math.round(u.ocrConfidence * 100)}%` : undefined),
    });
  }

  items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  return items;
}

export async function uploadPatientDocument(
  patientId: string,
  input: {
    documentType: "report" | "prescription";
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    name?: string;
    category?: string;
  },
) {
  if (input.documentType === "report") {
    const result = await aiService.uploadAndAnalyzeReport(patientId, {
      name: input.name ?? input.originalName,
      category: input.category ?? "General",
      buffer: input.buffer,
      mimeType: input.mimeType,
      originalName: input.originalName,
    });
    return {
      documentType: "report" as const,
      ...result,
    };
  }

  const result = await aiService.analyzeAndStorePrescriptionUpload(patientId, {
    buffer: input.buffer,
    mimeType: input.mimeType,
    originalName: input.originalName,
  });
  return {
    documentType: "prescription" as const,
    result,
    extractionMethod: result.extractionMethod,
    uploadId: result.uploadId,
    scanSummary: result.scanSummary,
    pageCount: result.pageCount,
  };
}
