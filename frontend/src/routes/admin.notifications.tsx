import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchNotifications } from "@/lib/api/notifications";
import { fetchAdminDashboard } from "@/lib/api/dashboard";

export const Route = createFileRoute("/admin/notifications")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Notifications — Admin" }] }),
  component: AdminNotifications,
});

function AdminNotifications() {
  const { data: list = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });
  const { data: dash } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
  });

  const critical = (dash?.criticalAlerts as { id: string; risk: number; symptoms: string }[]) ?? [];

  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader
        title="System notifications"
        description="Your admin inbox and platform emergency alerts."
      />

      {critical.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-destructive">AI emergency cases</h3>
          {critical.map((a) => (
            <Card key={a.id} className="rounded-2xl border-destructive/30 p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Emergency</Badge>
                <span className="text-xs text-muted-foreground">Risk {a.risk}%</span>
              </div>
              <p className="mt-2 text-sm">{a.symptoms}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold">Inbox</h3>
        {list.map((n) => (
          <Card key={n.id} className="rounded-2xl p-4 shadow-soft">
            <p className="font-semibold">{n.title}</p>
            <p className="text-xs text-muted-foreground">{n.message}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{n.time}</p>
          </Card>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No personal notifications. Emergency cases appear above when patients trigger AI alerts.
          </p>
        )}
      </div>
    </DashboardShell>
  );
}
