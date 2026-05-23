import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Droplets, CalendarCheck, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { healthTips } from "@/data/mock/healthcare";
import { useAuthStore } from "@/stores/auth-store";
import { fetchPatientDashboard } from "@/lib/api/dashboard";
import { fetchHealthSummary } from "@/lib/api/ai";
import { Link } from "@tanstack/react-router";

export function HealthInsightsPanel() {
  const healthScore = useAuthStore((s) => s.user?.healthScore) ?? 82;
  const { data: dash } = useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: fetchPatientDashboard,
  });
  const { data: summary } = useQuery({
    queryKey: ["health-summary"],
    queryFn: fetchHealthSummary,
  });

  const nextAppt = dash?.upcoming?.[0];

  return (
    <aside className="hidden w-72 shrink-0 border-l border-border/60 bg-sidebar/50 p-4 xl:block">
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Health insights
        </h3>

        <Card className="mt-4 rounded-2xl border-border/60 bg-gradient-primary p-4 text-primary-foreground shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
            <TrendingUp className="h-4 w-4" /> Health score
          </div>
          <div className="mt-2 text-3xl font-bold">{dash?.healthScore ?? healthScore}</div>
          <Progress value={dash?.healthScore ?? healthScore} className="mt-3 h-1.5 bg-primary-foreground/20" />
          <p className="mt-2 text-[11px] opacity-80">
            Risk {dash?.healthRisk ?? "—"}% · {dash?.healthStatus?.replace("_", " ") ?? "stable"}
          </p>
        </Card>

        <Card className="mt-4 rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Droplets className="h-4 w-4 text-accent" /> Stay hydrated
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Rural heat tip — drink water regularly.</p>
          <Progress value={75} className="mt-2 h-1.5" />
        </Card>

        <Card className="mt-4 rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarCheck className="h-4 w-4 text-primary" /> Next appointment
          </div>
          {nextAppt ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {nextAppt.doctorName} · {nextAppt.date} {nextAppt.time}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              <Link to="/patient/doctors" className="text-primary hover:underline">
                Book a consult
              </Link>
            </p>
          )}
        </Card>

        <Card className="mt-4 rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> AI suggestion
          </div>
          <p className="mt-2 text-xs text-muted-foreground line-clamp-4">
            {summary?.summary ?? "Run the AI scanner or upload reports for personalized tips."}
          </p>
        </Card>

        <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily tip</p>
          <p className="mt-2 text-sm">{healthTips[0]}</p>
        </div>
      </motion.div>
    </aside>
  );
}
