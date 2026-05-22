import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, CalendarCheck, Video, Wallet, AlertTriangle, Clock } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { StatCard } from "@/components/dashboard/StatCard";
import { AppointmentStatusBadge } from "@/components/dashboard/AppointmentStatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { doctorStats } from "@/data/mock/healthcare";
import { useAppointmentStore } from "@/stores/appointment-store";

export const Route = createFileRoute("/doctor/")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Dashboard — Doctor" }] }),
  component: DoctorHome,
});

function DoctorHome() {
  const user = useAuthStore((s) => s.user);
  const appointments = useAppointmentStore((s) => s.appointments);
  const today = appointments.filter((a) => a.date === "Today").slice(0, 4);

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold md:text-3xl">Welcome, {user?.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Today&apos;s clinic overview</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total patients" value={doctorStats.totalPatients} icon={Users} />
          <StatCard label="Today" value={doctorStats.todayAppointments} icon={CalendarCheck} tone="text-primary bg-primary-soft" />
          <StatCard label="Pending" value={doctorStats.pendingConsultations} icon={Clock} tone="text-warning bg-warning/10" />
          <StatCard label="Completed" value={doctorStats.completedToday} icon={Video} tone="text-success bg-success/10" />
          <StatCard label="Revenue" value={doctorStats.revenue} icon={Wallet} tone="text-accent bg-accent-soft" />
          <StatCard label="AI alerts" value={doctorStats.aiAlerts} icon={AlertTriangle} tone="text-destructive bg-destructive/10" />
        </div>

        <Card className="mt-6 rounded-2xl border-border/60 p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Today&apos;s queue</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/doctor/appointments">View all</Link>
            </Button>
          </div>
          <ul className="divide-y divide-border/60">
            {today.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold">{a.patientName ?? "Patient"}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.time} · {a.specialization}
                  </p>
                </div>
                <div className="flex gap-2">
                  <AppointmentStatusBadge status={a.status} />
                  <Button size="sm">Join</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DashboardShell>
  );
}
