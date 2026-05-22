import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  Pill,
  Sparkles,
  Bell,
  Settings,
  Stethoscope,
  Users,
  Video,
  Activity,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

export const patientNav: NavItem[] = [
  { to: "/patient", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patient/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/patient/reports", label: "Medical Reports", icon: FileText },
  { to: "/patient/prescriptions", label: "Prescriptions", icon: Pill },
  { to: "/patient/ai-scanner", label: "AI Symptom Scanner", icon: Sparkles },
  { to: "/patient/notifications", label: "Notifications", icon: Bell },
  { to: "/patient/settings", label: "Settings", icon: Settings },
];

export const doctorNav: NavItem[] = [
  { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
  { to: "/doctor/queue", label: "Appointment Queue", icon: CalendarCheck },
  { to: "/doctor/patients", label: "Patients", icon: Users },
  { to: "/doctor/consultations", label: "Consultations", icon: Video },
  { to: "/doctor/settings", label: "Settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: Activity },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
];
