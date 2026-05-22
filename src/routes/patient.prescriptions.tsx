import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Download, Printer } from "lucide-react";

export const Route = createFileRoute("/patient/prescriptions")({
  head: () => ({ meta: [{ title: "Prescriptions" }] }),
  component: PrescriptionsPage,
});

const list = [
  {
    id: 1,
    doctor: "Dr. Meera Iyer",
    spec: "Cardiology",
    date: "Aug 14, 2025",
    meds: [
      { name: "Amoxicillin 500mg", dose: "1 tab", freq: "3× daily", days: 5 },
      { name: "Paracetamol 650mg", dose: "1 tab", freq: "as needed", days: 3 },
    ],
    notes: "Take after meals. Report any rash or breathing issues immediately.",
  },
  {
    id: 2,
    doctor: "Dr. Priya Shah",
    spec: "General Physician",
    date: "Aug 02, 2025",
    meds: [{ name: "Vitamin D3 60k IU", dose: "1 sachet", freq: "weekly", days: 56 }],
    notes: "Mix in warm water. Take in the morning.",
  },
];

function PrescriptionsPage() {
  return (
    <DashboardShell nav={patientNav} title="Patient">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Prescriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">All your digital prescriptions in one place.</p>

        <div className="mt-6 space-y-5">
          {list.map((p) => (
            <Card key={p.id} className="overflow-hidden rounded-3xl border-border/60 shadow-soft">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-muted/30 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{p.doctor}</div>
                    <div className="text-xs text-muted-foreground">{p.spec} · {p.date}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Printer className="mr-1 h-4 w-4" /> Print</Button>
                  <Button size="sm" className="bg-gradient-primary text-primary-foreground"><Download className="mr-1 h-4 w-4" /> Download</Button>
                </div>
              </div>
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        <th className="pb-3">Medicine</th>
                        <th className="pb-3">Dose</th>
                        <th className="pb-3">Frequency</th>
                        <th className="pb-3 text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {p.meds.map((m) => (
                        <tr key={m.name}>
                          <td className="py-3 font-medium">{m.name}</td>
                          <td className="py-3 text-muted-foreground">{m.dose}</td>
                          <td className="py-3 text-muted-foreground">{m.freq}</td>
                          <td className="py-3 text-right text-muted-foreground">{m.days} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Notes</span>
                  <p className="mt-1 text-foreground">{p.notes}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
