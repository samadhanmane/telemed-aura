import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DocAssistantHub } from "@/components/doc-assistant/DocAssistantHub";

const searchSchema = z.object({
  tab: z.enum(["upload", "library", "chat", "doctor-rx"]).optional(),
});

export const Route = createFileRoute("/patient/doc-assistant")({
  validateSearch: searchSchema,
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Doc Assistant — Patient" }] }),
  component: DocAssistantPage,
});

function DocAssistantPage() {
  const { tab } = Route.useSearch();
  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Doc Assistant"
          description="One place to upload lab reports, X-rays, MRIs, and prescriptions — page-by-page scanning, AI analysis, and answers from your documents."
        />
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-0.5">PDF · PNG · JPG · DOCX</span>
          <span>Max 20MB · Multi-page</span>
        </div>
        <div className="mt-6">
          <DocAssistantHub defaultTab={tab ?? "upload"} />
        </div>
      </div>
    </DashboardShell>
  );
}
