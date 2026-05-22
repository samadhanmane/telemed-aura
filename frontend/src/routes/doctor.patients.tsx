import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mockPatients } from "@/data/mock/healthcare";
import type { PatientRecord } from "@/types/healthcare";

export const Route = createFileRoute("/doctor/patients")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Patients — Doctor" }] }),
  component: DoctorPatients,
});

function DoctorPatients() {
  const [search, setSearch] = useState("");
  const filtered = mockPatients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Patients" description="Search, view history, and reports." />
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search patients…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Card className="mt-6 overflow-hidden rounded-2xl shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4 hidden sm:table-cell">Condition</th>
                <th className="p-4 hidden md:table-cell">Last visit</th>
                <th className="p-4">Risk</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((p) => (
                <PatientRow key={p.id} patient={p} />
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </DashboardShell>
  );
}

function PatientRow({ patient }: { patient: PatientRecord }) {
  return (
    <tr>
      <td className="p-4 font-medium">{patient.name}</td>
      <td className="p-4 hidden text-muted-foreground sm:table-cell">{patient.condition}</td>
      <td className="p-4 hidden md:table-cell">{patient.lastVisit}</td>
      <td className="p-4">
        <Badge variant={patient.riskLevel === "high" ? "destructive" : "secondary"}>{patient.riskLevel}</Badge>
      </td>
      <td className="p-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline">
              Profile
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{patient.name}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-3 text-sm">
              <p>Age {patient.age} · {patient.gender}</p>
              <p>{patient.phone}</p>
              <p className="text-muted-foreground">Condition: {patient.condition}</p>
              <p className="text-muted-foreground">Consultation timeline and reports available in full EMR.</p>
            </div>
          </SheetContent>
        </Sheet>
      </td>
    </tr>
  );
}
