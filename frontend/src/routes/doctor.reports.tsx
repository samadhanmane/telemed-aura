import { createFileRoute } from "@tanstack/react-router";
import { FileText, ZoomIn, ZoomOut } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReportStore } from "@/stores/report-store";

export const Route = createFileRoute("/doctor/reports")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Reports — Doctor" }] }),
  component: DoctorReports,
});

function DoctorReports() {
  const reports = useReportStore((s) => s.reports);

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Medical reports" description="Preview PDFs and images with zoom controls." />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {reports.map((r) => (
              <Card key={r.id} className="flex items-center gap-4 rounded-2xl p-4 shadow-soft">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.category} · {r.uploadDate}</p>
                </div>
                <Badge>{r.type}</Badge>
              </Card>
            ))}
          </div>
          <Card className="rounded-2xl p-6 shadow-soft">
            <p className="text-sm font-semibold">Report preview</p>
            <div className="mt-4 flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
              <FileText className="h-16 w-16 text-muted-foreground/50" />
              <p className="mt-2 text-xs text-muted-foreground">Select a report to preview</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
