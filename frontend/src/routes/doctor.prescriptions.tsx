import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor/prescriptions")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Prescriptions — Doctor" }] }),
  component: DoctorPrescriptions,
});

function DoctorPrescriptions() {
  const [meds, setMeds] = useState([{ name: "", dosage: "", frequency: "", duration: "" }]);

  const addMed = () => setMeds([...meds, { name: "", dosage: "", frequency: "", duration: "" }]);
  const removeMed = (i: number) => setMeds(meds.filter((_, idx) => idx !== i));

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Prescription builder" description="Create digital prescriptions for patients." />
        <Card className="mt-6 rounded-2xl p-6 shadow-soft">
          <div className="space-y-2">
            <Label>Patient name</Label>
            <Input placeholder="Search patient…" />
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
                <Input placeholder="Medicine" value={m.name} onChange={(e) => {
                  const next = [...meds];
                  next[i].name = e.target.value;
                  setMeds(next);
                }} />
                <Input placeholder="Dosage" value={m.dosage} onChange={(e) => {
                  const next = [...meds];
                  next[i].dosage = e.target.value;
                  setMeds(next);
                }} />
                <Input placeholder="Frequency" value={m.frequency} onChange={(e) => {
                  const next = [...meds];
                  next[i].frequency = e.target.value;
                  setMeds(next);
                }} />
                <div className="flex gap-2">
                  <Input placeholder="Duration" value={m.duration} onChange={(e) => {
                    const next = [...meds];
                    next[i].duration = e.target.value;
                    setMeds(next);
                  }} />
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
            <Textarea placeholder="Take after meals…" />
          </div>
          <div className="mt-6 flex gap-2">
            <Button className="bg-gradient-primary text-primary-foreground" onClick={() => toast.success("Prescription saved")}>
              Save & send
            </Button>
            <Button variant="outline">Print</Button>
            <Button variant="outline">Download PDF</Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
