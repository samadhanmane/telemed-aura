import { apiClient, extractResponseData } from "./client";

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
  const res = await apiClient.post("/ai/symptom-scan", body);
  const data = extractResponseData<{ result: SymptomScanResult }>(res);
  return data.result;
}

export async function fetchHealthSummary() {
  const res = await apiClient.get("/ai/health-summary");
  const data = extractResponseData<{
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
  }>(res);
  return data.summary;
}

export async function runPrescriptionOcr(text: string) {
  const res = await apiClient.post("/ai/prescription-ocr", { text });
  const data = extractResponseData<{
    result: {
      text: string;
      confidence: number;
      medicines: { name: string; dosage: string; frequency: string; duration: string }[];
    };
  }>(res);
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
  const res = await apiClient.post("/ai/prescription-ocr/file", form);
  const data = extractResponseData<{ result: PrescriptionOcrResult }>(res);
  return data.result;
}

export async function fetchPrescriptionUploads() {
  const res = await apiClient.get("/ai/prescription-uploads");
  const data = extractResponseData<{
    uploads: {
      id: string;
      originalName: string;
      fileUrl: string;
      medicines: PrescriptionOcrResult["medicines"];
      createdAt: string;
    }[];
  }>(res);
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
  const res = await apiClient.post("/ai/document-chat", body);
  const data = extractResponseData<{ result: DocumentChatResult }>(res);
  return data.result;
}

export const MAX_REPORT_FILE_BYTES = 20 * 1024 * 1024;

export async function analyzeRiskVitals(vitals: {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  sugarLevel?: number;
  oxygenLevel?: number;
}) {
  const res = await apiClient.post("/ai/risk-vitals", vitals);
  const data = extractResponseData<{ result: Record<string, unknown> }>(res);
  return data.result;
}
