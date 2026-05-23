import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth/guards";
import { DoctorConsultRoom } from "@/features/video/components/DoctorConsultRoom";

export const Route = createFileRoute("/doctor/consult/$appointmentId")({
  beforeLoad: () => requireRole("doctor"),
  component: DoctorConsult,
});

function DoctorConsult() {
  const { appointmentId } = Route.useParams();
  return (
    <DoctorConsultRoom appointmentId={appointmentId} exitTo="/doctor/appointments" />
  );
}
