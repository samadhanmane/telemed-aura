import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/reports")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
  component: AdminReports,
});

const issues = [
  { id: 1, type: "Abuse", user: "anonymous@mail.com", status: "open", date: "May 21" },
  { id: 2, type: "Complaint", user: "user@example.com", status: "reviewing", date: "May 20" },
  { id: 3, type: "Emergency", user: "pat-002", status: "resolved", date: "May 19" },
];

function AdminReports() {
  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="Reports & issues" description="Abuse reports, complaints, and emergency alerts." />
      <div className="mt-6 space-y-3">
        {issues.map((i) => (
          <Card key={i.id} className="flex flex-wrap items-center justify-between rounded-2xl p-4 shadow-soft">
            <div>
              <p className="font-semibold">{i.type}</p>
              <p className="text-xs text-muted-foreground">{i.user} · {i.date}</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-muted-foreground">{i.status}</span>
              <Button size="sm" variant="outline">
                Review
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
