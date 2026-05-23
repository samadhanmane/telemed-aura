import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Brain, AlertTriangle, Activity } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchAdminAiMonitoring } from "@/lib/api/dashboard";

export const Route = createFileRoute("/admin/ai-monitoring")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "AI Monitoring — Admin" }] }),
  component: AdminAiMonitoring,
});

function AdminAiMonitoring() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-monitoring"],
    queryFn: fetchAdminAiMonitoring,
  });

  const maxCount = Math.max(...(data?.symptomTrends?.map((s) => s.count) ?? [1]), 1);

  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="AI monitoring" description="Live symptom scans and emergency flags from MongoDB." />
      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Scans today" value={data?.stats.scansToday ?? 0} icon={Brain} />
        <StatCard
          label="Urgent (7d)"
          value={data?.stats.urgentCases ?? 0}
          icon={AlertTriangle}
          tone="text-destructive bg-destructive/10"
        />
        <StatCard label="Total scans" value={data?.stats.totalScans ?? 0} icon={Activity} />
      </div>
      <Card className="mt-6 rounded-2xl p-6 shadow-soft">
        <h3 className="font-semibold">Symptom trends (7 days)</h3>
        <div className="mt-4 space-y-4">
          {(data?.symptomTrends ?? []).map((s) => (
            <div key={s.symptom}>
              <div className="flex justify-between text-sm">
                <span>{s.symptom}</span>
                <span className="text-muted-foreground">{s.count}</span>
              </div>
              <Progress value={(s.count / maxCount) * 100} className="mt-2 h-2" />
            </div>
          ))}
          {!isLoading && (data?.symptomTrends?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">No symptom scans in the last 7 days.</p>
          )}
        </div>
      </Card>
      {(data?.criticalAlerts?.length ?? 0) > 0 && (
        <Card className="mt-6 rounded-2xl p-6 shadow-soft">
          <h3 className="font-semibold text-destructive">Emergency alerts</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {data!.criticalAlerts.map((a) => (
              <li key={a.id} className="rounded-lg bg-destructive/10 px-3 py-2">
                Risk {a.risk}% — {a.symptoms}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </DashboardShell>
  );
}
