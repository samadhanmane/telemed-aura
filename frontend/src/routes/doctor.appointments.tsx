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
import { isAppointmentInPast } from "@/lib/appointment-slots";
import { DoctorTriagePanel } from "@/components/doctor/DoctorTriagePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <PageHeader
        title="Appointments & triage"
        description="Priority queue when you have many patients — critical cases first, urgent booking, reschedule."
      />

      <Tabs defaultValue="triage" className="mt-6">
        <TabsList>
          <TabsTrigger value="triage">Priority triage</TabsTrigger>
          <TabsTrigger value="all">All appointments</TabsTrigger>
        </TabsList>
        <TabsContent value="triage" className="mt-4">
          <DoctorTriagePanel />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="space-y-3">
        {appointments.map((a) => {
          const past = isAppointmentInPast(a.date, a.time);
          return (
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
              {!past && a.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => handleStatus(a.id, "confirmed")}>
                    Confirm
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatus(a.id, "cancelled")}>
                    Decline
                  </Button>
                </>
              )}
              {!past && a.status === "confirmed" && (
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
              {!past && a.status === "in_progress" && (
                <Button size="sm" asChild>
                  <Link to="/doctor/consult/$appointmentId" params={{ appointmentId: a.id }}>
                    <Video className="mr-1 h-4 w-4" /> Join video
                  </Link>
                </Button>
              )}
              {past && a.status !== "completed" && a.status !== "cancelled" && (
                <p className="text-xs text-muted-foreground">Scheduled time has passed.</p>
              )}
            </div>
          </Card>
        );
        })}
      </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
