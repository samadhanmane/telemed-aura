import { createFileRoute, Link } from "@tanstack/react-router";
import { Video } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AppointmentStatusBadge } from "@/components/dashboard/AppointmentStatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppointments } from "@/lib/api/hooks/use-appointments";

export const Route = createFileRoute("/patient/appointments")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Appointments — Patient" }] }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const { data: appointments = [], isLoading } = useAppointments();

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="My appointments"
          description="Video consultations — join when confirmed."
          action={
            <Button asChild className="bg-gradient-primary text-primary-foreground">
              <Link to="/patient/doctors">Book new</Link>
            </Button>
          }
        />

        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}

        <div className="mt-6 space-y-4">
          {appointments.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">No appointments yet. Book a doctor by category.</p>
          )}
          {appointments.map((a) => (
            <Card key={a.id} className="rounded-2xl p-5 shadow-soft">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="font-semibold">{a.doctorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.specialization} · {a.date} at {a.time} · {a.fee}
                  </p>
                </div>
                <AppointmentStatusBadge status={a.status} />
              </div>
              {(a.status === "confirmed" || a.status === "in_progress") && (
                <Button size="sm" className="mt-4" asChild>
                  <Link to="/patient/consult/$appointmentId" params={{ appointmentId: a.id }}>
                    <Video className="mr-1 h-4 w-4" /> Join consultation
                  </Link>
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
