import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  Sparkles,
  Video,
  ChevronRight,
  Pill,
  FileText,
  AlertTriangle,
  Upload,
  Stethoscope,
  Activity,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/dashboard/AppointmentStatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fetchPatientDashboard } from "@/lib/api/dashboard";
import type { AppointmentStatus } from "@/types/healthcare";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { MetricInfo } from "@/components/analytics/MetricInfo";

export const Route = createFileRoute("/patient/")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Dashboard — Patient" }] }),
  component: PatientHome,
});

function PatientHome() {
  const { t } = useTranslation();
  const quickActions = [
    {
      to: "/patient/doctors",
      labelKey: "patient.dashboard.bookAppointment",
      icon: CalendarCheck,
      primary: true,
    },
    { to: "/patient/ai-scanner", labelKey: "patient.dashboard.aiScanner", icon: Sparkles },
    {
      to: "/patient/doc-assistant",
      labelKey: "patient.dashboard.docAssistant",
      icon: Upload,
      search: { tab: "upload" as const },
    },
    {
      to: "/patient/doctors",
      labelKey: "patient.dashboard.emergencyConsult",
      icon: AlertTriangle,
      emergency: true,
    },
    {
      to: "/patient/doc-assistant",
      labelKey: "patient.dashboard.scanPrescription",
      icon: Pill,
      search: { tab: "upload" as const },
    },
    { to: "/patient/timeline", labelKey: "patient.dashboard.healthTimeline", icon: Activity },
  ];

  const { data: dash, isLoading } = useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: fetchPatientDashboard,
  });

  const statusText =
    dash?.healthStatus === "needs_attention"
      ? t("patient.dashboard.statusAttention")
      : dash?.healthStatus === "monitor"
        ? t("patient.dashboard.statusMonitor")
        : t("patient.dashboard.statusStable");

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient" showInsights>
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-glow md:p-8">
          <p className="text-sm opacity-90">{dash?.greeting ?? t("patient.dashboard.greeting")},</p>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
            {dash?.userName ?? "there"} 👋
          </h1>
          <p className="mt-2 text-sm opacity-90">{isLoading ? t("common.loading") : statusText}</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="rounded-2xl bg-primary-foreground/15 px-4 py-2">
              <MetricInfo label={t("patient.dashboard.healthScore")}>
                Wellness index 0–100 from your profile, scans, and reports. Higher means better
                overall tracked wellness — not a medical diagnosis.
              </MetricInfo>
              <p className="mt-1 text-2xl font-bold">{dash?.healthScore ?? "—"}</p>
            </div>
            <div className="rounded-2xl bg-primary-foreground/15 px-4 py-2">
              <MetricInfo label={t("patient.dashboard.riskLevel")}>
                Screening urgency index 0–100 from your latest AI symptom scan (rule-based triage).
                Higher means seek care sooner. This is not a diagnosis.
              </MetricInfo>
              <p className="mt-1 text-2xl font-bold">{dash?.healthRisk ?? dash?.screeningRisk ?? "—"}%</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("patient.dashboard.upcomingVisits")}
            value={dash?.stats.upcomingAppointments ?? 0}
            icon={CalendarCheck}
            tone="text-primary bg-primary-soft"
          />
          <StatCard
            label={t("patient.dashboard.activePrescriptions")}
            value={dash?.stats.activePrescriptions ?? 0}
            icon={Pill}
          />
          <StatCard
            label={t("patient.dashboard.reportsOnFile")}
            value={dash?.stats.uploadedReports ?? 0}
            icon={FileText}
          />
          <StatCard
            label={t("patient.dashboard.aiAlerts")}
            value={dash?.stats.aiAlerts ?? 0}
            icon={AlertTriangle}
            tone="text-warning bg-warning/10"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {dash?.lastConsultation && (
            <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t("patient.dashboard.lastConsultation")}</p>
              <p className="mt-1 font-medium">
                {dash.lastConsultation.doctorName} · {dash.lastConsultation.specialization}
              </p>
              <p className="text-xs text-muted-foreground">{dash.lastConsultation.date}</p>
              <Button variant="link" size="sm" className="mt-2 h-auto p-0" asChild>
                <Link to="/patient/appointments">{t("patient.dashboard.viewAppointments")}</Link>
              </Button>
            </Card>
          )}
          {dash?.quickTips && dash.quickTips.length > 0 && (
            <Card className="rounded-2xl bg-muted/40 p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t("patient.dashboard.healthTips")}</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {dash.quickTips.map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {(dash?.stats.aiAlerts ?? 0) > 0 && (
          <Card className="mt-4 rounded-2xl border-warning/40 bg-warning/5 p-4">
            <p className="text-sm font-medium text-warning">
              {t("patient.dashboard.unreadAlerts", { count: dash?.stats.aiAlerts ?? 0 })}
            </p>
            <Button variant="link" size="sm" className="mt-1 h-auto p-0" asChild>
              <Link to="/patient/notifications">{t("patient.dashboard.openNotifications")}</Link>
            </Button>
          </Card>
        )}

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("patient.dashboard.quickActions")}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Button
                key={a.labelKey}
                variant="outline"
                className={cn(
                  "h-auto justify-start gap-3 rounded-2xl px-4 py-4 text-left",
                  a.primary && "border-primary bg-primary-soft",
                  a.emergency && "border-destructive/40 bg-destructive/5",
                )}
                asChild
              >
                <Link to={a.to} search={"search" in a ? a.search : undefined}>
                  <Icon className={cn("h-5 w-5 shrink-0", a.emergency && "text-destructive")} />
                  <span className="font-medium">{t(a.labelKey)}</span>
                </Link>
              </Button>
            );
          })}
        </div>

        <Card className="mt-8 rounded-2xl p-6 shadow-soft">
          <div className="mb-4 flex justify-between">
            <h2 className="font-semibold">{t("patient.dashboard.upcomingTitle")}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/patient/appointments">{t("common.viewAll")}</Link>
            </Button>
          </div>
          {!dash?.upcoming?.length ? (
            <p className="text-sm text-muted-foreground">
              {t("patient.dashboard.noUpcoming")}{" "}
              <Link to="/patient/doctors" search={{ specialty: undefined }} className="text-primary hover:underline">
                {t("patient.dashboard.bookDoctor")}
              </Link>
            </p>
          ) : (
            <ul className="divide-y">
              {dash.upcoming.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-semibold">{a.doctorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.specialization} · {a.date} · {a.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AppointmentStatusBadge status={a.status as AppointmentStatus} />
                    {(a.status === "confirmed" || a.status === "in_progress") && (
                      <Button size="sm" asChild>
                        <Link to="/patient/consult/$appointmentId" params={{ appointmentId: a.id }}>
                          <Video className="mr-1 h-4 w-4" /> {t("patient.dashboard.joinCall")}
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/patient/doctors">
              <Stethoscope className="mr-2 h-4 w-4" />
              {t("patient.dashboard.findDoctor")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/patient/ai-scanner">
              <Sparkles className="mr-2 h-4 w-4" />
              {t("patient.dashboard.runAiScan")}
            </Link>
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
