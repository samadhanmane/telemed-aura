import { apiClient, extractResponseData } from "./client";

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
  const res = await apiClient.get("/dashboard/patient");
  return extractResponseData<PatientDashboard>(res);
}

export async function fetchPatientTimeline() {
  const res = await apiClient.get("/dashboard/patient/timeline");
  const data = extractResponseData<{
    timeline: { id: string; type: string; title: string; subtitle: string; date: string; meta?: Record<string, unknown> }[];
  }>(res);
  return data.timeline;
}

export async function fetchPatientAnalytics() {
  const res = await apiClient.get("/dashboard/patient/analytics");
  const data = extractResponseData<{ analytics: Record<string, unknown> }>(res);
  return data.analytics;
}

export async function fetchDoctorPatients() {
  const res = await apiClient.get("/dashboard/doctor/patients");
  const data = extractResponseData<{ patients: Record<string, unknown>[] }>(res);
  return data.patients;
}

export async function fetchDoctorDashboard() {
  const res = await apiClient.get("/dashboard/doctor");
  return extractResponseData<{
    stats: Record<string, number> & { rating?: number; reviewCount?: number };
    profile?: { specialty: string; verified: boolean; verificationStatus: string };
    queue: Record<string, unknown>[];
    emergencyAlerts: { id: string; risk: number; symptoms: string }[];
  }>(res);
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
  const res = await apiClient.get(`/dashboard/doctor/patients/${patientId}`);
  return extractResponseData(res);
}

export async function fetchDoctorAnalytics() {
  const res = await apiClient.get("/dashboard/doctor/analytics");
  const data = extractResponseData<{ analytics: Record<string, unknown> }>(res);
  return data.analytics;
}

export async function fetchAdminDashboard() {
  const res = await apiClient.get("/dashboard/admin");
  return extractResponseData<AdminDashboardData>(res);
}

export async function fetchAdminUsers() {
  const res = await apiClient.get("/dashboard/admin/users");
  const data = extractResponseData<{ users: Record<string, unknown>[] }>(res);
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
  const res = await apiClient.get("/dashboard/admin/doctors", {
    params: status ? { status } : {},
  });
  const data = extractResponseData<{ doctors: AdminDoctorRow[] }>(res);
  return data.doctors;
}

export async function approveDoctorRegistration(doctorId: string) {
  const res = await apiClient.patch(`/dashboard/admin/doctors/${doctorId}/approve`);
  return extractResponseData<{ id: string; verificationStatus: string }>(res);
}

export async function rejectDoctorRegistration(doctorId: string, reason?: string) {
  const res = await apiClient.patch(`/dashboard/admin/doctors/${doctorId}/reject`, { reason });
  return extractResponseData<{ id: string; message: string }>(res);
}

export async function fetchAdminPatients() {
  const res = await apiClient.get("/dashboard/admin/patients");
  const data = extractResponseData<{ patients: Record<string, unknown>[] }>(res);
  return data.patients;
}

export async function fetchAdminAiMonitoring() {
  const res = await apiClient.get("/dashboard/admin/ai-monitoring");
  return extractResponseData<{
    stats: { scansToday: number; urgentCases: number; totalScans: number };
    symptomTrends: { symptom: string; count: number }[];
    criticalAlerts: { id: string; risk: number; symptoms: string }[];
  }>(res);
}
