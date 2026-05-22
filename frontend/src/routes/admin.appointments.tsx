import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AppointmentStatusBadge } from "@/components/dashboard/AppointmentStatusBadge";
import { Card } from "@/components/ui/card";
import { useAppointmentStore } from "@/stores/appointment-store";

export const Route = createFileRoute("/admin/appointments")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Appointments — Admin" }] }),
  component: AdminAppointments,
});

function AdminAppointments() {
  const appointments = useAppointmentStore((s) => s.appointments);
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="Appointment monitoring" description={`${cancelled} cancellations in dataset`} />
      <div className="mt-6 space-y-3">
        {appointments.map((a) => (
          <Card key={a.id} className="flex flex-wrap items-center justify-between rounded-2xl p-4 shadow-soft">
            <div>
              <p className="font-semibold">
                {a.patientName ?? "Patient"} → {a.doctorName}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.date} {a.time} · {a.fee}
              </p>
            </div>
            <AppointmentStatusBadge status={a.status} />
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
