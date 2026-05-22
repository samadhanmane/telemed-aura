import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockPatients } from "@/data/mock/healthcare";

export const Route = createFileRoute("/admin/patients")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Patients — Admin" }] }),
  component: AdminPatients,
});

function AdminPatients() {
  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="Patients" description="Monitor registered patients platform-wide." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {mockPatients.map((p) => (
          <Card key={p.id} className="rounded-2xl p-5 shadow-soft">
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-muted-foreground">
              {p.age}y · {p.gender} · {p.phone}
            </p>
            <p className="mt-2 text-sm">{p.condition}</p>
            <Badge className="mt-2" variant={p.riskLevel === "high" ? "destructive" : "secondary"}>
              {p.riskLevel} risk
            </Badge>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
