import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  fetchMyAvailability,
  updateMyAvailability,
  type DaySchedule,
  type DoctorAvailability,
} from "@/lib/api/doctors";

export const Route = createFileRoute("/doctor/availability")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Availability — Doctor" }] }),
  component: DoctorAvailability,
});

const DAY_LABELS: { key: keyof DoctorAvailability["weekly"]; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

function DoctorAvailability() {
  const qc = useQueryClient();
  const { data: availability, isLoading } = useQuery({
    queryKey: ["doctor-availability"],
    queryFn: fetchMyAvailability,
  });

  const saveMutation = useMutation({
    mutationFn: (next: DoctorAvailability) => updateMyAvailability(next),
    onSuccess: () => {
      toast.success("Availability saved");
      qc.invalidateQueries({ queryKey: ["doctor-availability"] });
      qc.invalidateQueries({ queryKey: ["doctor-slots"] });
    },
    onError: () => toast.error("Could not save availability"),
  });

  if (isLoading || !availability) {
    return (
      <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  const [draft, setDraft] = useState<DoctorAvailability>(availability);

  useEffect(() => {
    if (availability) setDraft(availability);
  }, [availability]);

  const patchDay = (key: keyof DoctorAvailability["weekly"], patch: Partial<DaySchedule>) => {
    setDraft((prev) => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [key]: { ...prev.weekly[key], ...patch },
      },
    }));
  };

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Availability"
          description="Free slots for patient booking and in-call follow-ups use this schedule."
        />
        <Card className="mt-6 rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Accepting appointments</p>
              <p className="text-xs text-muted-foreground">Off = no slots shown to patients</p>
            </div>
            <Switch
              checked={draft.acceptingAppointments}
              onCheckedChange={(checked) =>
                setDraft((prev) => ({ ...prev, acceptingAppointments: checked }))
              }
            />
          </div>
        </Card>
        <Card className="mt-4 rounded-2xl p-6 shadow-soft">
          <h3 className="font-semibold">Weekly schedule</h3>
          <div className="mt-4 space-y-4">
            {DAY_LABELS.map(({ key, label }) => {
              const day = draft.weekly[key];
              return (
                <div
                  key={key}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 p-4"
                >
                  <span className="w-12 font-medium">{label}</span>
                  <Input
                    className="w-28"
                    type="time"
                    value={day?.start ?? "09:00"}
                    onChange={(e) => patchDay(key, { start: e.target.value })}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    className="w-28"
                    type="time"
                    value={day?.end ?? "17:30"}
                    onChange={(e) => patchDay(key, { end: e.target.value })}
                  />
                  <Switch
                    checked={day?.enabled ?? false}
                    onCheckedChange={(enabled) => patchDay(key, { enabled })}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-6 space-y-2">
            <Label>Block a date (no slots)</Label>
            <Input
              type="date"
              onBlur={(e) => {
                const d = e.target.value;
                if (!d || draft.blockedDates.includes(d)) return;
                setDraft((prev) => ({
                  ...prev,
                  blockedDates: [...prev.blockedDates, d],
                }));
                e.target.value = "";
              }}
            />
            {draft.blockedDates.length > 0 && (
              <ul className="text-xs text-muted-foreground">
                {draft.blockedDates.map((d) => (
                  <li key={d} className="flex items-center justify-between gap-2 py-1">
                    {d}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          blockedDates: prev.blockedDates.filter((x) => x !== d),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button
            className="mt-6 bg-gradient-primary text-primary-foreground"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate(draft)}
          >
            {saveMutation.isPending ? "Saving…" : "Save schedule"}
          </Button>
        </Card>
      </div>
    </DashboardShell>
  );
}
