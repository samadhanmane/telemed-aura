import { createFileRoute } from "@tanstack/react-router";
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
} from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/doctor/analytics")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Analytics — Doctor" }] }),
  component: DoctorAnalytics,
});

const trends = [
  { month: "Jan", consults: 42 },
  { month: "Feb", consults: 48 },
  { month: "Mar", consults: 55 },
  { month: "Apr", consults: 52 },
  { month: "May", consults: 61 },
];

const completion = [
  { week: "W1", rate: 92 },
  { week: "W2", rate: 94 },
  { week: "W3", rate: 91 },
  { week: "W4", rate: 96 },
];

function DoctorAnalytics() {
  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Analytics" description="Consultation trends and completion rates." />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl p-6 shadow-soft">
            <h3 className="font-semibold">Consultation trends</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="consults" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="rounded-2xl p-6 shadow-soft">
            <h3 className="font-semibold">Completion rate %</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
