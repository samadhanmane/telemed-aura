import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const Route = createFileRoute("/patient/settings")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Settings — Patient" }] }),
  component: PatientSettings,
});

function PatientSettings() {
  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <PageHeader title="Settings" description="Profile, security, and preferences." />
      <div className="mt-6">
        <SettingsForm />
      </div>
    </DashboardShell>
  );
}
