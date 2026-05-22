import { createFileRoute } from "@tanstack/react-router";
import { Bell, Sparkles, CalendarCheck, Pill, MessageSquare } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/notification-store";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/healthcare";

export const Route = createFileRoute("/patient/notifications")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Notifications" }] }),
  component: NotificationsPage,
});

const icons = {
  appointment: CalendarCheck,
  prescription: Pill,
  message: MessageSquare,
  ai_alert: Sparkles,
  system: Bell,
};

function NotificationsPage() {
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Notifications"
          description="Appointments, prescriptions, AI alerts, and messages."
          action={
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          }
        />
        <div className="mt-6 space-y-3">
          {notifications.map((n: Notification) => {
            const Icon = icons[n.type];
            return (
              <Card
                key={n.id}
                className={cn(
                  "cursor-pointer rounded-2xl border-border/60 p-4 shadow-soft transition-colors hover:bg-muted/30",
                  !n.read && "border-primary/30 bg-primary-soft/20",
                )}
                onClick={() => markRead(n.id)}
              >
                <div className="flex gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-2 text-[10px] text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
