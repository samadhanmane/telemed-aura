import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CalendarCheck, FileText, Pill, Sparkles, ChevronRight,
  Video, Activity, TrendingUp, ArrowUpRight,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/patient/")({
  head: () => ({ meta: [{ title: "Dashboard — Patient" }] }),
  component: PatientHome,
});

const stats = [
  { label: "Total consultations", value: "24", trend: "+3 this month", icon: Video, tone: "text-primary bg-primary-soft" },
  { label: "Active prescriptions", value: "5", trend: "2 ending soon", icon: Pill, tone: "text-accent bg-accent-soft" },
  { label: "Uploaded reports", value: "12", trend: "Last: Aug 14", icon: FileText, tone: "text-success bg-success/10" },
  { label: "Pending appointments", value: "2", trend: "Next: Today 5:30pm", icon: CalendarCheck, tone: "text-warning bg-warning/10" },
];

const upcoming = [
  { doctor: "Dr. Meera Iyer", spec: "Cardiology", when: "Today · 5:30 PM", mode: "Video", status: "Confirmed" },
  { doctor: "Dr. Rohan Verma", spec: "Dermatology", when: "Fri · 11:00 AM", mode: "Video", status: "Pending" },
  { doctor: "Dr. Priya Shah", spec: "General Physician", when: "Mon · 9:00 AM", mode: "Video", status: "Confirmed" },
];

const prescriptions = [
  { name: "Amoxicillin 500mg", by: "Dr. Iyer", date: "Aug 14", dose: "1 tab · 3×/day" },
  { name: "Vitamin D3 60k", by: "Dr. Shah", date: "Aug 02", dose: "1 weekly" },
];

const doctors = [
  { name: "Dr. Anjali Mehta", spec: "Pediatrics", fee: "₹399", rating: 4.9 },
  { name: "Dr. Karan Sethi", spec: "Neurology", fee: "₹699", rating: 4.8 },
  { name: "Dr. Leena Joshi", spec: "Gynecology", fee: "₹549", rating: 4.9 },
];

function PatientHome() {
  return (
    <DashboardShell nav={patientNav} title="Patient">
      <div className="mx-auto max-w-7xl">
        {/* Welcome */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Hello, Aarav 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">Here's a snapshot of your health today.</p>
          </div>
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
            <Link to="/patient/appointments">Book appointment <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        {/* AI promo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 overflow-hidden rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-elevated md:p-8"
        >
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">AI Symptom Scanner</div>
                <div className="mt-1 text-lg font-semibold md:text-xl">Not feeling well? Get an instant triage in seconds.</div>
              </div>
            </div>
            <Button variant="secondary" asChild>
              <Link to="/patient/ai-scanner">Scan symptoms <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
        </motion.div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.tone}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
                <div className="mt-3 text-[11px] text-muted-foreground">{s.trend}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Upcoming appointments</h2>
                <p className="text-xs text-muted-foreground">Stay on top of your care plan</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/patient/appointments">View all</Link>
              </Button>
            </div>
            <ul className="divide-y divide-border/60">
              {upcoming.map((a) => (
                <li key={a.doctor + a.when} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{a.doctor}</div>
                      <div className="text-xs text-muted-foreground">{a.spec} · {a.when}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={a.status === "Confirmed" ? "default" : "secondary"} className={a.status === "Confirmed" ? "bg-success text-success-foreground" : ""}>
                      {a.status}
                    </Badge>
                    <Button size="sm" variant="outline">Join</Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent prescriptions</h2>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </div>
            <ul className="space-y-4">
              {prescriptions.map((p) => (
                <li key={p.name} className="rounded-xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.date}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.dose}</div>
                  <div className="mt-2 text-[11px] text-muted-foreground">Prescribed by {p.by}</div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Recommended doctors</h2>
                <p className="text-xs text-muted-foreground">Based on your recent history</p>
              </div>
              <Button variant="ghost" size="sm">See more</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {doctors.map((d) => (
                <div key={d.name} className="rounded-2xl border border-border/60 p-4 transition-colors hover:border-primary/40">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-accent text-sm font-semibold text-accent-foreground">
                      {d.name.split(" ")[1][0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{d.name}</div>
                      <div className="text-[11px] text-muted-foreground">{d.spec}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">★ {d.rating}</span>
                    <span className="font-semibold">{d.fee}</span>
                  </div>
                  <Button size="sm" className="mt-3 w-full">Book</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Vitals</h2>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Heart rate" value="72 bpm" tone="text-success" />
              <Row label="Blood pressure" value="120/80" tone="text-success" />
              <Row label="SpO₂" value="98%" tone="text-success" />
              <Row label="Temperature" value="98.6°F" tone="text-success" />
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${tone}`}>{value}</span>
    </div>
  );
}
