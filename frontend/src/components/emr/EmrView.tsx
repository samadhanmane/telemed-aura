import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  Heart,
  Pill,
  RefreshCw,
  Stethoscope,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { PatientEmrPayload } from "@/lib/api/emr";
import { generateMyEmrSnapshot, generatePatientEmrSnapshot } from "@/lib/api/emr";
import { EmrDocumentsSection } from "@/components/emr/EmrDocumentsSection";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  if (v.sugarLevel != null) parts.push(`Sugar ${v.sugarLevel} mg/dL`);
  if (v.oxygenLevel != null) parts.push(`SpO₂ ${v.oxygenLevel}%`);
  return parts.join(" · ") || "—";
}

export function EmrView({
  emr,
  mode,
  patientId,
  latestSnapshot,
  doctorNote,
  compact = false,
  onEmrRefresh,
}: {
  emr: PatientEmrPayload;
  mode: "patient" | "doctor";
  patientId?: string;
  latestSnapshot?: { label: string; createdAt: string } | null;
  doctorNote?: string;
  /** Narrow sidebar (video consult) — single column, tighter spacing */
  compact?: boolean;
  onEmrRefresh?: () => void;
}) {
  const qc = useQueryClient();
  const snapshotMutation = useMutation({
    mutationFn: () =>
      mode === "patient" ? generateMyEmrSnapshot() : generatePatientEmrSnapshot(patientId!),
    onSuccess: () => {
      toast.success("Latest health record snapshot generated");
      if (mode === "patient") qc.invalidateQueries({ queryKey: ["my-emr"] });
      else {
        qc.invalidateQueries({ queryKey: ["patient-emr", patientId] });
        onEmrRefresh?.();
      }
    },
    onError: () => toast.error("Could not generate snapshot"),
  });

  const {
    profile,
    latestVitals,
    consultations,
    prescriptions,
    reports,
    timeline,
    upcomingAppointments,
    vitalsHistory,
    aiScans,
  } = emr;

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={compact ? "text-sm font-semibold tracking-tight" : "text-xl font-semibold tracking-tight"}>
            {compact ? "Full health record" : "Electronic Medical Record"}
          </h2>
          {!compact && (
          <p className="text-sm text-muted-foreground">
            Updated after each consultation · Auto snapshot every 24 hours
          </p>
          )}
          {latestSnapshot && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last snapshot: {latestSnapshot.label} — {formatDate(latestSnapshot.createdAt)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className={compact ? "h-7 text-xs" : undefined}
          onClick={() => snapshotMutation.mutate()}
          disabled={snapshotMutation.isPending}
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${snapshotMutation.isPending ? "animate-spin" : ""}`} />
          {compact ? "Refresh EMR" : "Generate latest EMR"}
        </Button>
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "gap-4 sm:grid-cols-2 lg:grid-cols-4"}`}>
        <Card className="rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Profile</span>
          </div>
          <p className="mt-2 font-semibold">{profile.name}</p>
          <p className="text-sm text-muted-foreground">
            {profile.age != null ? `${profile.age} yrs` : "Age —"} · {profile.gender ?? "—"}
          </p>
          {profile.allergies.length > 0 && (
            <p className="mt-1 text-xs text-destructive">Allergies: {profile.allergies.join(", ")}</p>
          )}
          {profile.chronicDiseases.length > 0 && (
            <p className="text-xs text-muted-foreground">Chronic: {profile.chronicDiseases.join(", ")}</p>
          )}
        </Card>
        <Card className="rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Latest vitals</span>
          </div>
          <p className="mt-2 text-sm font-medium">
            {latestVitals ? vitalsLine(latestVitals) : "No vitals recorded yet"}
          </p>
          {latestVitals?.recordedAt && (
            <p className="text-xs text-muted-foreground">{formatDate(String(latestVitals.recordedAt))}</p>
          )}
        </Card>
        <Card className="rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Stethoscope className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Consultations</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{consultations.length}</p>
        </Card>
        <Card className="rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Health score</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{profile.healthScore}</p>
        </Card>
      </div>

      {mode === "doctor" && doctorNote && (
        <Card className="rounded-2xl border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium">Your clinical notes</p>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{doctorNote}</p>
        </Card>
      )}

      {upcomingAppointments.length > 0 && (
        <Card className="rounded-2xl p-4 shadow-soft">
          <p className="flex items-center gap-2 font-medium">
            <Calendar className="h-4 w-4" /> Upcoming appointments
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {upcomingAppointments.map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>
                  {a.date} {a.time} — {a.specialization}
                </span>
                <Badge variant="secondary">{a.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className={compact ? "space-y-4" : "grid gap-6 lg:grid-cols-2"}>
        <Card className="rounded-2xl p-4 shadow-soft">
          <p className="flex items-center gap-2 font-medium">
            <Stethoscope className="h-4 w-4" /> Consultation conclusions
          </p>
          <ScrollArea className={`mt-3 ${compact ? "h-40" : "h-64"}`}>
            <ul className="space-y-3 pr-3 text-sm">
              {consultations.length === 0 && (
                <li className="text-muted-foreground">No completed consultations in EMR yet.</li>
              )}
              {consultations.map((c) => (
                <li key={c.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{c.doctorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.date} {c.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.specialization}</p>
                  {c.vitals && (
                    <p className="mt-1 text-xs">{vitalsLine(c.vitals)}</p>
                  )}
                  <p className="mt-2 text-muted-foreground">{c.conclusion || c.clinicalRemarks}</p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Card>

        <Card className="rounded-2xl p-4 shadow-soft">
          <p className="flex items-center gap-2 font-medium">
            <Pill className="h-4 w-4" /> Digital prescriptions
          </p>
          <ScrollArea className={`mt-3 ${compact ? "h-40" : "h-64"}`}>
            <ul className="space-y-3 pr-3 text-sm">
              {prescriptions.length === 0 && (
                <li className="text-muted-foreground">No prescriptions yet.</li>
              )}
              {prescriptions.map((rx) => (
                <li key={rx.id} className="rounded-xl border border-border/60 p-3">
                  <p className="font-medium">{rx.doctorName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(rx.date)}</p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {rx.medicines.map((m, i) => (
                      <li key={i}>
                        {m.name} — {m.dosage}, {m.frequency}, {m.duration}
                      </li>
                    ))}
                  </ul>
                  {rx.instructions && (
                    <p className="mt-1 text-xs italic">{rx.instructions}</p>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Card>
      </div>

      <EmrDocumentsSection
        emr={emr}
        doctorMode={mode === "doctor"}
        patientId={patientId}
        compact={compact}
        onReportReviewed={onEmrRefresh}
      />

      {vitalsHistory.length > 0 && (
        <Card className="rounded-2xl p-4 shadow-soft">
          <p className="text-sm font-medium">Vitals history</p>
          <ScrollArea className={`mt-2 ${compact ? "h-32" : "h-40"}`}>
            <ul className="space-y-2 pr-2 text-xs">
              {vitalsHistory.map((v) => (
                <li key={v.id} className="rounded-lg border border-border/40 px-2 py-1.5">
                  <span className="font-medium">{vitalsLine(v)}</span>
                  <span className="ml-2 text-muted-foreground">
                    {formatDate(String(v.recordedAt))} · {v.source}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Card>
      )}

      {aiScans.length > 0 && (
        <Card className="rounded-2xl p-4 shadow-soft">
          <p className="text-sm font-medium">AI symptom scans ({aiScans.length})</p>
          <ScrollArea className={`mt-2 ${compact ? "h-32" : "h-40"}`}>
            <ul className="space-y-2 pr-2 text-xs">
              {aiScans.map((s) => (
                <li key={s.id} className="rounded-lg border border-border/40 px-2 py-1.5">
                  <p className="font-medium">
                    {s.severity} · risk {s.risk}
                    {s.emergency && (
                      <Badge variant="destructive" className="ml-1 text-[10px]">
                        Emergency
                      </Badge>
                    )}
                  </p>
                  <p className="text-muted-foreground">{s.symptoms.join(", ") || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(String(s.createdAt))}</p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Card>
      )}

      <Card className="rounded-2xl p-4 shadow-soft">
        <p className="flex items-center gap-2 font-medium">
          <Activity className="h-4 w-4" /> Health timeline
        </p>
        <ScrollArea className={`mt-3 ${compact ? "h-40" : "h-56"}`}>
          <ul className="space-y-2 pr-3">
            {timeline.map((item) => (
              <li
                key={`${item.type}-${item.id}`}
                className="flex gap-3 rounded-lg border border-border/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="truncate text-muted-foreground">{item.subtitle}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.at)}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Card>
    </div>
  );
}
