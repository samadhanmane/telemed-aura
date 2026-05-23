import { Link } from "@tanstack/react-router";
import { FileText, Pill, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PatientEmrPayload } from "@/lib/api/emr";
import type { ClinicalReport } from "@/lib/api/clinical";
import { ReportAnalysisPanel } from "@/components/reports/ReportAnalysisPanel";
import { ReportScanProgressPanel } from "@/components/reports/ReportScanProgressPanel";
import { DoctorReportReviewForm } from "@/components/reports/DoctorReportReviewForm";
import { resolveUploadUrl } from "@/lib/api/upload-url";
import { DownloadFileButton } from "@/components/files/DownloadFileButton";

export function EmrDocumentsSection({
  emr,
  doctorMode = false,
  patientId,
  compact = false,
  onReportReviewed,
}: {
  emr: PatientEmrPayload;
  doctorMode?: boolean;
  patientId?: string;
  compact?: boolean;
  onReportReviewed?: () => void;
}) {
  const { reports, prescriptionUploads, healthNarrative } = emr;

  return (
    <div className="space-y-4">
      {healthNarrative && (
        <Card className="rounded-2xl border-primary/20 bg-primary/5 p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Health summary</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{healthNarrative}</p>
        </Card>
      )}

      <Card className="rounded-2xl p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-medium">
            <FileText className="h-4 w-4" /> Medical reports & scans ({reports.length})
          </p>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
            <Link to="/patient/doc-assistant" search={{ tab: "upload" }}>
              Upload in Doc Assistant
            </Link>
          </Button>
        </div>
        <ScrollArea className={`mt-3 ${compact ? "max-h-[360px]" : "max-h-[480px]"}`}>
          <ul className="space-y-4 pr-3">
            {reports.length === 0 && (
              <li className="text-sm text-muted-foreground">No uploaded reports in EMR yet.</li>
            )}
            {reports.map((r) => (
              <li key={r.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.category} · {r.type} · {r.uploadDate}
                    </p>
                  </div>
                  {r.aiAnalysis && (
                    <Badge
                      variant={
                        r.aiAnalysis.severity === "High" || r.aiAnalysis.severity === "Critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {r.aiAnalysis.severity}
                    </Badge>
                  )}
                </div>
                {(r.scanSummary ?? r.aiAnalysis?.pipeline?.scanSummary) && (
                  <div className="mt-3">
                    <ReportScanProgressPanel
                      scan={(r.scanSummary ?? r.aiAnalysis!.pipeline!.scanSummary)!}
                    />
                  </div>
                )}
                {r.aiAnalysis && <ReportAnalysisPanel analysis={r.aiAnalysis} />}
                {doctorMode && patientId && (
                  <DoctorReportReviewForm
                    report={
                      {
                        id: r.id,
                        patientId,
                        name: r.name,
                        type: r.type,
                        uploadDate: r.uploadDate,
                        category: r.category,
                        fileUrl: r.fileUrl,
                        aiAnalysis: r.aiAnalysis,
                      } satisfies ClinicalReport
                    }
                    onReviewed={() => onReportReviewed?.()}
                  />
                )}
                {resolveUploadUrl(r.fileUrl) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="link" size="sm" className="h-auto p-0" asChild>
                      <a href={resolveUploadUrl(r.fileUrl)} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" /> Open
                      </a>
                    </Button>
                    <DownloadFileButton
                      fileUrl={r.fileUrl}
                      fileName={r.name}
                      label="Download"
                      variant="link"
                      className="h-auto p-0"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Card>

      {(prescriptionUploads?.length ?? 0) > 0 && (
        <Card className="rounded-2xl p-4 shadow-soft">
          <p className="flex items-center gap-2 font-medium">
            <Pill className="h-4 w-4" /> Patient-uploaded prescriptions ({prescriptionUploads!.length})
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {prescriptionUploads!.map((u) => (
              <li key={u.id} className="rounded-lg border border-border/40 px-3 py-2">
                <p className="font-medium">{u.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {u.medicines.map((m) => m.name).join(", ") || "—"}
                </p>
                {resolveUploadUrl(u.fileUrl) && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    <a
                      className="text-xs text-primary hover:underline"
                      href={resolveUploadUrl(u.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                    <DownloadFileButton
                      fileUrl={u.fileUrl}
                      fileName={u.originalName}
                      label="Download"
                      variant="link"
                      className="h-auto p-0 text-xs"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
