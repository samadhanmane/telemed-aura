import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, CalendarCheck, Video, AlertTriangle, Clock, Pill, FileText } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { StatCard } from "@/components/dashboard/StatCard";
import { AppointmentStatusBadge } from "@/components/dashboard/AppointmentStatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { fetchDoctorDashboard } from "@/lib/api/dashboard";
import type { AppointmentStatus } from "@/types/healthcare";

export const Route = createFileRoute("/doctor/")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Dashboard — Doctor" }] }),
  component: DoctorHome,
});

function DoctorHome() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({ queryKey: ["doctor-dashboard"], queryFn: fetchDoctorDashboard });

  const queue = (data?.queue ?? []) as {
    id: string;
    patientName?: string;
    time: string;
    specialization: string;
    status: string;
  }[];

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold md:text-3xl">Welcome, {user?.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Today&apos;s clinic — patients, queue & alerts</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total patients" value={data?.stats.totalPatients ?? 0} icon={Users} />
          <StatCard
            label="Today"
            value={data?.stats.todayAppointments ?? 0}
            icon={CalendarCheck}
            tone="text-primary bg-primary-soft"
          />
          <StatCard
            label="Pending"
            value={data?.stats.pendingConsultations ?? 0}
            icon={Clock}
            tone="text-warning bg-warning/10"
          />
          <StatCard
            label="Completed"
            value={data?.stats.completedConsultations ?? 0}
            icon={Video}
            tone="text-success bg-success/10"
          />
          <StatCard
            label="Your rating"
            value={
              data?.stats.rating != null
                ? `${data.stats.rating} ★`
                : "—"
            }
            icon={Users}
          />
          <StatCard
            label="Emergency alerts"
            value={data?.stats.emergencyAlerts ?? 0}
            icon={AlertTriangle}
            tone="text-destructive bg-destructive/10"
          />
        </div>

        {data?.profile && (
          <Card className="mt-4 rounded-2xl border-success/30 bg-success/5 px-4 py-3 text-sm">
            <p className="font-medium text-success">
              Account live · {data.profile.specialty}
            </p>
            <p className="text-xs text-muted-foreground">
              Patients can find and book you on the portal.
            </p>
          </Card>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto py-3" asChild>
            <Link to="/doctor/appointments">Start consultation</Link>
          </Button>
          <Button variant="outline" className="h-auto py-3" asChild>
            <Link to="/doctor/prescriptions">
              <Pill className="mr-2 h-4 w-4" /> Prescriptions
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-3" asChild>
            <Link to="/doctor/reports">
              <FileText className="mr-2 h-4 w-4" /> Reports
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-3" asChild>
            <Link to="/doctor/availability">Manage availability</Link>
          </Button>
        </div>

        {data?.emergencyAlerts?.length ? (
          <Card className="mt-6 rounded-2xl border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-destructive">Emergency AI alerts</p>
            <ul className="mt-2 space-y-1 text-xs">
              {data.emergencyAlerts.map((a) => (
                <li key={a.id}>
                  Risk {a.risk}% — {a.symptoms}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card className="mt-6 rounded-2xl border-border/60 p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Consultation queue</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/doctor/appointments">View all</Link>
            </Button>
          </div>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No patients in queue right now.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {queue.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-semibold">{a.patientName ?? "Patient"}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.time} · {a.specialization}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AppointmentStatusBadge status={a.status as AppointmentStatus} />
                    {(a.status === "confirmed" || a.status === "in_progress") && (
                      <Button size="sm" asChild>
                        <Link to="/doctor/consult/$appointmentId" params={{ appointmentId: a.id }}>
                          Join video
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
