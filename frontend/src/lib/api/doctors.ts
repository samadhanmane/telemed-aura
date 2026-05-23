import { apiClient } from "./client";

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

export type DaySchedule = { enabled: boolean; start: string; end: string };
export type DoctorAvailability = {
  acceptingAppointments: boolean;
  weekly: Record<string, DaySchedule>;
  blockedDates: string[];
};

export async function fetchMyAvailability() {
  const { data } = await apiClient.get<{ availability: DoctorAvailability }>(
    "/doctors/me/availability",
  );
  return data.availability;
}

export async function updateMyAvailability(availability: Partial<DoctorAvailability>) {
  const { data } = await apiClient.put<{ availability: DoctorAvailability }>(
    "/doctors/me/availability",
    availability,
  );
  return data.availability;
}
