import { apiClient, extractResponseData } from "./client";
import type { AppointmentStatus } from "@/types/healthcare";

export type ApiAppointment = {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  specialty: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  mode: string;
  roomId?: string;
  notes?: string;
  priority?: "normal" | "urgent";
};

export async function fetchAppointments() {
  const res = await apiClient.get("/appointments");
  const data = extractResponseData<{ appointments: ApiAppointment[] }>(res);
  return data.appointments;
}

export async function bookAppointment(body: {
  doctorId: string;
  date: string;
  time: string;
  specialty: string;
}) {
  const res = await apiClient.post("/appointments", body);
  const data = extractResponseData<{ appointment: ApiAppointment }>(res);
  return data.appointment;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  emr?: {
    conclusion?: string;
    vitals?: {
      bloodPressureSystolic?: number;
      bloodPressureDiastolic?: number;
      sugarLevel?: number;
      oxygenLevel?: number;
    };
  },
) {
  const res = await apiClient.patch(`/appointments/${id}`, {
    status,
    ...emr,
  });
  const data = extractResponseData<{ appointment: ApiAppointment }>(res);
  return data.appointment;
}

export type VideoSessionResponse = {
  sessionToken: string;
  appointment: ApiAppointment;
  role: string;
  expiresIn: string;
};

export async function createVideoSession(appointmentId: string) {
  const res = await apiClient.post(`/appointments/${appointmentId}/video-session`);
  return extractResponseData<VideoSessionResponse>(res);
}

export async function leaveVideoSession(
  appointmentId: string,
  draft?: {
    conclusion?: string;
    vitals?: {
      bloodPressureSystolic?: number;
      bloodPressureDiastolic?: number;
      sugarLevel?: number;
      oxygenLevel?: number;
    };
  },
) {
  const res = await apiClient.post(
    `/appointments/${appointmentId}/video-session/leave`,
    draft ?? {},
  );
  const data = extractResponseData<{ appointment: ApiAppointment }>(res);
  return data.appointment;
}

/** @deprecated Prefer leaveVideoSession */
export async function endVideoSession(
  appointmentId: string,
  draft?: Parameters<typeof leaveVideoSession>[1],
) {
  return leaveVideoSession(appointmentId, draft);
}
