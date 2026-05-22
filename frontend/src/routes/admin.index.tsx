import { createFileRoute } from "@tanstack/react-router";
import { Users, Stethoscope, CalendarCheck, Brain, Activity, Server } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { adminStats } from "@/data/mock/healthcare";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Admin Dashboard" }] }),
  component: AdminHome,
});

function AdminHome() {
  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold md:text-3xl">System overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Healthcare platform analytics & health</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total users" value={adminStats.totalUsers.toLocaleString()} icon={Users} />
          <StatCard label="Active doctors" value={adminStats.activeDoctors} icon={Stethoscope} tone="text-primary bg-primary-soft" />
          <StatCard label="Patients" value={adminStats.totalPatients.toLocaleString()} icon={Users} />
          <StatCard label="Appts today" value={adminStats.appointmentsToday} icon={CalendarCheck} />
          <StatCard label="AI scans today" value={adminStats.aiScansToday} icon={Brain} tone="text-accent bg-accent-soft" />
          <StatCard label="Revenue" value={adminStats.revenue} icon={Activity} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-success" />
              <div>
                <p className="font-semibold">System health</p>
                <p className="text-2xl font-bold text-success">{adminStats.systemHealth}%</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>API — Operational</li>
              <li>Database — 68% capacity</li>
              <li>Active sessions — 1,240</li>
            </ul>
          </Card>
          <Card className="rounded-2xl p-6 shadow-soft">
            <p className="font-semibold">Recent alerts</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="rounded-lg bg-warning/10 p-3">2 abuse reports pending review</li>
              <li className="rounded-lg bg-destructive/10 p-3">1 emergency AI alert — rural zone Bihar</li>
              <li className="rounded-lg bg-muted/50 p-3">Scheduled maintenance — Sun 2 AM</li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
