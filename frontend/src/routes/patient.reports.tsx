import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth/guards";

export const Route = createFileRoute("/patient/reports")({
  beforeLoad: () => {
    requireRole("patient");
    throw redirect({ to: "/patient/doc-assistant", search: { tab: "library" } });
  },
});
