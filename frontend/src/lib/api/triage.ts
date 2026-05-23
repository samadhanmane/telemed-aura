import { apiClient } from "./client";
import type { ApiAppointment } from "./appointments";

export type PatientSeverity = {
  patientId: string;
  patientName: string;
  riskScore: number;
  severity: "Low" | "Moderate" | "High" | "Critical";
  emergency: boolean;
  reasons: string[];
  suggestedSpecialist?: string;
  healthScore: number;
  priorityScore: number;
};

export type TriageQueueItem = {
  appointment: ApiAppointment & { priority?: string; notes?: string };
  severity: PatientSeverity;
  isMyPatient: boolean;
};

export type CriticalBoardPatient = {
  severity: PatientSeverity;
  alertId?: string;
  isMyPatient: boolean;
  hasUpcomingWithMe: boolean;
  canAccept: boolean;
  isAssignedToMe: boolean;
  claimedByDoctorName?: string;
  appointmentId?: string;
  upcomingWithMe: { id: string; date: string; time: string; status: string } | null;
};

export type CriticalBoard = {
  patients: CriticalBoardPatient[];
  assignedToday: {
    appointment: ApiAppointment;
    severity: PatientSeverity;
  } | null;
  suggestedSlot: { date: string; time: string } | null;
};

export type AcceptCriticalResult = {
  appointment: ApiAppointment;
  alertId: string;
  alreadyAccepted: boolean;
  conflictsWithin30Min: { id: string; patientId: string; date: string; time: string; status: string }[];
  mustRescheduleFirst: boolean;
};

export type PatientCriticalAlert = {
  id: string;
  status: "open" | "claimed" | "dismissed" | "expired";
  severity: string;
  riskScore: number;
  emergency: boolean;
  patientDismissedNotification: boolean;
  claimedByDoctorId?: string;
  claimedByDoctorName?: string;
  appointment: ApiAppointment | null;
  canPatientBook: boolean;
  expiresAt: string;
};

export async function fetchDoctorTriageQueue() {
  const { data } = await apiClient.get<{
    totalUpcoming: number;
    overloaded: boolean;
    threshold: number;
    queue: TriageQueueItem[];
  }>("/clinical/doctor/triage-queue");
  return data;
}

export async function fetchCriticalBoard() {
  const { data } = await apiClient.get<CriticalBoard>("/clinical/doctor/critical-patients");
  return data;
}

/** @deprecated use fetchCriticalBoard */
export async function fetchCriticalPatients() {
  const board = await fetchCriticalBoard();
  return board.patients;
}

export async function fetchPatientSeverity(patientId: string) {
  const { data } = await apiClient.get<{ severity: PatientSeverity }>(
    `/clinical/patients/${patientId}/severity`,
  );
  return data.severity;
}

export async function acceptCriticalPatient(body: {
  patientId: string;
  date: string;
  time: string;
  specialty?: string;
}) {
  const { data } = await apiClient.post<AcceptCriticalResult>(
    "/clinical/doctor/accept-critical",
    body,
  );
  return data;
}

export async function urgentBookConsult(body: {
  patientId: string;
  date: string;
  time: string;
  specialty?: string;
  rescheduleOtherAppointmentId?: string;
}) {
  const { data } = await apiClient.post<AcceptCriticalResult>("/clinical/doctor/urgent-book", body);
  return data;
}

export async function rescheduleConsult(body: {
  appointmentId: string;
  date?: string;
  time?: string;
  autoNextSlot?: boolean;
  reason?: string;
}) {
  const { data } = await apiClient.post<{ appointment: ApiAppointment }>(
    "/clinical/doctor/reschedule",
    body,
  );
  return data.appointment;
}

export async function fetchNextFreeSlot(date?: string) {
  const { data } = await apiClient.get<{ slot: { date: string; time: string } | null }>(
    "/clinical/doctor/next-free-slot",
    { params: date ? { date } : {} },
  );
  return data.slot;
}

export async function fetchPatientCriticalAlert(doctorId?: string, date?: string) {
  const { data } = await apiClient.get<{ alert: PatientCriticalAlert | null; slots: string[] }>(
    "/clinical/patient/critical-alert",
    { params: doctorId ? { doctorId, date } : {} },
  );
  return data;
}

export async function dismissPatientCriticalAlert() {
  await apiClient.post("/clinical/patient/critical-alert/dismiss");
}

export async function patientCriticalBook(body: { doctorId: string; date: string; time: string }) {
  const { data } = await apiClient.post<AcceptCriticalResult>(
    "/clinical/patient/critical-book",
    body,
  );
  return data;
}
