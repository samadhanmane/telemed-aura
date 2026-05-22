import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Activity, Stethoscope, ShieldAlert, ChevronRight } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAiScanner } from "@/lib/api/hooks/use-ai-scanner";

export const Route = createFileRoute("/patient/ai-scanner")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "AI Symptom Scanner" }] }),
  component: ScannerPage,
});

const common = ["Fever", "Cough", "Headache", "Fatigue", "Chest pain", "Sore throat", "Body ache", "Nausea"];
const bodyAreas = ["Head", "Chest", "Abdomen", "Limbs", "Skin", "General"];

function ScannerPage() {
  const [picked, setPicked] = useState<string[]>(["Fever"]);
  const [bodyArea, setBodyArea] = useState("General");
  const [text, setText] = useState("");
  const scan = useAiScanner();

  const toggle = (s: string) =>
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const run = () => {
    scan.mutate({
      symptoms: picked,
      description: text,
      bodyArea: bodyArea.toLowerCase(),
    });
  };

  const result = scan.data;

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">AI Health Scanner</h1>
            <p className="text-sm text-muted-foreground">Symptoms, body area, and AI risk prediction.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <Card className="rounded-3xl border-border/60 p-6 shadow-soft lg:col-span-3">
            <h2 className="text-sm font-semibold">Body area</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {bodyAreas.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBodyArea(b)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    bodyArea === b ? "border-primary bg-primary-soft" : "border-border text-muted-foreground"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <h2 className="mt-6 text-sm font-semibold">Symptoms</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {common.map((s) => {
                const on = picked.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      on ? "border-primary bg-primary-soft" : "border-border text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <h2 className="mt-6 text-sm font-semibold">Describe symptoms</h2>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe how you feel…"
              className="mt-2 min-h-28 rounded-2xl"
            />

            <Button
              onClick={run}
              disabled={scan.isPending || (picked.length === 0 && !text)}
              className="mt-5 h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow"
            >
              {scan.isPending ? "Scanning…" : "Run AI scan"}
            </Button>
          </Card>

          <Card className="relative overflow-hidden rounded-3xl border-border/60 p-6 shadow-soft lg:col-span-2">
            <h2 className="text-sm font-semibold">AI result</h2>
            <AnimatePresence mode="wait">
              {scan.isPending && (
                <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 grid place-items-center">
                  <motion.div
                    className="h-24 w-24 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <p className="mt-4 text-sm text-muted-foreground">Analyzing…</p>
                </motion.div>
              )}
              {!scan.isPending && result && (
                <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Risk</span>
                      <Badge>{result.severity}</Badge>
                    </div>
                    <Progress value={result.risk} className="mt-2 h-2" />
                    <p className="mt-1 text-right text-xs font-semibold">{result.risk}%</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">Suggested specialist</p>
                    <p className="font-semibold">{result.suggestedSpecialist}</p>
                    <Button size="sm" className="mt-3 w-full" asChild>
                      <Link to="/patient/doctors">Book now</Link>
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-xs">
                    <ShieldAlert className="mb-1 h-4 w-4 text-warning" />
                    Seek urgent care if symptoms worsen.
                  </div>
                </motion.div>
              )}
              {!scan.isPending && !result && (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  <Activity className="mx-auto mb-2 h-8 w-8 text-primary/50" />
                  Run a scan to see risk and specialist suggestion.
                </p>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
