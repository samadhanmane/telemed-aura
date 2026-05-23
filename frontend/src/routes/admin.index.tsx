import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Stethoscope,
  CalendarCheck,
  Brain,
  Activity,
  Server,
  AlertTriangle,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAdminDashboard } from "@/lib/api/dashboard";
import { resolveUploadUrl } from "@/lib/api/upload-url";
import { DownloadFileButton } from "@/components/files/DownloadFileButton";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Admin Dashboard" }] }),
  component: AdminHome,
});

function AdminHome() {
  const { data } = useQuery({ queryKey: ["admin-dashboard"], queryFn: fetchAdminDashboard });

  const stats = data?.stats as Record<string, number> | undefined;
  const health = data?.systemHealth as {
    api: string;
    database: string;
    aiService: string;
    uptimePercent: number;
  } | undefined;
  const pending = (data?.pendingDoctorApplications ?? []) as {
    id: string;
    name: string;
    email: string;
    specialty: string;
    licenseNumber: string;
    certificateUrl?: string;
    submittedAt: string;
  }[];

  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold md:text-3xl">Platform control center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Users, doctor verification, consultations, AI monitoring & system health
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total users" value={stats?.totalUsers?.toLocaleString() ?? "0"} icon={Users} />
          <StatCard
            label="Live doctors"
            value={stats?.activeDoctors ?? 0}
            icon={Stethoscope}
            tone="text-primary bg-primary-soft"
          />
          <StatCard
            label="Pending doctors"
            value={stats?.pendingDoctorApplications ?? 0}
            icon={ClipboardList}
            tone="text-warning bg-warning/10"
          />
          <StatCard label="Patients" value={stats?.totalPatients?.toLocaleString() ?? "0"} icon={Users} />
          <StatCard label="Appts today" value={stats?.appointmentsToday ?? 0} icon={CalendarCheck} />
          <StatCard
            label="AI scans today"
            value={stats?.aiScansToday ?? 0}
            icon={Brain}
            tone="text-accent bg-accent-soft"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/admin/doctors">Review doctor applications</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/users">User management</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/ai-monitoring">AI monitoring</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/analytics">Platform analytics</Link>
          </Button>
        </div>

        {(stats?.pendingDoctorApplications ?? 0) > 0 && (
          <Card className="mt-6 rounded-2xl border-warning/40 bg-warning/5 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Doctor applications awaiting review</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.pendingDoctorApplications} certificate(s) need your approval before doctors go live.
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/admin/doctors">Review all</Link>
              </Button>
            </div>
            <ul className="mt-4 space-y-3">
              {pending.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/80 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.specialty} · {d.licenseNumber} · {d.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {resolveUploadUrl(d.certificateUrl) && (
                      <>
                        <Button size="sm" variant="outline" asChild>
                          <a href={resolveUploadUrl(d.certificateUrl)} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Certificate
                          </a>
                        </Button>
                        <DownloadFileButton
                          fileUrl={d.certificateUrl}
                          fileName={`${d.name}-certificate`}
                          label="Download"
                          size="sm"
                        />
                      </>
                    )}
                    <Button size="sm" asChild>
                      <Link to="/admin/doctors">Review</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-success" />
              <div>
                <p className="font-semibold">System health</p>
                <p className="text-2xl font-bold text-success">{health?.uptimePercent ?? 99}%</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>API</span>
                <Badge variant="outline">{health?.api ?? "operational"}</Badge>
              </li>
              <li className="flex justify-between">
                <span>Database</span>
                <Badge variant="outline">{health?.database ?? "connected"}</Badge>
              </li>
              <li className="flex justify-between">
                <span>AI service</span>
                <Badge variant="outline">{health?.aiService ?? "operational"}</Badge>
              </li>
              <li>Total consultations — {stats?.totalConsultations ?? 0}</li>
            </ul>
          </Card>

          <Card className="rounded-2xl p-6 shadow-soft">
            <p className="font-semibold">Emergency monitoring</p>
            <ul className="mt-4 space-y-3 text-sm">
              {(data?.criticalAlerts as { id: string; risk: number; symptoms: string }[])?.length ? (
                (data.criticalAlerts as { id: string; risk: number; symptoms: string }[]).map((c) => (
                  <li key={c.id} className="rounded-lg bg-destructive/10 p-3">
                    High risk ({c.risk}%) — {c.symptoms}
                  </li>
                ))
              ) : (
                <li className="rounded-lg bg-muted/50 p-3 text-muted-foreground">No critical cases right now</li>
              )}
              <li className="flex items-center justify-between rounded-lg bg-warning/10 p-3">
                <span>Emergency cases (all time)</span>
                <Badge variant="secondary">{stats?.emergencyCases ?? 0}</Badge>
              </li>
            </ul>
          </Card>
        </div>

        <Card className="mt-6 rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <p className="font-semibold">Platform snapshot</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {stats?.totalConsultations ?? 0} consultations · {stats?.totalPatients ?? 0} patients ·{" "}
            {stats?.activeDoctors ?? 0} verified doctors on the public site · {stats?.aiScansToday ?? 0} AI scans
            today
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}
