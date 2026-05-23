import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileHeart, Calendar } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchDoctorPatientsEmr, type DoctorPatientEmrRow } from "@/lib/api/emr";

export const Route = createFileRoute("/doctor/patients")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Patients — Doctor" }] }),
  component: DoctorPatients,
});

function DoctorPatients() {
  const [search, setSearch] = useState("");

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["doctor-patients-emr"],
    queryFn: fetchDoctorPatientsEmr,
  });

  const filtered = patients
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="My patients"
          description="Everyone you have consulted with — full EMR, upcoming visits, and report summaries."
        />
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Card className="mt-6 overflow-hidden rounded-2xl shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Name</th>
                <th className="hidden p-4 sm:table-cell">Last visit</th>
                <th className="hidden p-4 md:table-cell">Upcoming</th>
                <th className="p-4">Criticality</th>
                <th className="p-4">Summary</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((p: DoctorPatientEmrRow) => (
                <tr key={p.id}>
                  <td className="p-4">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.age != null ? `${p.age}y` : ""}
                      {p.gender ? ` · ${p.gender}` : ""} · {p.totalConsultations} consult(s)
                    </p>
                  </td>
                  <td className="hidden p-4 text-muted-foreground sm:table-cell">{p.lastVisit}</td>
                  <td className="hidden p-4 md:table-cell">
                    {p.upcomingMeeting ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        {p.upcomingMeeting.date} {p.upcomingMeeting.time}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        p.severity === "Critical" || p.emergency || p.riskLevel === "high"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {p.severity ?? p.riskLevel}
                      {p.riskScore != null ? ` · ${p.riskScore}%` : ""}
                    </Badge>
                  </td>
                  <td className="max-w-[200px] p-4 text-xs text-muted-foreground truncate">
                    {p.lastConclusion || `${p.reportCount} reports · ${p.prescriptionCount} Rx`}
                  </td>
                  <td className="p-4">
                    <Button size="sm" asChild>
                      <Link
                        to="/doctor/patients/$patientId/emr"
                        params={{ patientId: p.id }}
                      >
                        <FileHeart className="mr-1 h-4 w-4" />
                        Full EMR
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {!isLoading && filtered.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Patients appear here after they complete a consultation with you.
          </p>
        )}
      </div>
    </DashboardShell>
  );
}
