import { createFileRoute } from "@tanstack/react-router";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { CHART_COLORS, SEVERITY_COLORS } from "@/components/analytics/chart-theme";

export const Route = createFileRoute("/admin/analytics")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Analytics — Admin" }] }),
  component: AdminAnalytics,
});

const userGrowth = [
  { m: "Jan", users: 8200 },
  { m: "Feb", users: 9100 },
  { m: "Mar", users: 10200 },
  { m: "Apr", users: 11100 },
  { m: "May", users: 12480 },
];

const apptGrowth = [
  { m: "Jan", appts: 3200 },
  { m: "Feb", appts: 3800 },
  { m: "Mar", appts: 4100 },
  { m: "Apr", appts: 4500 },
  { m: "May", appts: 5200 },
];

const aiSeverity = [
  { name: "Low", value: 52 },
  { name: "Moderate", value: 30 },
  { name: "High", value: 14 },
  { name: "Critical", value: 4 },
];

function AdminAnalytics() {
  const combined = userGrowth.map((u, i) => ({
    m: u.m,
    users: u.users,
    appts: apptGrowth[i]?.appts ?? 0,
  }));

  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="Analytics" description="User growth, appointments, and AI triage distribution." />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl p-6 shadow-soft">
          <h3 className="font-semibold">User growth (area)</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="m" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#2563eb" fill="#2563eb33" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="rounded-2xl p-6 shadow-soft">
          <h3 className="font-semibold">Appointment growth (bar)</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={apptGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="m" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appts" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="rounded-2xl p-6 shadow-soft">
          <h3 className="font-semibold">AI scan severity (donut)</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aiSeverity}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  label
                >
                  {aiSeverity.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SEVERITY_COLORS[entry.name] ?? CHART_COLORS[0]}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="rounded-2xl p-6 shadow-soft">
          <h3 className="font-semibold">Users vs appointments (line)</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combined}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="m" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#2563eb" />
                <Line type="monotone" dataKey="appts" stroke="#14b8a6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
