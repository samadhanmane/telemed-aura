import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth/guards";
import { PatientConsultRoom } from "@/features/video/components/PatientConsultRoom";

export const Route = createFileRoute("/patient/consult/$appointmentId")({
  beforeLoad: () => requireRole("patient"),
  component: PatientConsult,
});

function PatientConsult() {
  const { appointmentId } = Route.useParams();
  return (
    <PatientConsultRoom appointmentId={appointmentId} exitTo="/patient/appointments" />
  );
}
