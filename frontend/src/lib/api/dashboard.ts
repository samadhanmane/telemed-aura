import { apiClient } from "./client";

export type PatientDashboard = {
  greeting: string;
  userName: string;
  healthScore: number;
  healthRisk: number;
  healthStatus: "stable" | "monitor" | "needs_attention";
  stats: {
    upcomingAppointments: number;
    activePrescriptions: number;
    uploadedReports: number;
    aiAlerts: number;
  };
  upcoming: {
    id: string;
    doctorName?: string;
    date: string;
    time: string;
    status: string;
    specialization: string;
  }[];
  lastConsultation: { doctorName: string; date: string; specialization: string } | null;
  quickTips: string[];
};

export async function fetchPatientDashboard() {
  const { data } = await apiClient.get<PatientDashboard>("/dashboard/patient");
  return data;
}

export async function fetchPatientTimeline() {
  const { data } = await apiClient.get<{
    timeline: { id: string; type: string; title: string; subtitle: string; date: string; meta?: Record<string, unknown> }[];
  }>("/dashboard/patient/timeline");
  return data.timeline;
}

export async function fetchPatientAnalytics() {
  const { data } = await apiClient.get<{ analytics: Record<string, unknown> }>(
    "/dashboard/patient/analytics",
  );
  return data.analytics;
}

export async function fetchDoctorPatients() {
  const { data } = await apiClient.get<{ patients: Record<string, unknown>[] }>(
    "/dashboard/doctor/patients",
  );
  return data.patients;
}

export async function fetchDoctorDashboard() {
  const { data } = await apiClient.get<{
    stats: Record<string, number> & { rating?: number; reviewCount?: number };
    profile?: { specialty: string; verified: boolean; verificationStatus: string };
    queue: Record<string, unknown>[];
    emergencyAlerts: { id: string; risk: number; symptoms: string }[];
  }>("/dashboard/doctor");
  return data;
}

export type AdminDashboardData = {
  stats: Record<string, number>;
  systemHealth?: Record<string, string | number>;
  criticalAlerts?: { id: string; risk: number; symptoms: string }[];
  pendingDoctorApplications?: {
    id: string;
    name: string;
    email: string;
    specialty: string;
    licenseNumber: string;
    certificateUrl?: string;
    submittedAt: string;
  }[];
};

export async function fetchDoctorPatient(patientId: string) {
  const { data } = await apiClient.get(`/dashboard/doctor/patients/${patientId}`);
  return data;
}

export async function fetchDoctorAnalytics() {
  const { data } = await apiClient.get<{ analytics: Record<string, unknown> }>(
    "/dashboard/doctor/analytics",
  );
  return data.analytics;
}

export async function fetchAdminDashboard() {
  const { data } = await apiClient.get<AdminDashboardData>("/dashboard/admin");
  return data;
}

export async function fetchAdminUsers() {
  const { data } = await apiClient.get<{ users: Record<string, unknown>[] }>("/dashboard/admin/users");
  return data.users;
}

export type AdminDoctorRow = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty: string;
  specialtyId?: string;
  licenseNumber: string;
  bio?: string;
  rating: number;
  experienceYears: number;
  verified: boolean;
  verificationStatus: "pending" | "approved" | "rejected";
  certificateUrl?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
};

export async function fetchAdminDoctors(status?: "pending" | "approved" | "rejected" | "all") {
  const { data } = await apiClient.get<{ doctors: AdminDoctorRow[] }>(
    "/dashboard/admin/doctors",
    { params: status ? { status } : {} },
  );
  return data.doctors;
}

export async function approveDoctorRegistration(doctorId: string) {
  const { data } = await apiClient.patch<{ id: string; verificationStatus: string }>(
    `/dashboard/admin/doctors/${doctorId}/approve`,
  );
  return data;
}

export async function rejectDoctorRegistration(doctorId: string, reason?: string) {
  const { data } = await apiClient.patch<{ id: string; message: string }>(
    `/dashboard/admin/doctors/${doctorId}/reject`,
    { reason },
  );
  return data;
}

export async function fetchAdminPatients() {
  const { data } = await apiClient.get<{ patients: Record<string, unknown>[] }>(
    "/dashboard/admin/patients",
  );
  return data.patients;
}

export async function fetchAdminAiMonitoring() {
  const { data } = await apiClient.get<{
    stats: { scansToday: number; urgentCases: number; totalScans: number };
    symptomTrends: { symptom: string; count: number }[];
    criticalAlerts: { id: string; risk: number; symptoms: string }[];
  }>("/dashboard/admin/ai-monitoring");
  return data;
}
