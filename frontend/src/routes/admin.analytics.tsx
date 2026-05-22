import { createFileRoute } from "@tanstack/react-router";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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

const aiStats = [
  { name: "Low", value: 45 },
  { name: "Moderate", value: 35 },
  { name: "High", value: 20 },
];

const COLORS = ["#14b8a6", "#2563eb", "#f59e0b"];

function AdminAnalytics() {
  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader title="Analytics" description="User growth, appointments, and AI scan statistics." />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl p-6 shadow-soft">
          <h3 className="font-semibold">User growth</h3>
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
          <h3 className="font-semibold">Appointment growth</h3>
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
        <Card className="rounded-2xl p-6 shadow-soft lg:col-span-2">
          <h3 className="font-semibold">AI scan severity distribution</h3>
          <div className="mt-4 mx-auto h-56 max-w-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={aiStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {aiStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
