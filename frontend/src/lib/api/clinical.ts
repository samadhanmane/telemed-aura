import { apiClient } from "./client";
import type { ApiAppointment } from "./appointments";

export type ClinicalNote = {
  content: string;
  updatedAt: string | null;
  lastAppointmentId: string | null;
};

export type ClinicalMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

export type ClinicalPrescription = {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  doctorName: string;
  specialization: string;
  medicines: ClinicalMedicine[];
  instructions: string;
  date: string;
};

export type ReportChartSeries = {
  id: string;
  title: string;
  type: "bar" | "line" | "comparison" | "vitals" | "risk" | "pie" | "area" | "radar";
  data: { label: string; value: number; ref?: string; unit?: string }[];
};

export type ReportExtractedVitals = {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  fastingGlucose?: number;
  randomGlucose?: number;
  hba1c?: number;
  hemoglobin?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
};

export type DoctorReportReview = {
  doctorId: string;
  remarks: string;
  severityOverride?: "Low" | "Moderate" | "High" | "Critical";
  confirmedFlags?: string[];
  reviewedAt: string;
};

export type ReportScanSummary = {
  totalPages: number;
  pagesScanned: number;
  pagesFailed: number;
  pagesRemaining: number[];
  imagesDetected: number;
  imagesOcred: number;
  scanSuccessPercent: number;
  dataRetrievalPercent: number;
  summaryShort: string;
  primaryMethod: string;
  pageDetails?: {
    page_num: number;
    status: "success" | "partial" | "failed" | "skipped";
    method: string;
    char_count: number;
    image_count: number;
  }[];
};

export type ReportPossibleDisease = {
  name: string;
  likelihood: string;
  source: "gemini" | "rules" | "both";
  note?: string;
};

export type ReportKeyLabFinding = {
  test: string;
  value: string;
  status?: string;
  refRange?: string;
};

export type ReportAiAnalysis = {
  patientProblemSummary?: string;
  clinicalBrief?: string;
  finalVerdict?: string;
  assessmentBasis?: string[];
  symptomsFromReport?: string[];
  possibleDiseases?: ReportPossibleDisease[];
  keyLabFindings?: ReportKeyLabFinding[];
  analysisDetails?: string[];
  summary: string;
  riskScore: number;
  severity: "Low" | "Moderate" | "High" | "Critical";
  suggestedSpecialist?: string;
  insights: string[];
  abnormalities?: string[];
  chartData: { label: string; value: number; ref?: string; unit?: string }[];
  charts?: ReportChartSeries[];
  extractedVitals?: ReportExtractedVitals;
  doctorReview?: DoctorReportReview;
  guidance?: {
    pros: string[];
    cons: string[];
    doList: string[];
    avoidList: string[];
  };
  pipeline?: {
    extractionMethod?: string;
    pageCount?: number;
    visionUsed?: boolean;
    synthesisUsed?: boolean;
    mlUsed?: boolean;
    detectedConditions?: string[];
    documentType?: string;
    remarkAdjusted?: boolean;
    chunksIndexed?: number;
    scanSummary?: ReportScanSummary;
    geminiQuotaLimited?: boolean;
    visionScanOk?: boolean;
    ruleConfidence?: "high" | "medium" | "low";
    geminiVerdictPrimary?: boolean;
    geminiRuleAgreement?: "supports" | "extends" | "overrides";
  };
};

export type AiAnalysis = ReportAiAnalysis;

export type ClinicalReport = {
  id: string;
  patientId: string;
  name: string;
  type: string;
  uploadDate: string;
  category: string;
  fileUrl?: string;
  aiAnalysis?: ReportAiAnalysis;
};

export type PatientContext = {
  patient: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    healthScore: number;
  };
  clinicalNote: ClinicalNote;
  appointments: {
    id: string;
    date: string;
    time: string;
    status: string;
    specialization: string;
  }[];
  prescriptions: ClinicalPrescription[];
  allPrescriptions: ClinicalPrescription[];
  reports: ClinicalReport[];
};

export async function fetchPatientContext(patientId: string) {
  const { data } = await apiClient.get<PatientContext>(`/clinical/patients/${patientId}/context`);
  return data;
}

export async function saveClinicalNote(
  patientId: string,
  body: { content: string; appointmentId?: string },
) {
  const { data } = await apiClient.put<{ note: ClinicalNote }>(
    `/clinical/patients/${patientId}/notes`,
    body,
  );
  return data.note;
}

export async function createConsultPrescription(
  patientId: string,
  body: {
    medicines: ClinicalMedicine[];
    instructions: string;
    appointmentId?: string;
  },
) {
  const { data } = await apiClient.post<{ prescription: ClinicalPrescription }>(
    `/clinical/patients/${patientId}/prescriptions`,
    body,
  );
  return data.prescription;
}

export async function scheduleFollowUp(body: {
  patientId: string;
  date: string;
  time: string;
  specialty?: string;
  /** Current video consult — notifies patient in call and books only free slots */
  sourceAppointmentId?: string;
}) {
  const { data } = await apiClient.post<{ appointment: ApiAppointment }>("/clinical/follow-up", body);
  return data.appointment;
}

export async function fetchMyReports() {
  const { data } = await apiClient.get<{ reports: ClinicalReport[] }>("/clinical/reports");
  return data.reports;
}

export async function fetchMyPrescriptions() {
  const { data } = await apiClient.get<{ prescriptions: ClinicalPrescription[] }>(
    "/clinical/prescriptions",
  );
  return data.prescriptions;
}

export async function uploadReport(body: {
  name: string;
  type: "PDF" | "PNG" | "JPG";
  category: string;
}) {
  const { data } = await apiClient.post<{ report: ClinicalReport }>("/clinical/reports", body);
  return data.report;
}

export async function uploadReportFile(file: File, meta: { name: string; category: string }) {
  const form = new FormData();
  form.append("file", file);
  form.append("name", meta.name);
  form.append("category", meta.category);
  const { data } = await apiClient.post<{
    report: ClinicalReport;
    extractionMethod?: string;
    pageCount?: number;
    scanSummary?: ReportScanSummary;
    chunkIndexed?: number;
    extractedTextPreview?: string;
  }>("/clinical/reports", form);
  return data;
}

export async function fetchDoctorReports() {
  const { data } = await apiClient.get<{
    reports: (ClinicalReport & { patientName?: string })[];
  }>("/clinical/doctor/reports");
  return data.reports;
}

export async function reviewMedicalReport(
  reportId: string,
  body: {
    remarks: string;
    severityOverride?: ReportAiAnalysis["severity"];
    confirmedFlags?: string[];
  },
) {
  const { data } = await apiClient.patch<{ report: ClinicalReport }>(
    `/clinical/reports/${reportId}/review`,
    body,
  );
  return data.report;
}

export async function fetchDoctorPrescriptions() {
  const { data } = await apiClient.get<{
    prescriptions: (ClinicalPrescription & { patientName?: string })[];
  }>("/clinical/doctor/prescriptions");
  return data.prescriptions;
}

export async function fetchAppointment(id: string) {
  const { data } = await apiClient.get<{ appointment: ApiAppointment }>(`/appointments/${id}`);
  return data.appointment;
}
