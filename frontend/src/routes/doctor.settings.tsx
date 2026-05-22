import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const Route = createFileRoute("/doctor/settings")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Settings — Doctor" }] }),
  component: () => (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <PageHeader title="Settings" />
      <div className="mt-6">
        <SettingsForm />
      </div>
    </DashboardShell>
  ),
});
