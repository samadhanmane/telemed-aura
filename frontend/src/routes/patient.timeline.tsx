import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  FileText,
  Pill,
  Sparkles,
  Activity,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchPatientTimeline } from "@/lib/api/dashboard";

export const Route = createFileRoute("/patient/timeline")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Health Timeline — Patient" }] }),
  component: TimelinePage,
});

const iconMap: Record<string, typeof Activity> = {
  appointment: CalendarCheck,
  prescription: Pill,
  report: FileText,
  ai_scan: Sparkles,
};

function TimelinePage() {
  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ["patient-timeline"],
    queryFn: fetchPatientTimeline,
  });

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Health history timeline"
          description="Consultations, reports, prescriptions, and AI analysis in one place."
        />

        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading timeline…</p>}

        <div className="relative mt-8 space-y-0">
          <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />
          {timeline.map((e) => {
            const Icon = iconMap[e.type] ?? Activity;
            return (
              <div key={e.id} className="relative flex gap-4 pb-8 pl-2">
                <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-background shadow-sm">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <Card className="flex-1 rounded-2xl border-border/60 p-4 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold">{e.title}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {e.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{e.subtitle}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(e.date).toLocaleString()}
                  </p>
                </Card>
              </div>
            );
          })}
        </div>

        {!isLoading && timeline.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Your health timeline will appear after bookings, scans, and uploads.
          </p>
        )}
      </div>
    </DashboardShell>
  );
}
