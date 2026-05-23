import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, ImageIcon, FileStack } from "lucide-react";
import type { ReportScanSummary } from "@/lib/api/clinical";

const STATUS_STYLE: Record<string, string> = {
  success: "bg-success/15 text-success",
  partial: "bg-warning/15 text-warning",
  failed: "bg-destructive/15 text-destructive",
};

export function ReportScanProgressPanel({ scan }: { scan: ReportScanSummary }) {
  const remaining = scan.pagesRemaining?.length ?? [];

  return (
    <div className="rounded-xl border border-border/50 bg-background/80 p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <FileStack className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold">Document scan</span>
        <Badge variant="secondary">{scan.scanSuccessPercent}% pages OK</Badge>
        <Badge variant="outline">{scan.dataRetrievalPercent}% text retrieved</Badge>
      </div>

      <p className="mt-2 text-muted-foreground">{scan.summaryShort}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex justify-between">
            <span>Page scan success</span>
            <span className="font-medium">{scan.pagesScanned}/{scan.totalPages}</span>
          </div>
          <Progress value={scan.scanSuccessPercent} className="h-2" />
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <span>Data retrieval</span>
            <span className="font-medium">{scan.dataRetrievalPercent}%</span>
          </div>
          <Progress value={scan.dataRetrievalPercent} className="h-2" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
        <span className="flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          {scan.imagesDetected} image(s) in file
        </span>
        <span>{scan.imagesOcred} processed with OCR/vision</span>
        {scan.pagesFailed > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertCircle className="h-3 w-3" />
            {scan.pagesFailed} page(s) incomplete
          </span>
        )}
      </div>

      {remaining.length > 0 && (
        <p className="mt-2 text-destructive">
          Pages still needing a clearer scan: {remaining.join(", ")}
        </p>
      )}

      {scan.pageDetails && scan.pageDetails.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {scan.pageDetails.map((p) => (
            <span
              key={p.page_num}
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 ${STATUS_STYLE[p.status] ?? "bg-muted"}`}
              title={`${p.method} · ${p.char_count} chars · ${p.image_count} img`}
            >
              {p.status === "success" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              p{p.page_num}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
