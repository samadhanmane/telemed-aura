import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Sparkles, Video, ChevronRight } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/dashboard/AppointmentStatusBadge";
import { useAuthStore } from "@/stores/auth-store";
import { useAppointments } from "@/lib/api/hooks/use-appointments";
import { fetchSpecialties } from "@/lib/api/auth";

export const Route = createFileRoute("/patient/")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Dashboard — Patient" }] }),
  component: PatientHome,
});

function PatientHome() {
  const user = useAuthStore((s) => s.user);
  const { data: appointments = [] } = useAppointments();
  const { data: specialties = [] } = useQuery({
    queryKey: ["specialties"],
    queryFn: fetchSpecialties,
  });

  const upcoming = appointments.filter((a) => !["completed", "cancelled"].includes(a.status)).slice(0, 3);

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient" showInsights>
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold md:text-3xl">
          Hello, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Book specialists by category — real-time from your clinic data.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {specialties.slice(0, 4).map((s) => (
            <Button key={s.id} variant="outline" className="h-auto py-3" asChild>
              <Link to="/patient/doctors">{s.label.split(" ")[0]}</Link>
            </Button>
          ))}
        </div>

        <Card className="mt-6 rounded-3xl bg-gradient-primary p-6 text-primary-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-80">AI scanner</p>
                <p className="font-semibold">Coming soon — triage & priority booking</p>
              </div>
            </div>
            <Button variant="secondary" disabled>
              Soon
            </Button>
          </div>
        </Card>

        <Card className="mt-6 rounded-2xl p-6 shadow-soft">
          <div className="mb-4 flex justify-between">
            <h2 className="font-semibold">Upcoming appointments</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/patient/appointments">View all</Link>
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming visits. <Link to="/patient/doctors" className="text-primary">Book now</Link></p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold">{a.doctorName}</p>
                    <p className="text-xs text-muted-foreground">{a.date} · {a.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AppointmentStatusBadge status={a.status} />
                    {a.status === "confirmed" && (
                      <Button size="sm" asChild>
                        <Link to="/patient/consult/$appointmentId" params={{ appointmentId: a.id }}>Join</Link>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Button className="mt-6" asChild>
          <Link to="/patient/doctors">
            Book appointment <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </DashboardShell>
  );
}
