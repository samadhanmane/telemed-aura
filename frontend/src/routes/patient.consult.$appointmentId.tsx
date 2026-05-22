import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth/guards";
import { ConsultRoom } from "@/features/video/components/ConsultRoom";

export const Route = createFileRoute("/patient/consult/$appointmentId")({
  beforeLoad: () => requireRole("patient"),
  component: PatientConsult,
});

function PatientConsult() {
  const { appointmentId } = Route.useParams();
  return (
    <ConsultRoom
      appointmentId={appointmentId}
      role="patient"
      exitTo="/patient/appointments"
    />
  );
}
