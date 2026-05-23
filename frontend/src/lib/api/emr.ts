import { apiClient } from "./client";
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
  const { data } = await apiClient.get<{ emr: PatientEmrPayload; latestSnapshot: { id: string; label: string; createdAt: string } | null }>(
    "/emr/me",
  );
  return data;
}

export async function generateMyEmrSnapshot() {
  const { data } = await apiClient.post<{ snapshot: { id: string; createdAt: string } }>("/emr/me/snapshot");
  return data.snapshot;
}

export async function recordMyVitals(vitals: {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  sugarLevel?: number;
  oxygenLevel?: number;
}) {
  const { data } = await apiClient.post("/emr/me/vitals", vitals);
  return data;
}

export async function updateMyHealthProfile(
  body: Partial<EmrProfile> & { name?: string; location?: string },
) {
  const { data } = await apiClient.patch<{ profile: EmrProfile }>("/emr/me/profile", body);
  return data.profile;
}

export async function fetchDoctorPatientsEmr() {
  const { data } = await apiClient.get<{ patients: DoctorPatientEmrRow[] }>("/emr/doctor/patients");
  return data.patients;
}

export async function fetchPatientEmrForDoctor(patientId: string) {
  const { data } = await apiClient.get<{
    emr: PatientEmrPayload;
    latestSnapshot: { id: string; label: string; createdAt: string } | null;
    doctorClinicalNote: { content: string; updatedAt: string | null };
  }>(`/emr/patients/${patientId}`);
  return data;
}

export async function generatePatientEmrSnapshot(patientId: string) {
  const { data } = await apiClient.post(`/emr/patients/${patientId}/snapshot`);
  return data;
}

export async function completeConsultationEmr(
  appointmentId: string,
  body: { conclusion?: string; vitals?: Record<string, number> },
) {
  const { data } = await apiClient.post(`/emr/consultations/${appointmentId}/complete`, body);
  return data;
}
