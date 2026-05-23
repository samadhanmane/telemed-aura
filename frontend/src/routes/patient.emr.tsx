import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmrView } from "@/components/emr/EmrView";
import { fetchMyEmr, recordMyVitals } from "@/lib/api/emr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/patient/emr")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Health Record (EMR) — Patient" }] }),
  component: PatientEmrPage,
});

function PatientEmrPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-emr"], queryFn: fetchMyEmr });
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    sugarLevel: "",
    oxygenLevel: "",
  });

  const saveVitals = useMutation({
    mutationFn: () =>
      recordMyVitals({
        bloodPressureSystolic: vitals.bloodPressureSystolic
          ? Number(vitals.bloodPressureSystolic)
          : undefined,
        bloodPressureDiastolic: vitals.bloodPressureDiastolic
          ? Number(vitals.bloodPressureDiastolic)
          : undefined,
        sugarLevel: vitals.sugarLevel ? Number(vitals.sugarLevel) : undefined,
        oxygenLevel: vitals.oxygenLevel ? Number(vitals.oxygenLevel) : undefined,
      }),
    onSuccess: () => {
      toast.success("Vitals added to your health record");
      qc.invalidateQueries({ queryKey: ["my-emr"] });
    },
    onError: () => toast.error("Could not save vitals"),
  });

  if (isLoading || !data) {
    return (
      <DashboardShell nav={patientNav} title="Patient" role="patient">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="My health record (EMR)"
          description="Complete medical history: vitals, consultations, prescriptions, reports, and AI scans — updated after every visit."
        />

        <Card className="mt-6 rounded-2xl p-4 shadow-soft">
          <p className="text-sm font-medium">Log vitals now</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div>
              <Label className="text-xs">BP systolic</Label>
              <Input
                type="number"
                placeholder="120"
                value={vitals.bloodPressureSystolic}
                onChange={(e) => setVitals((v) => ({ ...v, bloodPressureSystolic: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">BP diastolic</Label>
              <Input
                type="number"
                placeholder="80"
                value={vitals.bloodPressureDiastolic}
                onChange={(e) => setVitals((v) => ({ ...v, bloodPressureDiastolic: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Blood sugar (mg/dL)</Label>
              <Input
                type="number"
                value={vitals.sugarLevel}
                onChange={(e) => setVitals((v) => ({ ...v, sugarLevel: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">SpO₂ %</Label>
              <Input
                type="number"
                value={vitals.oxygenLevel}
                onChange={(e) => setVitals((v) => ({ ...v, oxygenLevel: e.target.value }))}
              />
            </div>
          </div>
          <Button className="mt-3" size="sm" onClick={() => saveVitals.mutate()} disabled={saveVitals.isPending}>
            Save to EMR
          </Button>
        </Card>

        <div className="mt-8">
          <EmrView emr={data.emr} mode="patient" latestSnapshot={data.latestSnapshot} />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/patient/settings" className="text-primary underline-offset-4 hover:underline">
            Update profile, allergies, and chronic conditions in Settings
          </Link>
        </p>
      </div>
    </DashboardShell>
  );
}
