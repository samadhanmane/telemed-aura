import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: () => (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="Admin settings" />
      <div className="mt-6">
        <SettingsForm />
      </div>
    </DashboardShell>
  ),
});
