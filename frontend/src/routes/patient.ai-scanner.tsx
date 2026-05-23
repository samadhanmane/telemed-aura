import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Activity,
  Stethoscope,
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Phone,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAiScanner } from "@/lib/api/hooks/use-ai-scanner";
import { fetchHealthSummary } from "@/lib/api/ai";
import {
  dismissPatientCriticalAlert,
  fetchPatientCriticalAlert,
  patientCriticalBook,
} from "@/lib/api/triage";
import { fetchDoctorSlots } from "@/lib/api/doctors";
import { getTodayDateString } from "@/lib/appointment-slots";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MetricInfo } from "@/components/analytics/MetricInfo";
import { SEVERITY_COLORS } from "@/components/analytics/chart-theme";

export const Route = createFileRoute("/patient/ai-scanner")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "AI Health Assistant" }] }),
  component: ScannerPage,
});

const commonSymptoms = [
  { id: "Fever", key: "ai.symptom.fever" },
  { id: "Headache", key: "ai.symptom.headache" },
  { id: "Chest pain", key: "ai.symptom.chestPain" },
  { id: "Cough", key: "ai.symptom.cough" },
  { id: "Fatigue", key: "ai.symptom.fatigue" },
  { id: "Difficulty breathing", key: "ai.symptom.breathing" },
  { id: "Sore throat", key: "ai.symptom.soreThroat" },
  { id: "Body ache", key: "ai.symptom.bodyAche" },
] as const;

const bodyAreaOptions = [
  { id: "Head", key: "ai.bodyAreas.head" },
  { id: "Chest", key: "ai.bodyAreas.chest" },
  { id: "Abdomen", key: "ai.bodyAreas.abdomen" },
  { id: "Limbs", key: "ai.bodyAreas.limbs" },
  { id: "Skin", key: "ai.bodyAreas.skin" },
  { id: "General", key: "ai.bodyAreas.general" },
] as const;

