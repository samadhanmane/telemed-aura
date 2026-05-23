import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { EmrView } from "@/components/emr/EmrView";
import {
  CalendarPlus,
  ClipboardList,
  ExternalLink,
  Loader2,
  Pill,
  Save,
  StickyNote,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  createConsultPrescription,
  saveClinicalNote,
  scheduleFollowUp,
  type ClinicalMedicine,
} from "@/lib/api/clinical";
import { fetchPatientEmrForDoctor } from "@/lib/api/emr";
import { getApiErrorMessage } from "@/lib/api/client";
import { fetchDoctorSlots } from "@/lib/api/doctors";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiAppointment } from "@/lib/api/appointments";
import { format } from "date-fns";
import { getTodayDateString, isDateBeforeToday } from "@/lib/appointment-slots";

export function DoctorConsultPanel({
  patientId,
  appointmentId,
  patientName,
  onFollowUpScheduled,
}: {
  patientId: string;
  appointmentId: string;
  patientName: string;
  onFollowUpScheduled?: (appointment: ApiAppointment) => void;
}) {
  const doctorId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const [noteDraft, setNoteDraft] = useState("");
  const [followDate, setFollowDate] = useState(getTodayDateString());
  const [followTime, setFollowTime] = useState("");
  const [lastBooked, setLastBooked] = useState<ApiAppointment | null>(null);
  const [meds, setMeds] = useState<ClinicalMedicine[]>([
    { name: "", dosage: "", frequency: "", duration: "" },
  ]);
  const [rxInstructions, setRxInstructions] = useState("");

  const emrQueryKey = ["patient-emr", patientId] as const;

  const { data: emrData, isLoading, refetch } = useQuery({
    queryKey: emrQueryKey,
    queryFn: () => fetchPatientEmrForDoctor(patientId),
    enabled: !!patientId,
  });

  useEffect(() => {
    if (emrData?.doctorClinicalNote?.content != null) {
      setNoteDraft(emrData.doctorClinicalNote.content);
    }
  }, [emrData?.doctorClinicalNote?.content]);

  const saveNoteMutation = useMutation({
    mutationFn: () =>
      saveClinicalNote(patientId, { content: noteDraft, appointmentId }),
    onSuccess: () => {
      toast.success("Clinical notes saved");
      queryClient.invalidateQueries({ queryKey: emrQueryKey });
    },
    onError: () => toast.error("Could not save notes"),
  });

  const rxMutation = useMutation({
    mutationFn: () =>
      createConsultPrescription(patientId, {
        medicines: meds.filter((m) => m.name.trim()),
        instructions: rxInstructions,
        appointmentId,
      }),
    onSuccess: () => {
      toast.success("Prescription saved for patient");
      setMeds([{ name: "", dosage: "", frequency: "", duration: "" }]);
      setRxInstructions("");
      refetch();
    },
    onError: () => toast.error("Could not save prescription"),
  });

  const { data: freeSlots = [], isFetching: slotsLoading } = useQuery({
    queryKey: ["doctor-slots", doctorId, followDate],
    queryFn: () => fetchDoctorSlots(doctorId!, followDate),
    enabled: !!doctorId && !!followDate,
  });

  useEffect(() => {
    if (freeSlots.length === 0) {
      setFollowTime("");
      return;
    }
    if (!followTime || !freeSlots.includes(followTime)) {
      setFollowTime(freeSlots[0]!);
    }
  }, [freeSlots, followTime]);

  const followUpMutation = useMutation({
    mutationFn: () =>
      scheduleFollowUp({
        patientId,
        date: followDate,
        time: followTime,
        sourceAppointmentId: appointmentId,
      }),
    onSuccess: (appointment) => {
      toast.success(`Follow-up booked — ${appointment.date} at ${appointment.time}`);
      setLastBooked(appointment);
      onFollowUpScheduled?.(appointment);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      refetch();
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e, "Scheduling failed")),
  });

  const updateMed = useCallback((i: number, field: keyof ClinicalMedicine, value: string) => {
    setMeds((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <Card className="flex h-full min-h-[320px] items-center justify-center rounded-2xl p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (!emrData) {
    return (
      <Card className="rounded-2xl p-6 text-sm text-muted-foreground">
        Could not load patient EMR. You must have consulted this patient before.
      </Card>
    );
  }

  const { emr, doctorClinicalNote, latestSnapshot } = emrData;
  const profile = emr.profile;

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-border/60 shadow-soft">
      <div className="border-b px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Patient chart · full EMR
        </p>
        <p className="text-sm font-semibold">{patientName || profile.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {profile.phone && <span>{profile.phone}</span>}
          {profile.location && <span>· {profile.location}</span>}
          {profile.age != null && <span>· {profile.age} yrs</span>}
          {profile.gender && <span>· {profile.gender}</span>}
          <Badge variant="secondary">Score {profile.healthScore}</Badge>
        </div>
        {profile.allergies.length > 0 && (
          <p className="mt-1 text-[11px] text-destructive">
            Allergies: {profile.allergies.join(", ")}
          </p>
        )}
        {profile.chronicDiseases.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Chronic: {profile.chronicDiseases.join(", ")}
          </p>
        )}
        <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" asChild>
          <Link to="/doctor/patients/$patientId/emr" params={{ patientId }}>
            <ExternalLink className="mr-1 h-3 w-3" />
            Open full EMR page
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="emr" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-2 mt-2 grid w-auto grid-cols-4">
          <TabsTrigger value="emr" className="gap-1 px-2 text-[10px]">
            <ClipboardList className="h-3 w-3" /> EMR
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1 px-2 text-[10px]">
            <StickyNote className="h-3 w-3" /> Notes
          </TabsTrigger>
          <TabsTrigger value="rx" className="gap-1 px-2 text-[10px]">
            <Pill className="h-3 w-3" /> Rx
          </TabsTrigger>
          <TabsTrigger value="followup" className="gap-1 px-2 text-[10px]">
            <CalendarPlus className="h-3 w-3" /> Re-meet
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="emr" className="mt-0 p-3">
            <EmrView
              emr={emr}
              mode="doctor"
              patientId={patientId}
              latestSnapshot={latestSnapshot}
              doctorNote={doctorClinicalNote.content}
              compact
              onEmrRefresh={() => refetch()}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-0 space-y-3 p-4">
            <p className="text-xs text-muted-foreground">
              Private remarks for this patient — saved to EMR and visible on your next visit.
            </p>
            <Textarea
              rows={8}
              placeholder="Diagnosis, follow-up advice, red flags…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              className="resize-none"
            />
            {doctorClinicalNote.updatedAt && (
              <p className="text-[10px] text-muted-foreground">
                Last updated {new Date(doctorClinicalNote.updatedAt).toLocaleString()}
              </p>
            )}
            <Button
              size="sm"
              className="w-full bg-gradient-primary text-primary-foreground"
              disabled={saveNoteMutation.isPending}
              onClick={() => saveNoteMutation.mutate()}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveNoteMutation.isPending ? "Saving…" : "Save remarks"}
            </Button>
          </TabsContent>

          <TabsContent value="rx" className="mt-0 space-y-3 p-4">
            <p className="text-xs text-muted-foreground">
              Issue medicines for this consultation — saved to patient EMR.
            </p>
            {meds.map((m, i) => (
              <div key={i} className="grid gap-2 rounded-xl border p-3">
                <Input
                  placeholder="Medicine"
                  value={m.name}
                  onChange={(e) => updateMed(i, "name", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Dosage"
                    value={m.dosage}
                    onChange={(e) => updateMed(i, "dosage", e.target.value)}
                  />
                  <Input
                    placeholder="Frequency"
                    value={m.frequency}
                    onChange={(e) => updateMed(i, "frequency", e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Duration"
                  value={m.duration}
                  onChange={(e) => updateMed(i, "duration", e.target.value)}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setMeds([...meds, { name: "", dosage: "", frequency: "", duration: "" }])
              }
            >
              Add medicine
            </Button>
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={rxInstructions}
                onChange={(e) => setRxInstructions(e.target.value)}
                placeholder="Take after meals…"
              />
            </div>
            <Button
              size="sm"
              className="w-full bg-gradient-primary text-primary-foreground"
              disabled={rxMutation.isPending}
              onClick={() => rxMutation.mutate()}
            >
              Save prescription
            </Button>
          </TabsContent>

          <TabsContent value="followup" className="mt-0 space-y-3 p-4">
            <p className="text-xs text-muted-foreground">
              Books a free slot on your calendar for {patientName}. They see it instantly in this
              call and under My appointments.
            </p>
            {lastBooked && (
              <Card className="rounded-xl border-success/30 bg-success/10 p-3 text-xs">
                <p className="font-medium text-success">Follow-up confirmed</p>
                <p className="mt-1 text-muted-foreground">
                  {lastBooked.date} at {lastBooked.time} · {lastBooked.status}
                </p>
              </Card>
            )}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                min={getTodayDateString()}
                value={followDate}
                onChange={(e) => {
                  const next = e.target.value;
                  setFollowDate(isDateBeforeToday(next) ? getTodayDateString() : next);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Free time slot</Label>
              {slotsLoading && (
                <p className="text-xs text-muted-foreground">Loading your free slots…</p>
              )}
              {!slotsLoading && freeSlots.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {isDateBeforeToday(followDate)
                    ? "Past dates cannot be booked — choose today or a future date."
                    : "No free slots this day — pick another date or update Availability."}
                </p>
              )}
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={followTime}
                disabled={freeSlots.length === 0}
                onChange={(e) => setFollowTime(e.target.value)}
              >
                {freeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              className="w-full bg-gradient-primary text-primary-foreground"
              disabled={
                followUpMutation.isPending || !followDate || !followTime || freeSlots.length === 0
              }
              onClick={() => followUpMutation.mutate()}
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              {followUpMutation.isPending ? "Booking…" : "Book follow-up"}
            </Button>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
}
