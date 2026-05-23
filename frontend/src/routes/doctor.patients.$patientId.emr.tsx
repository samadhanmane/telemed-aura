import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { EmrView } from "@/components/emr/EmrView";
import { fetchPatientEmrForDoctor } from "@/lib/api/emr";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/doctor/patients/$patientId/emr")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Patient EMR — Doctor" }] }),
  component: DoctorPatientEmrPage,
});

function DoctorPatientEmrPage() {
  const { patientId } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["patient-emr", patientId],
    queryFn: () => fetchPatientEmrForDoctor(patientId),
  });

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/doctor/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to patients
          </Link>
        </Button>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">
            You can only view EMR for patients you have consulted with.
          </p>
        )}
        {data && (
          <EmrView
            emr={data.emr}
            mode="doctor"
            patientId={patientId}
            latestSnapshot={data.latestSnapshot}
            doctorNote={data.doctorClinicalNote.content}
          />
        )}
      </div>
    </DashboardShell>
  );
}
