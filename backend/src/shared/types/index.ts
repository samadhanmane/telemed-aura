export type UserRole = "patient" | "doctor" | "admin";

export type SeverityLevel = "low" | "moderate" | "high" | "critical";

export interface ApiUser {
  id: string;
  email: string;
  role: UserRole;
}
