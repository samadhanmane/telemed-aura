import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/doctor/availability")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Availability — Doctor" }] }),
  component: DoctorAvailability,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function DoctorAvailability() {
  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Availability" description="Weekly schedule and time slots." />
        <Card className="mt-6 rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Accepting appointments</p>
              <p className="text-xs text-muted-foreground">Toggle off when unavailable</p>
            </div>
            <Switch defaultChecked />
          </div>
        </Card>
        <Card className="mt-4 rounded-2xl p-6 shadow-soft">
          <h3 className="font-semibold">Weekly schedule</h3>
          <div className="mt-4 space-y-4">
            {days.map((d) => (
              <div key={d} className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 p-4">
                <span className="w-12 font-medium">{d}</span>
                <Input className="w-28" defaultValue="09:00" type="time" />
                <span className="text-muted-foreground">to</span>
                <Input className="w-28" defaultValue="17:00" type="time" />
                <Switch defaultChecked={d !== "Sun"} />
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <Label>Holiday / block date</Label>
            <Input type="date" />
          </div>
          <Button className="mt-4 bg-gradient-primary text-primary-foreground">Save schedule</Button>
        </Card>
      </div>
    </DashboardShell>
  );
}
