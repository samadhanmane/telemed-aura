import { createFileRoute } from "@tanstack/react-router";
import { Brain, Zap, AlertTriangle, Server } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/admin/ai-monitoring")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "AI Monitoring — Admin" }] }),
  component: AdminAiMonitoring,
});

const symptomTrends = [
  { symptom: "Fever", count: 342 },
  { symptom: "Cough", count: 289 },
  { symptom: "Chest pain", count: 87 },
  { symptom: "Headache", count: 201 },
];

function AdminAiMonitoring() {
  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="AI monitoring" description="Scanner usage, trends, and API performance." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Scans today" value={89} icon={Brain} />
        <StatCard label="Urgent cases" value={12} icon={AlertTriangle} tone="text-destructive bg-destructive/10" />
        <StatCard label="API latency" value="124ms" icon={Zap} tone="text-success bg-success/10" />
        <StatCard label="Uptime" value="99.9%" icon={Server} />
      </div>
      <Card className="mt-6 rounded-2xl p-6 shadow-soft">
        <h3 className="font-semibold">Symptom trends (7 days)</h3>
        <div className="mt-4 space-y-4">
          {symptomTrends.map((s) => (
            <div key={s.symptom}>
              <div className="flex justify-between text-sm">
                <span>{s.symptom}</span>
                <span className="text-muted-foreground">{s.count}</span>
              </div>
              <Progress value={(s.count / 342) * 100} className="mt-1 h-2" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-4 rounded-2xl p-6 shadow-soft">
        <h3 className="font-semibold">AI API health</h3>
        <p className="mt-2 text-sm text-muted-foreground">Model v2.4 · Last deploy May 18 · Error rate 0.02%</p>
      </Card>
    </DashboardShell>
  );
}
