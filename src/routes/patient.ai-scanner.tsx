import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Activity, Stethoscope, ShieldAlert, ChevronRight } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/patient/ai-scanner")({
  head: () => ({ meta: [{ title: "AI Symptom Scanner" }] }),
  component: ScannerPage,
});

const common = ["Fever", "Cough", "Headache", "Fatigue", "Chest pain", "Sore throat", "Body ache", "Nausea"];

function ScannerPage() {
  const [picked, setPicked] = useState<string[]>(["Fever", "Cough"]);
  const [text, setText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<null | { risk: number; severity: string; spec: string }>(null);

  const toggle = (s: string) =>
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const run = async () => {
    setScanning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1800));
    setScanning(false);
    setResult({ risk: 64, severity: "Moderate", spec: "General Physician" });
  };

  return (
    <DashboardShell nav={patientNav} title="Patient">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">AI Symptom Scanner</h1>
            <p className="text-sm text-muted-foreground">Describe how you feel — we'll suggest a likely cause and the right specialist.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <Card className="rounded-3xl border-border/60 p-6 shadow-soft lg:col-span-3">
            <h2 className="text-sm font-semibold">Pick your symptoms</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {common.map((s) => {
                const on = picked.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggle(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                      on
                        ? "border-primary bg-primary-soft text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <h2 className="mt-6 text-sm font-semibold">Describe in your own words</h2>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="E.g. dry cough for 3 days, low fever in the evening, mild chest discomfort…"
              className="mt-2 min-h-32 rounded-2xl"
            />

            <Button
              onClick={run}
              disabled={scanning || (picked.length === 0 && text.length === 0)}
              className="mt-5 h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
            >
              {scanning ? "Scanning…" : "Run AI scan"}
            </Button>
          </Card>

          <Card className="relative overflow-hidden rounded-3xl border-border/60 p-6 shadow-soft lg:col-span-2">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-primary opacity-60" />
            <h2 className="text-sm font-semibold">Result</h2>

            <AnimatePresence mode="wait">
              {scanning && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 grid place-items-center"
                >
                  <div className="relative grid h-32 w-32 place-items-center">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-2 rounded-full border-2 border-accent/40"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: 0.3 }}
                    />
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                      <Activity className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">Analyzing your symptoms…</p>
                </motion.div>
              )}

              {!scanning && !result && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 grid place-items-center text-center text-sm text-muted-foreground"
                >
                  <Sparkles className="mb-3 h-8 w-8 text-primary/60" />
                  Pick symptoms or describe how you feel, then run the scan.
                </motion.div>
              )}

              {!scanning && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 space-y-5"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Estimated risk</span>
                      <Badge className="bg-warning text-warning-foreground">{result.severity}</Badge>
                    </div>
                    <Progress value={result.risk} className="mt-2 h-2" />
                    <div className="mt-1 text-right text-xs font-semibold">{result.risk}%</div>
                  </div>

                  <div className="rounded-2xl bg-muted/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <Stethoscope className="h-3.5 w-3.5" /> Suggested specialist
                    </div>
                    <div className="mt-2 text-base font-semibold">{result.spec}</div>
                    <Button size="sm" className="mt-3 w-full bg-gradient-primary text-primary-foreground">
                      Book now <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-warning">
                      <ShieldAlert className="h-4 w-4" /> Precautions
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                      <li>Stay hydrated and rest for 24–48 hours.</li>
                      <li>Monitor temperature every 4 hours.</li>
                      <li>Seek urgent care if breathing worsens.</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
