import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { fetchDoctorPatients } from "@/lib/api/dashboard";
import {
  createConsultPrescription,
  fetchDoctorPrescriptions,
  type ClinicalMedicine,
} from "@/lib/api/clinical";

export const Route = createFileRoute("/doctor/prescriptions")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Prescriptions — Doctor" }] }),
  component: DoctorPrescriptions,
});

function DoctorPrescriptions() {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [meds, setMeds] = useState<ClinicalMedicine[]>([
    { name: "", dosage: "", frequency: "", duration: "" },
  ]);
  const [instructions, setInstructions] = useState("");

  const { data: patients = [] } = useQuery({
    queryKey: ["doctor-patients-list"],
    queryFn: fetchDoctorPatients,
  });

  const { data: issued = [] } = useQuery({
    queryKey: ["doctor-prescriptions"],
    queryFn: fetchDoctorPrescriptions,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      createConsultPrescription(patientId, {
        medicines: meds.filter((m) => m.name.trim()),
        instructions,
      }),
    onSuccess: () => {
      toast.success("Digital prescription sent to patient");
      setMeds([{ name: "", dosage: "", frequency: "", duration: "" }]);
      setInstructions("");
      queryClient.invalidateQueries({ queryKey: ["doctor-prescriptions"] });
    },
    onError: () => toast.error("Could not save prescription"),
  });

  const addMed = () => setMeds([...meds, { name: "", dosage: "", frequency: "", duration: "" }]);
  const removeMed = (i: number) => setMeds(meds.filter((_, idx) => idx !== i));

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Digital prescriptions"
          description="Issue structured Rx to patients in your care — synced to their EMR and notifications."
        />
        <Card className="mt-6 rounded-2xl p-6 shadow-soft">
          <div className="space-y-2">
            <Label>Patient</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient…" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Medicines</h3>
              <Button size="sm" variant="outline" onClick={addMed}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
            {meds.map((m, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-border/60 p-4 sm:grid-cols-2">
                <Input
                  placeholder="Medicine"
                  value={m.name}
                  onChange={(e) => {
                    const next = [...meds];
                    next[i].name = e.target.value;
                    setMeds(next);
                  }}
                />
                <Input
                  placeholder="Dosage"
                  value={m.dosage}
                  onChange={(e) => {
                    const next = [...meds];
                    next[i].dosage = e.target.value;
                    setMeds(next);
                  }}
                />
                <Input
                  placeholder="Frequency"
                  value={m.frequency}
                  onChange={(e) => {
                    const next = [...meds];
                    next[i].frequency = e.target.value;
                    setMeds(next);
                  }}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Duration"
                    value={m.duration}
                    onChange={(e) => {
                      const next = [...meds];
                      next[i].duration = e.target.value;
                      setMeds(next);
                    }}
                  />
                  {meds.length > 1 && (
                    <Button size="icon" variant="ghost" onClick={() => removeMed(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Label>Instructions</Label>
            <Textarea
              placeholder="Take after meals…"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Button
              className="bg-gradient-primary text-primary-foreground"
              disabled={
                !patientId || !meds.some((m) => m.name.trim()) || saveMutation.isPending
              }
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving…" : "Save & notify patient"}
            </Button>
          </div>
        </Card>

        {issued.length > 0 && (
          <Card className="mt-8 rounded-2xl p-6 shadow-soft">
            <h3 className="font-semibold">Recently issued</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {issued.slice(0, 10).map((rx) => (
                <li key={rx.id} className="rounded-xl border border-border/60 p-3">
                  <p className="font-medium">
                    {"patientName" in rx && rx.patientName ? rx.patientName : "Patient"} · {rx.date}
                  </p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {rx.medicines.map((m, i) => (
                      <li key={i}>
                        {m.name} {m.dosage} — {m.frequency}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
