import { apiClient, extractResponseData } from "./client";

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  specialtyLabel: string;
  experienceYears: number;
  rating: number;
  reviewCount?: number;
  bio?: string;
  phone?: string;
  location?: string;
  hospital?: string;
  languages?: string[];
  qualifications?: string[];
  verified?: boolean;
};

export async function fetchDoctors(specialty?: string) {
  const res = await apiClient.get("/doctors", {
    params: specialty ? { specialty } : {},
  });
  const data = extractResponseData<{ doctors: Doctor[] }>(res);
  return data.doctors;
}

export async function fetchDoctorSlots(doctorId: string, date: string) {
  const res = await apiClient.get(`/doctors/${doctorId}/slots`, {
    params: { date },
  });
  const data = extractResponseData<{ slots: string[] }>(res);
  return data.slots;
}

export type DaySchedule = { enabled: boolean; start: string; end: string };
export type DoctorAvailability = {
  acceptingAppointments: boolean;
  weekly: Record<string, DaySchedule>;
  blockedDates: string[];
};

export async function fetchMyAvailability() {
  const res = await apiClient.get("/doctors/me/availability");
  const data = extractResponseData<{ availability: DoctorAvailability }>(res);
  return data.availability;
}

export async function updateMyAvailability(availability: Partial<DoctorAvailability>) {
  const res = await apiClient.put("/doctors/me/availability", availability);
  const data = extractResponseData<{ availability: DoctorAvailability }>(res);
  return data.availability;
}
