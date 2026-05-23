import { apiClient, extractResponseData } from "./client";
import type { ReportAiAnalysis, ReportScanSummary } from "./clinical";

export type EmrProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  age?: number;
  gender?: string;
  allergies: string[];
  chronicDiseases: string[];
  healthScore: number;
};

export type EmrVitals = {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  sugarLevel?: number;
  oxygenLevel?: number;
  recordedAt: string;
  source: string;
};

export type EmrConsultation = {
  id: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  conclusion: string;
  clinicalRemarks: string;
  vitals?: EmrVitals;
  completedAt: string;
};

export type EmrTimelineItem = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  at: string;
  meta?: Record<string, unknown>;
};

export type PatientEmrPayload = {
  profile: EmrProfile;
  latestVitals: EmrVitals | null;
  consultations: EmrConsultation[];
  prescriptions: {
    id: string;
    doctorName: string;
    specialization: string;
    medicines: { name: string; dosage: string; frequency: string; duration: string }[];
    instructions: string;
    date: string;
  }[];
  reports: {
    id: string;
    name: string;
    type: string;
    category: string;
    uploadDate: string;
    fileUrl?: string;
    aiAnalysis?: ReportAiAnalysis;
    scanSummary?: ReportScanSummary;
  }[];
  prescriptionUploads: {
    id: string;
    originalName: string;
    fileUrl?: string;
    mimeType: string;
    medicines: { name: string; dosage: string; frequency: string; duration: string }[];
    createdAt: string;
  }[];
  healthNarrative?: string;
  aiScans: { id: string; symptoms: string[]; risk: number; severity: string; emergency: boolean; createdAt: string }[];
  vitalsHistory: (EmrVitals & { id: string; note?: string })[];
  upcomingAppointments: { id: string; date: string; time: string; status: string; specialization: string }[];
  snapshots: { id: string; label: string; generatedBy: string; createdAt: string }[];
  timeline: EmrTimelineItem[];
  generatedAt: string;
};

export type DoctorPatientEmrRow = {
  id: string;
  name: string;
  phone?: string;
  location?: string;
  healthScore: number;
  age?: number;
  gender?: string;
  condition: string;
  riskLevel: string;
  severity?: string;
  riskScore?: number;
  emergency?: boolean;
  lastVisit: string;
  lastConclusion: string;
  upcomingMeeting: { date: string; time: string; status: string } | null;
  reportCount: number;
  prescriptionCount: number;
  totalConsultations: number;
};

export async function fetchMyEmr() {
  const res = await apiClient.get("/emr/me");
  return extractResponseData<{
    emr: PatientEmrPayload;
    latestSnapshot: { id: string; label: string; createdAt: string } | null;
  }>(res);
}

export async function generateMyEmrSnapshot() {
  const res = await apiClient.post("/emr/me/snapshot");
  const data = extractResponseData<{ snapshot: { id: string; createdAt: string } }>(res);
  return data.snapshot;
}

export async function recordMyVitals(vitals: {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  sugarLevel?: number;
  oxygenLevel?: number;
}) {
  const res = await apiClient.post("/emr/me/vitals", vitals);
  return extractResponseData(res);
}

export async function updateMyHealthProfile(
  body: Partial<EmrProfile> & { name?: string; location?: string },
) {
  const res = await apiClient.patch("/emr/me/profile", body);
  const data = extractResponseData<{ profile: EmrProfile }>(res);
  return data.profile;
}

export async function fetchDoctorPatientsEmr() {
  const res = await apiClient.get("/emr/doctor/patients");
  const data = extractResponseData<{ patients: DoctorPatientEmrRow[] }>(res);
  return data.patients;
}

export async function fetchPatientEmrForDoctor(patientId: string) {
  const res = await apiClient.get(`/emr/patients/${patientId}`);
  return extractResponseData<{
    emr: PatientEmrPayload;
    latestSnapshot: { id: string; label: string; createdAt: string } | null;
    doctorClinicalNote: { content: string; updatedAt: string | null };
  }>(res);
}

export async function generatePatientEmrSnapshot(patientId: string) {
  const res = await apiClient.post(`/emr/patients/${patientId}/snapshot`);
  return extractResponseData(res);
}

export async function completeConsultationEmr(
  appointmentId: string,
  body: { conclusion?: string; vitals?: Record<string, number> },
) {
  const res = await apiClient.post(`/emr/consultations/${appointmentId}/complete`, body);
  return extractResponseData(res);
}
