import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/notifications")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Notifications — Admin" }] }),
  component: AdminNotifications,
});

const alerts = [
  { title: "System alert", message: "Database backup completed successfully", time: "1h ago" },
  { title: "Abuse report", message: "New report #1042 requires review", time: "3h ago" },
  { title: "Emergency", message: "AI urgent case flagged in Bihar region", time: "5h ago" },
];

function AdminNotifications() {
  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="System notifications" />
      <div className="mt-6 space-y-3">
        {alerts.map((a, i) => (
          <Card key={i} className="rounded-2xl p-4 shadow-soft">
            <p className="font-semibold">{a.title}</p>
            <p className="text-xs text-muted-foreground">{a.message}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{a.time}</p>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
