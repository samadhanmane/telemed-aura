import { apiClient } from "./client";
import { DEFAULT_SPECIALTIES } from "@/lib/specialties";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  phone?: string;
  healthScore?: number;
  doctorProfile?: {
    specialty: string;
    specialtyLabel?: string;
    licenseNumber: string;
    experienceYears: number;
    verified?: boolean;
    verificationStatus?: "pending" | "approved" | "rejected";
    rating?: number;
    reviewCount?: number;
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

export async function registerDoctor(form: FormData) {
  const { data } = await apiClient.post<{
    pending: boolean;
    email: string;
    message: string;
  }>("/auth/register/doctor", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}

export async function updateAuthProfile(body: { name?: string; phone?: string }) {
  const { data } = await apiClient.patch<{ user: AuthUser }>("/auth/me/profile", body);
  return data.user;
}

export async function fetchSpecialties(): Promise<Specialty[]> {
  try {
    const { data } = await apiClient.get<{ specialties: Specialty[] }>("/auth/specialties");
    if (data.specialties?.length) return data.specialties;
  } catch {
    /* API down or misconfigured VITE_API_URL — use bundled list for registration UI */
  }
  return [...DEFAULT_SPECIALTIES];
}

export async function requestForgotPasswordOtp(email: string) {
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password/request", {
    email,
  });
  return data;
}

export async function resetPasswordWithOtp(body: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password/reset", body);
  return data;
}
