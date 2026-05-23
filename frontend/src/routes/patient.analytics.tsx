import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchPatientAnalytics } from "@/lib/api/dashboard";
import { CHART_COLORS, SEVERITY_COLORS } from "@/components/analytics/chart-theme";
import { MetricInfo } from "@/components/analytics/MetricInfo";

export const Route = createFileRoute("/patient/analytics")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Health Analytics — Patient" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: a, isLoading } = useQuery({
    queryKey: ["patient-analytics"],
    queryFn: fetchPatientAnalytics,
  });

  const consultFreq = (a?.consultationFrequency as { month: string; count: number }[]) ?? [];
  const healthTrend = (a?.healthScoreTrend as { label: string; score: number }[]) ?? [];
  const bp = (a?.bloodPressure as { label: string; systolic: number; diastolic: number }[]) ?? [];
  const sugar = (a?.bloodSugar as { label: string; fasting: number }[]) ?? [];
  const weight = (a?.weightHistory as { label: string; kg: number }[]) ?? [];
  const reportMarkers = (a?.reportMarkers as { report: string; marker: string; value: number }[]) ?? [];
  const severityBreakdown =
    (a?.severityBreakdown as { name: string; value: number }[]) ?? [];
  const symptomSeverityBreakdown =
    (a?.symptomSeverityBreakdown as { name: string; value: number }[]) ?? [];
  const riskTrend = (a?.riskTrend as { label: string; risk: number }[]) ?? [];

  const markerPie = reportMarkers.slice(0, 6).map((m) => ({
    name: `${m.marker}`,
    value: m.value,
  }));

  const wellnessRadial = [
    {
      name: "Wellness",
      score: a?.healthScore ?? 82,
      fill: "hsl(var(--primary))",
    },
  ];

  const hasBp = bp.length > 0;
  const hasSugar = sugar.length > 0;

  if (isLoading) {
    return (
      <DashboardShell nav={patientNav} title="Patient" role="patient">
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Health analytics"
          description="Trends from AI scans, vitals, and lab values. Charts use different types to compare wellness, urgency, and labs."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card className="rounded-2xl border-border/60 p-4">
            <MetricInfo label="Wellness score">
              0–100 index from your profile and recent activity. Higher is better — not a clinical
              diagnosis.
            </MetricInfo>
            <p className="mt-2 text-3xl font-bold">{a?.healthScore ?? "—"}</p>
          </Card>
          <Card className="rounded-2xl border-border/60 p-4">
            <MetricInfo label="Screening risk (latest scan)">
              0–100 urgency from rule-based symptom triage. Higher means seek care sooner.
            </MetricInfo>
            <p className="mt-2 text-3xl font-bold">
              {riskTrend.length ? `${riskTrend[riskTrend.length - 1]?.risk ?? "—"}%` : "—"}
            </p>
          </Card>
        </div>

        {!hasBp && !hasSugar && reportMarkers.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Upload a blood test in{" "}
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/patient/doc-assistant" search={{ tab: "upload" }}>
                Doc Assistant
              </Link>
            </Button>{" "}
            or enter vitals in AI Health Scanner to see BP, sugar, and lab trends here.
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard title="Wellness score (radial)">
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={wellnessRadial}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar dataKey="score" cornerRadius={8} />
                <Tooltip />
                <text x="50%" y="52%" textAnchor="middle" className="fill-foreground text-2xl font-bold">
                  {a?.healthScore ?? "—"}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Health score trend (area)">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={healthTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  name="Wellness"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {riskTrend.length > 0 && (
            <ChartCard title="Screening urgency by scan (line)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={riskTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    name="Screening %"
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <ChartCard title="Consultation frequency (bar)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={consultFreq}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {symptomSeverityBreakdown.length > 0 && (
            <ChartCard title="AI scan severity mix (donut)">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={symptomSeverityBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {symptomSeverityBreakdown.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={SEVERITY_COLORS[entry.name] ?? CHART_COLORS[0]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <ChartCard title="Blood pressure (line)">
            {hasBp ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={bp}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="systolic" stroke="hsl(var(--primary))" name="Systolic" />
                  <Line type="monotone" dataKey="diastolic" stroke="hsl(var(--accent))" name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartHint />
            )}
          </ChartCard>

          <ChartCard title="Blood sugar (area)">
            {hasSugar ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={sugar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="fasting"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                    name="Glucose"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartHint />
            )}
          </ChartCard>

          {markerPie.length > 0 && (
            <ChartCard title="Latest lab markers (pie)">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={markerPie} dataKey="value" nameKey="name" outerRadius={80} label>
                    {markerPie.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {severityBreakdown.length > 0 && (
            <ChartCard title="Report screening severity (pie)">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={severityBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                  >
                    {severityBreakdown.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={SEVERITY_COLORS[entry.name] ?? CHART_COLORS[1]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <ChartCard title="Weight history (line)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weight}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip />
                <Line type="monotone" dataKey="kg" stroke="hsl(var(--primary))" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </DashboardShell>
  );
}

function EmptyChartHint() {
  return (
    <p className="flex h-[220px] items-center justify-center text-center text-xs text-muted-foreground">
      No data yet — upload reports or record vitals.
    </p>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`rounded-2xl border-border/60 p-5 shadow-soft ${className ?? ""}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
