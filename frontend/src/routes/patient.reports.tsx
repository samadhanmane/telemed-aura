import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { useReports } from "@/lib/api/hooks/use-reports";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download } from "lucide-react";

export const Route = createFileRoute("/patient/reports")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Medical Reports" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: reports = [] } = useReports();
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const filtered =
    typeFilter === "All" ? reports : reports.filter((r) => r.type === typeFilter);

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Medical Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">Upload, preview and share your reports securely.</p>
          </div>
          <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Upload className="mr-2 h-4 w-4" /> Upload report
          </Button>
        </div>

        <div className="mt-4 flex gap-2">
          {["All", "PDF", "PNG", "JPG"].map((t) => (
            <Badge
              key={t}
              variant={typeFilter === t ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </Badge>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} className="group rounded-2xl border-border/60 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <Badge variant="secondary">{r.type}</Badge>
              </div>
              <div className="mt-4 text-sm font-semibold">{r.name}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {r.category} · {r.uploadDate} · {r.doctorName}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Preview</Button>
                <Button size="sm" variant="ghost" aria-label="Download"><Download className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
