import { apiClient } from "./client";

export type SymptomScanResult = {
  id: string;
  risk: number;
  severity: string;
  triagePriority: number;
  possibleConditions: string[];
  suggestedSpecialist: string;
  suggestedSpecialtyId: string;
  emergency: boolean;
  preventiveSuggestions: string[];
  requiresDoctor: boolean;
  recommendation: string;
  patientProblemSummary?: string;
  analysisDetails?: string[];
  symptomCategory?: string;
  vitalsUsed?: boolean;
  geminiAnalysisUsed?: boolean;
  nearestDoctor?: { id: string; name: string; specialty: string; rating: number };
  criticalAlertId?: string;
  isCritical?: boolean;
  canBookUrgentCall?: boolean;
};

export async function runSymptomScan(body: {
  symptoms: string[];
  description?: string;
  bodyArea?: string;
  vitals?: {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    sugarLevel?: number;
    oxygenLevel?: number;
  };
}) {
  const { data } = await apiClient.post<{ result: SymptomScanResult }>("/ai/symptom-scan", body);
  return data.result;
}

export async function fetchHealthSummary() {
  const { data } = await apiClient.get<{
    summary: {
      healthScore: number;
      computedRisk: number;
      summary: string;
      suggestions: string[];
      consultationsCompleted: number;
      recentScans: number;
      reportsOnFile: number;
      lastTriagePriority: number | null;
    };
  }>("/ai/health-summary");
  return data.summary;
}

export async function runPrescriptionOcr(text: string) {
  const { data } = await apiClient.post<{
    result: {
      text: string;
      confidence: number;
      medicines: { name: string; dosage: string; frequency: string; duration: string }[];
    };
  }>("/ai/prescription-ocr", { text });
  return data.result;
}

export type PrescriptionOcrResult = {
  text: string;
  confidence: number;
  medicines: { name: string; dosage: string; frequency: string; duration: string }[];
  fileUrl?: string;
  uploadId?: string;
  extractionMethod?: string;
};

export async function runPrescriptionOcrFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<{ result: PrescriptionOcrResult }>(
    "/ai/prescription-ocr/file",
    form,
  );
  return data.result;
}

export async function fetchPrescriptionUploads() {
  const { data } = await apiClient.get<{
    uploads: {
      id: string;
      originalName: string;
      fileUrl: string;
      medicines: PrescriptionOcrResult["medicines"];
      createdAt: string;
    }[];
  }>("/ai/prescription-uploads");
  return data.uploads;
}

export type DocumentChatResult = {
  answer: string;
  sources: { file: string; page: number; score: number; sourceType: string }[];
  hasEnoughData: boolean;
  completenessScore: number;
  steps: { name: string; status: string; summary: string }[];
};

export async function askDocumentChat(body: {
  question: string;
  reportIds?: string[];
  documentIds?: string[];
}) {
  const { data } = await apiClient.post<{ result: DocumentChatResult }>("/ai/document-chat", body);
  return data.result;
}

export const MAX_REPORT_FILE_BYTES = 20 * 1024 * 1024;

export async function analyzeRiskVitals(vitals: {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  sugarLevel?: number;
  oxygenLevel?: number;
}) {
  const { data } = await apiClient.post<{ result: Record<string, unknown> }>("/ai/risk-vitals", vitals);
  return data.result;
}
