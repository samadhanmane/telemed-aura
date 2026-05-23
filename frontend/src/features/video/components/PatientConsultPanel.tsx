import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CalendarCheck,
  FileHeart,
  Heart,
  Loader2,
  Pill,
  Stethoscope,
} from "lucide-react";
import type { ApiAppointment } from "@/lib/api/appointments";
import { useAppointments } from "@/lib/api/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { fetchMyEmr, recordMyVitals } from "@/lib/api/emr";
import { fetchAppointment } from "@/lib/api/clinical";
import { isAppointmentInPast } from "@/lib/appointment-slots";

function vitalsLine(v: {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  sugarLevel?: number;
  oxygenLevel?: number;
}) {
  const parts: string[] = [];
  if (v.bloodPressureSystolic != null && v.bloodPressureDiastolic != null) {
    parts.push(`BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`);
  }
  if (v.sugarLevel != null) parts.push(`Sugar ${v.sugarLevel}`);
  if (v.oxygenLevel != null) parts.push(`SpO₂ ${v.oxygenLevel}%`);
  return parts.join(" · ") || "—";
}

export function PatientConsultPanel({
  appointmentId,
  doctorName,
  specialization,
  scheduledFollowUp,
}: {
  appointmentId: string;
  doctorName: string;
  specialization: string;
  scheduledFollowUp?: ApiAppointment | null;
}) {
  const qc = useQueryClient();
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    sugarLevel: "",
    oxygenLevel: "",
  });

  const { data: emrData, isLoading } = useQuery({
    queryKey: ["my-emr"],
    queryFn: fetchMyEmr,
  });

  const { data: appointment } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => fetchAppointment(appointmentId),
  });

  const { data: appointments = [] } = useAppointments();

  const doctorId = appointment?.doctorId;
  const upcomingWithDoctor = appointments
    .filter(
      (a) =>
        a.doctorId === doctorId &&
        a.id !== appointmentId &&
        (a.status === "confirmed" || a.status === "pending"),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const followUpCandidate = scheduledFollowUp ?? upcomingWithDoctor[0] ?? null;
  const followUpDisplay =
    followUpCandidate && !isAppointmentInPast(followUpCandidate.date, followUpCandidate.time)
      ? followUpCandidate
      : null;

  const saveVitals = useMutation({
    mutationFn: () =>
      recordMyVitals({
        bloodPressureSystolic: vitals.bloodPressureSystolic
          ? Number(vitals.bloodPressureSystolic)
          : undefined,
        bloodPressureDiastolic: vitals.bloodPressureDiastolic
          ? Number(vitals.bloodPressureDiastolic)
          : undefined,
        sugarLevel: vitals.sugarLevel ? Number(vitals.sugarLevel) : undefined,
        oxygenLevel: vitals.oxygenLevel ? Number(vitals.oxygenLevel) : undefined,
      }),
    onSuccess: () => {
      toast.success("Vitals saved to your health record");
      qc.invalidateQueries({ queryKey: ["my-emr"] });
    },
    onError: () => toast.error("Could not save vitals"),
  });

  const emr = emrData?.emr;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3">
        <p className="text-sm font-semibold">Your health chart</p>
        <p className="text-xs text-muted-foreground">
          View-only during call · updates after visit
        </p>
      </div>

      <Card className="mb-3 rounded-xl border-primary/20 bg-primary/5 p-3">
        <div className="flex items-start gap-2">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">{doctorName}</p>
            <p className="text-xs text-muted-foreground">{specialization}</p>
            {appointment && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Today: {appointment.date} · {appointment.time}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {appointment.status}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </Card>

      {followUpDisplay && (
        <Card className="mb-3 rounded-xl border-success/40 bg-success/10 p-3">
          <div className="flex items-start gap-2">
            <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-success">Follow-up scheduled</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Dr. {followUpDisplay.doctorName ?? doctorName} booked your next visit:
              </p>
              <p className="mt-1 text-sm font-medium">
                {followUpDisplay.date} at {followUpDisplay.time}
              </p>
              <Badge variant="secondary" className="mt-2 text-[10px]">
                {followUpDisplay.status}
              </Badge>
              <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" asChild>
                <Link to="/patient/appointments">View in My appointments</Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-3 min-h-0 flex-1">
          <ScrollArea className="h-[min(42vh,380px)]">
            <div className="space-y-3 pr-2">
              {emr?.profile && (
                <div className="rounded-xl border border-border/60 p-3 text-sm">
                  <p className="font-medium flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> Profile
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {emr.profile.age != null ? `${emr.profile.age} yrs` : "Age —"}
                    {emr.profile.gender ? ` · ${emr.profile.gender}` : ""}
                  </p>
                  {emr.profile.allergies.length > 0 && (
                    <p className="mt-1 text-xs text-destructive">
                      Allergies: {emr.profile.allergies.join(", ")}
                    </p>
                  )}
                  {emr.profile.chronicDiseases.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Chronic: {emr.profile.chronicDiseases.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {emr?.latestVitals && (
                <div className="rounded-xl border border-border/60 p-3 text-sm">
                  <p className="font-medium flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" /> Latest vitals
                  </p>
                  <p className="mt-1">{vitalsLine(emr.latestVitals)}</p>
                </div>
              )}

              {emr?.consultations?.[0] && (
                <div className="rounded-xl border border-border/60 p-3 text-sm">
                  <p className="font-medium">Last consultation</p>
                  <p className="text-xs text-muted-foreground">
                    {emr.consultations[0].doctorName} · {emr.consultations[0].date}
                  </p>
                  <p className="mt-1 line-clamp-3 text-muted-foreground">
                    {emr.consultations[0].conclusion || emr.consultations[0].clinicalRemarks}
                  </p>
                </div>
              )}

              {emr?.prescriptions?.[0] && (
                <div className="rounded-xl border border-border/60 p-3 text-sm">
                  <p className="font-medium flex items-center gap-1">
                    <Pill className="h-3.5 w-3.5" /> Latest prescription
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {emr.prescriptions[0].medicines.map((m) => m.name).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="vitals" className="mt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Share current vitals with your doctor during the call.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">BP sys</Label>
              <Input
                type="number"
                placeholder="120"
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
                placeholder="80"
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
              <Label className="text-xs">SpO₂ %</Label>
              <Input
                type="number"
                value={vitals.oxygenLevel}
                onChange={(e) => setVitals((v) => ({ ...v, oxygenLevel: e.target.value }))}
              />
            </div>
          </div>
          <Button
            className="mt-3 w-full"
            size="sm"
            onClick={() => saveVitals.mutate()}
            disabled={saveVitals.isPending}
          >
            Save to EMR
          </Button>
        </TabsContent>

        <TabsContent value="history" className="mt-3 min-h-0 flex-1">
          <ScrollArea className="h-[min(42vh,380px)]">
            <ul className="space-y-2 pr-2 text-sm">
              {emr?.timeline?.slice(0, 12).map((item) => (
                <li key={`${item.type}-${item.id}`} className="rounded-lg border border-border/40 px-2 py-1.5">
                  <p className="font-medium text-xs">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                </li>
              ))}
              {!emr?.timeline?.length && (
                <li className="text-muted-foreground text-xs">No history yet.</li>
              )}
            </ul>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
        <Link to="/patient/emr">
          <FileHeart className="mr-2 h-4 w-4" />
          Open full EMR
        </Link>
      </Button>
    </div>
  );
}
