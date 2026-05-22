import { createFileRoute, Link } from "@tanstack/react-router";
import { Video } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AppointmentStatusBadge } from "@/components/dashboard/AppointmentStatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppointments, useUpdateAppointmentStatus } from "@/lib/api/hooks/use-appointments";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor/appointments")({
  beforeLoad: () => requireRole("doctor"),
  component: DoctorAppointments,
});

function DoctorAppointments() {
  const { data: appointments = [], isLoading } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();

  const handleStatus = async (id: string, status: "confirmed" | "cancelled" | "in_progress") => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Appointment ${status}`);
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <PageHeader title="Appointments" description="Confirm requests and manage your queue." />
      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
      <div className="mt-6 space-y-3">
        {appointments.map((a) => (
          <Card key={a.id} className="rounded-2xl p-5 shadow-soft">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="font-semibold">{a.patientName ?? "Patient"}</p>
                <p className="text-xs text-muted-foreground">
                  {a.specialization} · {a.date} {a.time}
                </p>
              </div>
              <AppointmentStatusBadge status={a.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {a.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => handleStatus(a.id, "confirmed")}>
                    Confirm
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatus(a.id, "cancelled")}>
                    Decline
                  </Button>
                </>
              )}
              {a.status === "confirmed" && (
                <>
                  <Button size="sm" onClick={() => handleStatus(a.id, "in_progress")}>
                    Start consult
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/doctor/consult/$appointmentId" params={{ appointmentId: a.id }}>
                      <Video className="mr-1 h-4 w-4" /> Join video
                    </Link>
                  </Button>
                </>
              )}
              {a.status === "in_progress" && (
                <Button size="sm" asChild>
                  <Link to="/doctor/consult/$appointmentId" params={{ appointmentId: a.id }}>
                    <Video className="mr-1 h-4 w-4" /> Join video
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
