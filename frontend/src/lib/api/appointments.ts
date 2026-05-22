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
  fee: string;
  mode: string;
  roomId?: string;
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

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const { data } = await apiClient.patch<{ appointment: ApiAppointment }>(`/appointments/${id}`, {
    status,
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

export async function endVideoSession(appointmentId: string) {
  const { data } = await apiClient.post<{ appointment: ApiAppointment }>(
    `/appointments/${appointmentId}/video-session/end`,
  );
  return data;
}
