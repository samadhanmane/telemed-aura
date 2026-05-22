export type UserRole = "patient" | "doctor" | "admin";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: string;
  healthScore?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  mode: "video" | "in-person";
  status: AppointmentStatus;
  fee: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  fee: string;
  availability: string;
  image?: string;
}

export interface Prescription {
  id: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  patientId?: string;
  patientName?: string;
  date: string;
  medicines: Medicine[];
  instructions: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface MedicalReport {
  id: string;
  name: string;
  type: "PDF" | "PNG" | "JPG";
  uploadDate: string;
  doctorName: string;
  category: string;
  patientId?: string;
}

export interface Notification {
  id: string;
  type: "appointment" | "prescription" | "message" | "ai_alert" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  lastVisit: string;
  condition: string;
  riskLevel: "low" | "medium" | "high";
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "suspended" | "pending";
  verified: boolean;
  joined: string;
}

export interface AiScanResult {
  risk: number;
  severity: "Low" | "Moderate" | "High";
  suggestedSpecialist: string;
  bodyArea?: string;
}
