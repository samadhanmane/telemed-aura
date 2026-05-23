import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth/guards";

/** Digital prescriptions from doctors + uploaded Rx scanning live in Doc Assistant. */
export const Route = createFileRoute("/patient/prescriptions")({
  beforeLoad: () => {
    requireRole("patient");
    throw redirect({ to: "/patient/doc-assistant", search: { tab: "doctor-rx" } });
  },
});
