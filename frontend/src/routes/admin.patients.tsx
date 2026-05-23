import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAdminPatients } from "@/lib/api/dashboard";

export const Route = createFileRoute("/admin/patients")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Patients — Admin" }] }),
  component: AdminPatients,
});

type AdminPatient = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  healthScore: number;
  condition: string;
  riskLevel: string;
};

function AdminPatients() {
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: fetchAdminPatients,
  });

  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="Patients" description="Monitor registered patients platform-wide." />
      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(patients as AdminPatient[]).map((p) => (
          <Card key={p.id} className="rounded-2xl p-5 shadow-soft">
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-muted-foreground">
              {p.phone ?? "—"} · {p.location ?? "—"} · score {p.healthScore}
            </p>
            <p className="mt-2 text-sm">{p.condition}</p>
            <Badge className="mt-2" variant={p.riskLevel === "high" ? "destructive" : "secondary"}>
              {p.riskLevel} risk
            </Badge>
          </Card>
        ))}
      </div>
      {!isLoading && patients.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No patients registered yet.</p>
      )}
    </DashboardShell>
  );
}
