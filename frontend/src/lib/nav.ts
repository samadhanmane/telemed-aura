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
  Activity,
  UserCircle,
  BarChart3,
  Clock,
  Brain,
  ClipboardList,
  FolderHeart,
} from "lucide-react";
import type { UserRole } from "@/types/healthcare";

export type NavItem = {
  to: string;
  labelKey: string;
  /** Resolved label after i18n — set by useTranslatedNav */
  label?: string;
  icon: typeof LayoutDashboard;
};

export const patientNav: NavItem[] = [
  { to: "/patient", labelKey: "nav.patient.dashboard", icon: LayoutDashboard },
  { to: "/patient/appointments", labelKey: "nav.patient.appointments", icon: CalendarCheck },
  { to: "/patient/doctors", labelKey: "nav.patient.doctors", icon: Stethoscope },
  { to: "/patient/ai-scanner", labelKey: "nav.patient.aiHealth", icon: Sparkles },
  { to: "/patient/emr", labelKey: "nav.patient.emr", icon: FolderHeart },
  { to: "/patient/doc-assistant", labelKey: "nav.patient.docAssistant", icon: Brain },
  { to: "/patient/timeline", labelKey: "nav.patient.timeline", icon: Activity },
  { to: "/patient/analytics", labelKey: "nav.patient.analytics", icon: BarChart3 },
  { to: "/patient/notifications", labelKey: "nav.patient.notifications", icon: Bell },
  { to: "/patient/settings", labelKey: "nav.patient.settings", icon: Settings },
];

export const doctorNav: NavItem[] = [
  { to: "/doctor", labelKey: "nav.doctor.dashboard", icon: LayoutDashboard },
  { to: "/doctor/appointments", labelKey: "nav.doctor.appointments", icon: CalendarCheck },
  { to: "/doctor/patients", labelKey: "nav.doctor.patients", icon: Users },
  { to: "/doctor/prescriptions", labelKey: "nav.doctor.prescriptions", icon: Pill },
  { to: "/doctor/reports", labelKey: "nav.doctor.reports", icon: FileText },
  { to: "/doctor/availability", labelKey: "nav.doctor.availability", icon: Clock },
  { to: "/doctor/analytics", labelKey: "nav.doctor.analytics", icon: BarChart3 },
  { to: "/doctor/notifications", labelKey: "nav.doctor.notifications", icon: Bell },
  { to: "/doctor/settings", labelKey: "nav.doctor.settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { to: "/admin", labelKey: "nav.admin.dashboard", icon: LayoutDashboard },
  { to: "/admin/users", labelKey: "nav.admin.users", icon: Users },
  { to: "/admin/doctors", labelKey: "nav.admin.doctors", icon: Stethoscope },
  { to: "/admin/patients", labelKey: "nav.admin.patients", icon: UserCircle },
  { to: "/admin/appointments", labelKey: "nav.admin.appointments", icon: CalendarCheck },
  { to: "/admin/reports", labelKey: "nav.admin.reports", icon: ClipboardList },
  { to: "/admin/analytics", labelKey: "nav.admin.analytics", icon: BarChart3 },
  { to: "/admin/ai-monitoring", labelKey: "nav.admin.aiMonitoring", icon: Brain },
  { to: "/admin/notifications", labelKey: "nav.admin.notifications", icon: Bell },
  { to: "/admin/settings", labelKey: "nav.admin.settings", icon: Settings },
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

export function getRoleTitleKey(role: UserRole): string {
  switch (role) {
    case "doctor":
      return "nav.role.doctor";
    case "admin":
      return "nav.role.admin";
    default:
      return "nav.role.patient";
  }
}

export function getMobileNav(role: UserRole): NavItem[] {
  switch (role) {
    case "doctor":
      return doctorNav.filter((n) =>
        ["/doctor", "/doctor/appointments", "/doctor/patients", "/doctor/notifications"].includes(
          n.to,
        ),
      );
    case "admin":
      return adminNav.filter((n) =>
        ["/admin", "/admin/doctors", "/admin/patients", "/admin/notifications"].includes(n.to),
      );
    default:
      return patientNav.filter((n) =>
        [
          "/patient",
          "/patient/appointments",
          "/patient/doctors",
          "/patient/ai-scanner",
          "/patient/notifications",
        ].includes(n.to),
      );
  }
}
