import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  ZoomIn,
  ZoomOut,
  User,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { doctorNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchDoctorReports, type ClinicalReport } from "@/lib/api/clinical";
import { resolveUploadUrl } from "@/lib/api/upload-url";
import { DownloadFileButton } from "@/components/files/DownloadFileButton";
import { ReportAnalysisPanel } from "@/components/reports/ReportAnalysisPanel";
import { DoctorReportReviewForm } from "@/components/reports/DoctorReportReviewForm";

export const Route = createFileRoute("/doctor/reports")({
  beforeLoad: () => requireRole("doctor"),
  head: () => ({ meta: [{ title: "Reports — Doctor" }] }),
  component: DoctorReports,
});

function severityVariant(severity?: string) {
  if (severity === "Critical" || severity === "High") return "destructive" as const;
  if (severity === "Moderate") return "secondary" as const;
  return "outline" as const;
}

function DoctorReports() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["doctor-reports"],
    queryFn: fetchDoctorReports,
  });
  const [selected, setSelected] = useState<ClinicalReport | null>(null);
  const [zoom, setZoom] = useState(100);

  const active = selected ?? reports[0] ?? null;

  return (
    <DashboardShell nav={doctorNav} title="Doctor" role="doctor">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Medical reports"
          description="Patient uploads with AI severity, risk scores, and lab charts."
        />

        {isLoading && (
          <p className="mt-6 text-sm text-muted-foreground">Loading patient reports…</p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="max-h-[70vh] space-y-3 overflow-y-auto">
            {reports.map((r) => (
              <Card
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelected(r);
                  setZoom(100);
                }}
                onKeyDown={(e) => e.key === "Enter" && setSelected(r)}
                className={`flex cursor-pointer items-center gap-4 rounded-2xl p-4 shadow-soft transition-colors ${
                  active?.id === r.id ? "border-primary ring-1 ring-primary/30" : ""
                }`}
              >
                <FileText className="h-8 w-8 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {"patientName" in r && r.patientName ? r.patientName : "Patient"} · {r.category} ·{" "}
                    {r.uploadDate}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline">{r.type}</Badge>
                  {r.aiAnalysis && (
                    <Badge variant={severityVariant(r.aiAnalysis.severity)}>
                      {r.aiAnalysis.severity} · {r.aiAnalysis.riskScore}%
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
            {!isLoading && reports.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No reports from your patients yet. They can upload labs from the patient portal.
              </p>
            )}
          </div>

          <Card className="rounded-2xl p-6 shadow-soft">
            <p className="text-sm font-semibold">Report detail & AI analysis</p>
            {!active ? (
              <div className="mt-4 flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
                <FileText className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-2 text-xs text-muted-foreground">Select a report from the list</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div
                  className="flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center top" }}
                >
                  {resolveUploadUrl(active.fileUrl) &&
                  (active.type === "PNG" || active.type === "JPG") ? (
                    <img
                      src={resolveUploadUrl(active.fileUrl)}
                      alt={active.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <>
                      <FileText className="h-16 w-16 text-muted-foreground/50" />
                      <p className="mt-2 px-4 text-center text-xs text-muted-foreground">
                        {active.type === "PDF"
                          ? "PDF preview — open file URL or download from patient record."
                          : "No image preview"}
                      </p>
                      {resolveUploadUrl(active.fileUrl) && (
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                          <a
                            href={resolveUploadUrl(active.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary underline"
                          >
                            Open
                          </a>
                          <DownloadFileButton
                            fileUrl={active.fileUrl}
                            fileName={active.name}
                            label="Download"
                            variant="link"
                            className="h-auto p-0 text-xs"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoom((z) => Math.max(50, z - 15))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="self-center text-xs text-muted-foreground">{zoom}%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoom((z) => Math.min(200, z + 15))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                {active.aiAnalysis && (
                  <>
                    <ReportAnalysisPanel analysis={active.aiAnalysis} />
                    <DoctorReportReviewForm
                      report={active}
                      onReviewed={(updated) => setSelected(updated)}
                    />
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
