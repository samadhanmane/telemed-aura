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
import { RateConsultationDialog } from "@/components/consult/RateConsultationDialog";
import { isAppointmentInPast } from "@/lib/appointment-slots";

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
          description="Book a slot, then join the video call at your scheduled date and time once the doctor confirms."
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
          {appointments.map((a) => {
            const past = isAppointmentInPast(a.date, a.time);
            return (
            <Card key={a.id} className="rounded-2xl p-5 shadow-soft">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="font-semibold">{a.doctorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.specialization} · {a.date} at {a.time}
                  </p>
                  {a.status === "confirmed" && (
                    <p className="mt-1 text-[10px] text-success">Confirmed — join at scheduled time</p>
                  )}
                </div>
                <AppointmentStatusBadge status={a.status} />
              </div>
              {a.status === "pending" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Waiting for doctor confirmation — you can join at {a.date}, {a.time} after that.
                </p>
              )}
              {(a.status === "confirmed" || a.status === "in_progress") && !past && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Join at your scheduled time: {a.date}, {a.time}
                  </p>
                  <Button size="sm" asChild>
                    <Link to="/patient/consult/$appointmentId" params={{ appointmentId: a.id }}>
                      <Video className="mr-1 h-4 w-4" /> Join video consultation
                    </Link>
                  </Button>
                </div>
              )}
              {past && a.status !== "completed" && a.status !== "cancelled" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  This slot has passed — book a new appointment to consult again.
                </p>
              )}
              {a.status === "completed" && (
                <RateConsultationDialog appointmentId={a.id} doctorName={a.doctorName} />
              )}
            </Card>
          );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
