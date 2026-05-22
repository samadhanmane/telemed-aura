import { apiClient } from "./client";

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  specialtyLabel: string;
  experienceYears: number;
  consultationFee: number;
  rating: number;
  bio?: string;
};

export async function fetchDoctors(specialty?: string) {
  const { data } = await apiClient.get<{ doctors: Doctor[] }>("/doctors", {
    params: specialty ? { specialty } : {},
  });
  return data.doctors;
}

export async function fetchDoctorSlots(doctorId: string, date: string) {
  const { data } = await apiClient.get<{ slots: string[] }>(`/doctors/${doctorId}/slots`, {
    params: { date },
  });
  return data.slots;
}
