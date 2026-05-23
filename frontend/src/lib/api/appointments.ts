import { apiClient } from "./client";
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
  const { data } = await apiClient.get<{ appointments: ApiAppointment[] }>("/appointments");
  return data.appointments;
}

export async function bookAppointment(body: {
  doctorId: string;
  date: string;
  time: string;
  specialty: string;
}) {
  const { data } = await apiClient.post<{ appointment: ApiAppointment }>("/appointments", body);
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
  const { data } = await apiClient.patch<{ appointment: ApiAppointment }>(`/appointments/${id}`, {
    status,
    ...emr,
  });
  return data.appointment;
}

export type VideoSessionResponse = {
  sessionToken: string;
  appointment: ApiAppointment;
  role: string;
  expiresIn: string;
};

export async function createVideoSession(appointmentId: string) {
  const { data } = await apiClient.post<VideoSessionResponse>(
    `/appointments/${appointmentId}/video-session`,
  );
  return data;
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
  const { data } = await apiClient.post<{ appointment: ApiAppointment }>(
    `/appointments/${appointmentId}/video-session/leave`,
    draft ?? {},
  );
  return data;
}

/** @deprecated Prefer leaveVideoSession */
export async function endVideoSession(
  appointmentId: string,
  draft?: Parameters<typeof leaveVideoSession>[1],
) {
  return leaveVideoSession(appointmentId, draft);
}
