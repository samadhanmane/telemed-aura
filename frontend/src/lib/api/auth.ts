import { apiClient } from "./client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  phone?: string;
  healthScore?: number;
  doctorProfile?: {
    specialty: string;
    licenseNumber: string;
    experienceYears: number;
    consultationFee: number;
  };
};

export type Specialty = { id: string; label: string };

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<{ user: AuthUser; token: string }>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<{ user: AuthUser; token: string }>("/auth/register", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}

export async function fetchSpecialties() {
  const { data } = await apiClient.get<{ specialties: Specialty[] }>("/auth/specialties");
  return data.specialties;
}
