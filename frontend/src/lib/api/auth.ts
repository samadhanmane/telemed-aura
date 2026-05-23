import { apiClient, extractResponseData } from "./client";
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
  const res = await apiClient.post("/auth/login", { email, password });
  return extractResponseData<{ user: AuthUser; token: string }>(res);
}

export async function register(payload: Record<string, unknown>) {
  const res = await apiClient.post("/auth/register", payload);
  return extractResponseData<{ user: AuthUser; token: string }>(res);
}

export async function registerDoctor(form: FormData) {
  const res = await apiClient.post("/auth/register/doctor", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return extractResponseData<{
    pending: boolean;
    email: string;
    message: string;
  }>(res);
}

export async function fetchMe() {
  const res = await apiClient.get("/auth/me");
  const data = extractResponseData<{ user: AuthUser }>(res);
  return data.user;
}

export async function updateAuthProfile(body: { name?: string; phone?: string }) {
  const res = await apiClient.patch("/auth/me/profile", body);
  const data = extractResponseData<{ user: AuthUser }>(res);
  return data.user;
}

export async function fetchSpecialties(): Promise<Specialty[]> {
  try {
    const res = await apiClient.get("/auth/specialties");
    const data = extractResponseData<{ specialties: Specialty[] }>(res);
    if (data.specialties?.length) return data.specialties;
  } catch {
    /* API down or misconfigured VITE_API_URL — use bundled list for registration UI */
  }
  return [...DEFAULT_SPECIALTIES];
}

export async function requestForgotPasswordOtp(email: string) {
  const res = await apiClient.post("/auth/forgot-password/request", { email });
  return extractResponseData<{ message: string }>(res);
}

export async function resetPasswordWithOtp(body: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  const res = await apiClient.post("/auth/forgot-password/reset", body);
  return extractResponseData<{ message: string }>(res);
}
