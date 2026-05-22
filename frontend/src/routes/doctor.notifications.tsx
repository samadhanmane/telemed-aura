import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { useNotificationStore } from "@/stores/notification-store";

export const Route = createFileRoute("/doctor/notifications")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Notifications — Doctor" }] }),
  component: DoctorNotifications,
});

const doctorAlerts = [
  { title: "New appointment", message: "Sunita Devi booked for 2:00 PM today", time: "10m ago" },
  { title: "Emergency case", message: "AI flagged high-risk chest pain — pat-002", time: "25m ago" },
  { title: "Schedule reminder", message: "3 consultations remaining today", time: "1h ago" },
];

function DoctorNotifications() {
  const markRead = useNotificationStore((s) => s.markRead);

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <PageHeader title="Notifications" />
      <div className="mt-6 space-y-3">
        {doctorAlerts.map((n, i) => (
          <Card key={i} className="cursor-pointer rounded-2xl p-4 shadow-soft" onClick={() => markRead("n1")}>
            <p className="font-semibold">{n.title}</p>
            <p className="text-xs text-muted-foreground">{n.message}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{n.time}</p>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
