import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AppointmentStatusBadge } from "@/components/dashboard/AppointmentStatusBadge";
import { Card } from "@/components/ui/card";
import { fetchAppointments } from "@/lib/api/appointments";
import type { AppointmentStatus } from "@/types/healthcare";

export const Route = createFileRoute("/admin/appointments")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Appointments — Admin" }] }),
  component: AdminAppointments,
});

function AdminAppointments() {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader
        title="Appointment monitoring"
        description={`${appointments.length} total · ${cancelled} cancelled`}
      />
      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
      <div className="mt-6 space-y-3">
        {appointments.map((a) => (
          <Card key={a.id} className="flex flex-wrap items-center justify-between rounded-2xl p-4 shadow-soft">
            <div>
              <p className="font-semibold">
                {a.patientName ?? "Patient"} → {a.doctorName}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.date} {a.time} · {a.specialization}
              </p>
            </div>
            <AppointmentStatusBadge status={a.status as AppointmentStatus} />
          </Card>
        ))}
        {!isLoading && appointments.length === 0 && (
          <p className="text-sm text-muted-foreground">No appointments in the system yet.</p>
        )}
      </div>
    </DashboardShell>
  );
}
