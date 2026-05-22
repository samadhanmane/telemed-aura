import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockDoctors } from "@/data/mock/healthcare";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/doctors")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Doctors — Admin" }] }),
  component: AdminDoctors,
});

function AdminDoctors() {
  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="Doctor management" description="Verification, licenses, and performance." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {mockDoctors.map((d) => (
          <Card key={d.id} className="rounded-2xl p-5 shadow-soft">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.specialization} · {d.experience}</p>
              </div>
              <Badge className="bg-success/15 text-success">Verified</Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">★ {d.rating} · {d.fee} · {d.availability}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toast.info("License review opened")}>
                Review license
              </Button>
              <Button size="sm" variant="ghost">
                Metrics
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
