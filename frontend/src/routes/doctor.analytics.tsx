import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Star, TrendingUp, Users } from "lucide-react";
import { fetchDoctorAnalytics } from "@/lib/api/dashboard";
import { CHART_COLORS } from "@/components/analytics/chart-theme";

export const Route = createFileRoute("/doctor/analytics")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Analytics — Doctor" }] }),
  component: DoctorAnalytics,
});

function DoctorAnalytics() {
  const { data: a } = useQuery({
    queryKey: ["doctor-analytics"],
    queryFn: fetchDoctorAnalytics,
  });

  const consultTrend = (a?.consultationTrend as { month: string; consultations: number }[]) ?? [];
  const patientGrowth = (a?.patientGrowth as { month: string; patients: number }[]) ?? [];
  const statusData = (a?.appointmentStatus as { status: string; count: number }[]) ?? [];

  const completionRadial = [{ name: "Done", value: Number(a?.completionRate ?? 0), fill: CHART_COLORS[0] }];

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Practice analytics"
          description="Consultation trends, patient growth, and appointment outcomes."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Completion rate"
            value={`${a?.completionRate ?? 0}%`}
            icon={TrendingUp}
            tone="text-success bg-success/10"
          />
          <StatCard label="Rating" value={a?.rating ?? "—"} icon={Star} tone="text-primary bg-primary-soft" />
          <StatCard label="Reviews" value={a?.reviewCount ?? 0} icon={Users} />
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Specialty demand: <strong>{a?.specialty as string}</strong>
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl p-6 shadow-soft">
            <h3 className="font-semibold">Consultation trends (area)</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consultTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="consultations"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="rounded-2xl p-6 shadow-soft">
            <h3 className="font-semibold">Patient growth (bar)</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="patients" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="rounded-2xl p-6 shadow-soft">
            <h3 className="font-semibold">Appointment status (donut)</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    label
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="rounded-2xl p-6 shadow-soft">
            <h3 className="font-semibold">Completion rate snapshot (pie)</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completed", value: completionRadial[0].value },
                      { name: "Other", value: Math.max(0, 100 - completionRadial[0].value) },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={85}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    <Cell fill={CHART_COLORS[0]} />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
