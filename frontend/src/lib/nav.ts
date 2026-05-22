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
  UserCircle,
  BarChart3,
  Clock,
  Brain,
  Shield,
  ClipboardList,
} from "lucide-react";
import type { UserRole } from "@/types/healthcare";

export type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

export const patientNav: NavItem[] = [
  { to: "/patient", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patient/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/patient/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/patient/ai-scanner", label: "AI Health Scanner", icon: Sparkles },
  { to: "/patient/reports", label: "Medical Reports", icon: FileText },
  { to: "/patient/prescriptions", label: "Prescriptions", icon: Pill },
  { to: "/patient/notifications", label: "Notifications", icon: Bell },
  { to: "/patient/settings", label: "Settings", icon: Settings },
];

export const doctorNav: NavItem[] = [
  { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
  { to: "/doctor/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/doctor/patients", label: "Patients", icon: Users },
  { to: "/doctor/prescriptions", label: "Prescriptions", icon: Pill },
  { to: "/doctor/reports", label: "Reports", icon: FileText },
  { to: "/doctor/availability", label: "Availability", icon: Clock },
  { to: "/doctor/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/doctor/notifications", label: "Notifications", icon: Bell },
  { to: "/doctor/settings", label: "Settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/admin/patients", label: "Patients", icon: UserCircle },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/admin/reports", label: "Reports", icon: ClipboardList },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/ai-monitoring", label: "AI Monitoring", icon: Brain },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "doctor":
      return doctorNav;
    case "admin":
      return adminNav;
    default:
      return patientNav;
  }
}

export function getRoleTitle(role: UserRole): string {
  switch (role) {
    case "doctor":
      return "Doctor";
    case "admin":
      return "Admin";
    default:
      return "Patient";
  }
}

/** Mobile bottom nav — key items per role */
export function getMobileNav(role: UserRole): NavItem[] {
  switch (role) {
    case "doctor":
      return doctorNav.filter((n) =>
        ["/doctor", "/doctor/appointments", "/doctor/patients", "/doctor/settings"].includes(n.to),
      );
    case "admin":
      return adminNav.filter((n) =>
        ["/admin", "/admin/users", "/admin/analytics", "/admin/settings"].includes(n.to),
      );
    default:
      return patientNav.filter((n) =>
        ["/patient", "/patient/appointments", "/patient/ai-scanner", "/patient/settings"].includes(n.to),
      );
  }
}

export { Activity, Video, Shield };
