import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Video } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AppointmentStatusBadge } from "@/components/dashboard/AppointmentStatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppointments, useUpdateAppointmentStatus } from "@/lib/api/hooks/use-appointments";
import type { ApiAppointment } from "@/lib/api/appointments";
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
                <>
                  <Button size="sm" asChild>
                    <Link to="/doctor/consult/$appointmentId" params={{ appointmentId: a.id }}>
                      <Video className="mr-1 h-4 w-4" /> Join video
                    </Link>
                  </Button>
                  <MarkCompletedButton appointment={a} />
                </>
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

function MarkCompletedButton({ appointment }: { appointment: ApiAppointment }) {
  const updateStatus = useUpdateAppointmentStatus();
  const [conclusion, setConclusion] = useState("");
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    sugarLevel: "",
    oxygenLevel: "",
  });

  const handleComplete = async () => {
    try {
      await updateStatus.mutateAsync({
        id: appointment.id,
        status: "completed",
        conclusion: conclusion.trim() || undefined,
        vitals: {
          bloodPressureSystolic: vitals.bloodPressureSystolic
            ? Number(vitals.bloodPressureSystolic)
            : undefined,
          bloodPressureDiastolic: vitals.bloodPressureDiastolic
            ? Number(vitals.bloodPressureDiastolic)
            : undefined,
          sugarLevel: vitals.sugarLevel ? Number(vitals.sugarLevel) : undefined,
          oxygenLevel: vitals.oxygenLevel ? Number(vitals.oxygenLevel) : undefined,
        },
      });
      toast.success("Consultation marked completed");
      setConclusion("");
      setVitals({
        bloodPressureSystolic: "",
        bloodPressureDiastolic: "",
        sugarLevel: "",
        oxygenLevel: "",
      });
    } catch {
      toast.error("Could not complete consultation");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Mark completed
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete consultation?</AlertDialogTitle>
          <AlertDialogDescription>
            This ends the video visit for {appointment.patientName ?? "the patient"}. They cannot
            rejoin until a new appointment is booked. Conclusion and vitals are saved to the EMR.
          </AlertDialogDescription>
          <div className="space-y-3 py-2 text-left">
            <div>
              <Label>Consultation conclusion</Label>
              <Textarea
                placeholder="Diagnosis summary, advice, follow-up plan…"
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">BP sys</Label>
                <Input
                  type="number"
                  value={vitals.bloodPressureSystolic}
                  onChange={(e) =>
                    setVitals((v) => ({ ...v, bloodPressureSystolic: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">BP dia</Label>
                <Input
                  type="number"
                  value={vitals.bloodPressureDiastolic}
                  onChange={(e) =>
                    setVitals((v) => ({ ...v, bloodPressureDiastolic: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Sugar</Label>
                <Input
                  type="number"
                  value={vitals.sugarLevel}
                  onChange={(e) => setVitals((v) => ({ ...v, sugarLevel: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">SpO₂</Label>
                <Input
                  type="number"
                  value={vitals.oxygenLevel}
                  onChange={(e) => setVitals((v) => ({ ...v, oxygenLevel: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleComplete} disabled={updateStatus.isPending}>
            Mark completed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
