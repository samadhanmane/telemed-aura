import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Pill, CalendarCheck, Sparkles, AlertTriangle, FileText } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/notifications")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Notifications" }] }),
  component: NotificationsPage,
});

const iconMap: Record<string, typeof Bell> = {
  appointment: CalendarCheck,
  prescription: Pill,
  medicine_reminder: Pill,
  ai_alert: Sparkles,
  emergency: AlertTriangle,
  report: FileText,
};

function NotificationsPage() {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageHeader
            title="Notifications"
            description="Appointment reminders, medicine alerts, AI insights, and report updates."
          />
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            Mark all read
          </Button>
        </div>

        <ul className="mt-6 space-y-3">
          {list.map((n) => {
            const Icon = iconMap[n.type] ?? Bell;
            return (
              <Card
                key={n.id}
                className={cn(
                  "cursor-pointer rounded-2xl p-4 shadow-soft transition",
                  !n.read && "border-primary/30 bg-primary-soft/20",
                )}
                onClick={() => !n.read && markOne.mutate(n.id)}
              >
                <div className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{n.title}</p>
                      {!n.read && <Badge>New</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </ul>

        {list.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
      </div>
    </DashboardShell>
  );
}