function ScannerPage() {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<string[]>([]);
  const [bodyArea, setBodyArea] = useState("General" as (typeof bodyAreaOptions)[number]["id"]);
  const [text, setText] = useState("");
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [criticalOpen, setCriticalOpen] = useState(false);
  const [criticalDismissed, setCriticalDismissed] = useState(false);
  const [bookDoctorId, setBookDoctorId] = useState("");
  const [bookDate, setBookDate] = useState(getTodayDateString());
  const [bookTime, setBookTime] = useState("");
  const qc = useQueryClient();
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    sugarLevel: "",
    oxygenLevel: "",
  });
  const scan = useAiScanner();

  const { data: healthSummary } = useQuery({
    queryKey: ["health-summary"],
    queryFn: fetchHealthSummary,
  });

  const toggle = (s: string) =>
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const run = () => {
    const v = {
      bloodPressureSystolic: vitals.bloodPressureSystolic
        ? Number(vitals.bloodPressureSystolic)
        : undefined,
      bloodPressureDiastolic: vitals.bloodPressureDiastolic
        ? Number(vitals.bloodPressureDiastolic)
        : undefined,
      sugarLevel: vitals.sugarLevel ? Number(vitals.sugarLevel) : undefined,
      oxygenLevel: vitals.oxygenLevel ? Number(vitals.oxygenLevel) : undefined,
    };
    const hasVitals = Object.values(v).some((x) => x !== undefined);
    scan.mutate(
      {
        symptoms: picked,
        description: text,
        bodyArea: bodyArea.toLowerCase(),
        vitals: hasVitals ? v : undefined,
      },
      {
        onSuccess: (result) => {
          if (result.isCritical || result.canBookUrgentCall) {
            setCriticalDismissed(false);
            setCriticalOpen(true);
            if (result.nearestDoctor) setBookDoctorId(result.nearestDoctor.id);
          } else if (result.emergency) setEmergencyOpen(true);
        },
      },
    );
  };

  const result = scan.data;

  const { data: criticalAlertData } = useQuery({
    queryKey: ["patient-critical-alert", bookDoctorId, bookDate],
    queryFn: () => fetchPatientCriticalAlert(bookDoctorId || undefined, bookDate),
    enabled: Boolean(result?.canBookUrgentCall && bookDoctorId),
  });

  const bookSlots =
    criticalAlertData?.slots?.length
      ? criticalAlertData.slots
      : bookDoctorId
        ? undefined
        : [];

  const { data: slotsFromDoctor = [] } = useQuery({
    queryKey: ["patient-critical-slots", bookDoctorId, bookDate],
    queryFn: () => fetchDoctorSlots(bookDoctorId, bookDate),
    enabled: Boolean(bookDoctorId && bookDate && !criticalAlertData?.slots?.length),
  });

  const slots = bookSlots ?? slotsFromDoctor;

  const dismissCritical = useMutation({
    mutationFn: dismissPatientCriticalAlert,
    onSuccess: () => {
      setCriticalDismissed(true);
      setCriticalOpen(false);
      toast.message("You can still read your full analysis below.");
    },
  });

  const bookCritical = useMutation({
    mutationFn: () =>
      patientCriticalBook({ doctorId: bookDoctorId, date: bookDate, time: bookTime }),
    onSuccess: () => {
      toast.success("Urgent visit booked — your doctor will join at the scheduled time.");
      setCriticalOpen(false);
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patient-critical-alert"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Could not book urgent call")),
  });

  const showCriticalBanner =
    result &&
    (result.isCritical || result.canBookUrgentCall) &&
    !criticalDismissed &&
    criticalAlertData?.alert?.canPatientBook !== false;

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t("ai.scannerTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("ai.scannerSubtitle")}</p>
          </div>
        </div>

        {healthSummary && (
          <Card className="mt-6 rounded-2xl border-primary/20 bg-primary-soft/30 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <HeartPulse className="h-4 w-4" /> {t("ai.healthSummary")}
            </div>
            <p className="mt-2 text-sm">{healthSummary.summary}</p>
            <ul className="mt-3 list-inside list-disc text-xs text-muted-foreground">
              {healthSummary.suggestions.slice(0, 3).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <Card className="rounded-3xl border-border/60 p-6 shadow-soft lg:col-span-3">
            <h2 className="text-sm font-semibold">{t("ai.symptomScanner")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("ai.tapOrDescribe")}</p>

            <h3 className="mt-4 text-xs font-semibold uppercase text-muted-foreground">{t("ai.bodyArea")}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {bodyAreaOptions.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBodyArea(b.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    bodyArea === b.id ? "border-primary bg-primary-soft" : "border-border"
                  }`}
                >
                  {t(b.key)}
                </button>
              ))}
            </div>

            <h3 className="mt-4 text-xs font-semibold uppercase text-muted-foreground">{t("ai.symptoms")}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {commonSymptoms.map((s) => {
                const on = picked.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      on ? "border-primary bg-primary-soft" : "border-border"
                    }`}
                  >
                    {t(s.key)}
                  </button>
                );
              })}
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("ai.describePlaceholder")}
              className="mt-4 min-h-24 rounded-2xl"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">{t("ai.describeHint")}</p>

            <h3 className="mt-4 text-xs font-semibold uppercase text-muted-foreground">{t("ai.optionalVitals")}</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">{t("ai.vitalsHint")}</p>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-[10px]" title="Top number — normal near 120">
                  BP systolic
                </Label>
                <Input
                  type="number"
                  placeholder="120"
                  value={vitals.bloodPressureSystolic}
                  onChange={(e) =>
                    setVitals((v) => ({ ...v, bloodPressureSystolic: e.target.value }))
                  }
                />
                <p className="text-[9px] text-muted-foreground">mmHg, upper</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]" title="Bottom number — normal near 80">
                  BP diastolic
                </Label>
                <Input
                  type="number"
                  placeholder="80"
                  value={vitals.bloodPressureDiastolic}
                  onChange={(e) =>
                    setVitals((v) => ({ ...v, bloodPressureDiastolic: e.target.value }))
                  }
                />
                <p className="text-[9px] text-muted-foreground">mmHg, lower</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]" title="Fasting or random glucose">
                  Sugar (mg/dL)
                </Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={vitals.sugarLevel}
                  onChange={(e) => setVitals((v) => ({ ...v, sugarLevel: e.target.value }))}
                />
                <p className="text-[9px] text-muted-foreground">blood glucose</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]" title="Pulse oximeter reading">
                  SpO₂ %
                </Label>
                <Input
                  type="number"
                  placeholder="98"
                  min={70}
                  max={100}
                  value={vitals.oxygenLevel}
                  onChange={(e) => setVitals((v) => ({ ...v, oxygenLevel: e.target.value }))}
                />
                <p className="text-[9px] text-muted-foreground">oxygen in blood</p>
              </div>
            </div>

            <Button
              onClick={run}
              disabled={scan.isPending || (picked.length === 0 && !text)}
              className="mt-5 h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow"
            >
              {scan.isPending ? t("ai.analyzing") : t("ai.runScan")}
            </Button>
          </Card>

          <Card className="rounded-3xl border-border/60 p-6 shadow-soft lg:col-span-2">
            <h2 className="text-sm font-semibold">{t("ai.results")}</h2>
            <AnimatePresence mode="wait">
              {scan.isPending && (
                <motion.p
                  key="load"
                  className="mt-8 text-center text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Activity className="mx-auto mb-2 h-8 w-8 animate-pulse text-primary" />
                  {t("ai.checkingSymptoms")}
                </motion.p>
              )}
              {result && !scan.isPending && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <MetricInfo label={t("ai.riskScore")}>
                        Screening urgency index (0–100): how soon rule-based triage suggests
                        clinical review. Low ≈ home care; Moderate ≈ 24–48h; High/Critical ≈
                        urgent. Not a diagnosis.
                      </MetricInfo>
                      <div className="flex gap-2">
                        {result.triagePriority != null && (
                          <Badge variant="outline">Triage P{result.triagePriority}</Badge>
                        )}
                        {result.requiresDoctor && (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldAlert className="h-3 w-3" /> {t("ai.seeDoctor")}
                          </Badge>
                        )}
                        <Badge
                          variant={result.emergency ? "destructive" : "secondary"}
                          style={{
                            borderColor: SEVERITY_COLORS[result.severity] ?? undefined,
                          }}
                        >
                          {result.severity}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={result.risk} className="mt-2 h-2" />
                    <p className="text-right text-xs font-semibold">
                      {result.risk}% screening urgency · {result.severity} severity
                    </p>
                    {result.symptomCategory && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Category: {result.symptomCategory}
                        {result.geminiAnalysisUsed && " · AI read your description"}
                        {result.vitalsUsed && " · vitals included"}
                      </p>
                    )}
                    {result.patientProblemSummary && (
                      <p className="mt-3 rounded-lg bg-primary/5 p-2 text-xs leading-relaxed">
                        <span className="font-medium text-primary">What you may be facing: </span>
                        {result.patientProblemSummary}
                      </p>
                    )}
                    {result.recommendation && (
                      <p className="mt-2 text-xs text-muted-foreground">{result.recommendation}</p>
                    )}
                  </div>
                  {result.analysisDetails && result.analysisDetails.length > 0 && (
                    <div className="rounded-2xl border border-warning/30 bg-warning/5 p-3 text-xs">
                      <p className="font-medium text-foreground">Why this severity score</p>
                      <ul className="mt-2 list-inside list-disc text-muted-foreground">
                        {result.analysisDetails.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="rounded-2xl bg-muted/40 p-3 text-xs">
                    <p className="font-medium">Possible conditions</p>
                    <ul className="mt-1 list-inside list-disc text-muted-foreground">
                      {result.possibleConditions.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  {showCriticalBanner && (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3">
                      <p className="flex items-center gap-2 text-xs font-semibold text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Critical — book an immediate video call
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{result.recommendation}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => {
                            if (result.nearestDoctor) setBookDoctorId(result.nearestDoctor.id);
                            setCriticalOpen(true);
                          }}
                        >
                          <Phone className="mr-1 h-3 w-3" />
                          Book urgent call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={dismissCritical.isPending}
                          onClick={() => dismissCritical.mutate()}
                        >
                          Dismiss alert — keep report
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Recommended specialist</p>
                    <p className="font-semibold">{result.suggestedSpecialist}</p>
                    <Button size="sm" className="mt-3 w-full" asChild>
                      <Link
                        to="/patient/doctors"
                        search={{ specialty: result.suggestedSpecialtyId }}
                      >
                        Book {result.suggestedSpecialist}
                      </Link>
                    </Button>
                  </div>
                  {result.preventiveSuggestions.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Preventive tips</p>
                      <ul className="mt-1 list-inside list-disc">
                        {result.preventiveSuggestions.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
              {!result && !scan.isPending && (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  <Stethoscope className="mx-auto mb-2 h-8 w-8 text-primary/40" />
                  Run a scan to see disease likelihood and specialist match.
                </p>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>

      <AlertDialog open={criticalOpen} onOpenChange={setCriticalOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Critical — urgent video call
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your scan indicates a critical condition. Book an immediate consultation now, or
              dismiss this alert to read your full report first.
              {result?.recommendation && (
                <span className="mt-2 block text-foreground">{result.recommendation}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {result?.nearestDoctor && (
            <p className="text-sm">
              Suggested: <strong>{result.nearestDoctor.name}</strong> ({result.nearestDoctor.specialty})
            </p>
          )}
          <div className="space-y-2 py-2">
            {!result?.nearestDoctor && (
              <p className="text-xs text-muted-foreground">
                Choose a doctor from{" "}
                <Link to="/patient/doctors" search={{}} className="text-primary underline">
                  Find doctors
                </Link>{" "}
                and enter their ID below, or open doctors list first.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Date</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  min={getTodayDateString()}
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-[10px]">Time slot</Label>
                <select
                  className="flex h-8 w-full rounded-md border px-2 text-xs"
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                >
                  <option value="">Select…</option>
                  {slots.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="ghost"
              size="sm"
              className="mr-auto"
              disabled={dismissCritical.isPending}
              onClick={() => dismissCritical.mutate()}
            >
              <X className="mr-1 h-3 w-3" />
              Dismiss — view report
            </Button>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <Button
              size="sm"
              disabled={!bookDoctorId || !bookTime || bookCritical.isPending}
              onClick={() => bookCritical.mutate()}
            >
              <Phone className="mr-1 h-3 w-3" />
              Book urgent call
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Emergency warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              Dangerous symptoms were detected. Please seek urgent medical care immediately or
              book an emergency consultation.
              {result?.nearestDoctor && (
                <span className="mt-2 block font-medium text-foreground">
                  Nearest specialist: {result.nearestDoctor.name} ({result.nearestDoctor.specialty})
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Link to="/patient/doctors" search={{}}>
                Book emergency consult
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
