import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth/guards";
import { ConsultRoom } from "@/features/video/components/ConsultRoom";

export const Route = createFileRoute("/doctor/consult/$appointmentId")({
  beforeLoad: () => requireRole("doctor"),
  component: DoctorConsult,
});

function DoctorConsult() {
  const { appointmentId } = Route.useParams();
  return (
    <ConsultRoom
      appointmentId={appointmentId}
      role="doctor"
      exitTo="/doctor/appointments"
    />
  );
}
