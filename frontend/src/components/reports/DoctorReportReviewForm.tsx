import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  reviewMedicalReport,
  type ClinicalReport,
  type ReportAiAnalysis,
} from "@/lib/api/clinical";

export function DoctorReportReviewForm({
  report,
  onReviewed,
}: {
  report: ClinicalReport;
  onReviewed?: (updated: ClinicalReport) => void;
}) {
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState(report.aiAnalysis?.doctorReview?.remarks ?? "");
  const [severityOverride, setSeverityOverride] = useState<
    ReportAiAnalysis["severity"] | "none"
  >(report.aiAnalysis?.doctorReview?.severityOverride ?? "none");

  const mutation = useMutation({
    mutationFn: () =>
      reviewMedicalReport(report.id, {
        remarks,
        severityOverride: severityOverride === "none" ? undefined : severityOverride,
        confirmedFlags: report.aiAnalysis?.abnormalities?.slice(0, 3),
      }),
    onSuccess: (updated) => {
      toast.success("Clinical review saved — severity updated from your remarks");
      queryClient.invalidateQueries({ queryKey: ["doctor-reports"] });
      queryClient.invalidateQueries({ queryKey: ["patient-context"] });
      onReviewed?.(updated);
    },
    onError: () => toast.error("Could not save review"),
  });

  if (!report.aiAnalysis) return null;

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-xs font-semibold uppercase text-primary">Doctor clinical review</p>
      <p className="text-[11px] text-muted-foreground">
        Your remarks are scanned by rule-based severity rules (same as imaging/PDF flags). You may
        override severity explicitly.
      </p>
      <div className="space-y-2">
        <Label className="text-xs">Remarks</Label>
        <Textarea
          rows={3}
          placeholder="Findings, correlate with symptoms, follow-up…"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Severity override (optional)</Label>
        <Select
          value={severityOverride}
          onValueChange={(v) => setSeverityOverride(v as ReportAiAnalysis["severity"] | "none")}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Use remark-based adjustment only" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Auto from remarks + AI flags</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Moderate">Moderate</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {report.aiAnalysis.doctorReview && (
        <p className="text-[10px] text-muted-foreground">
          Last reviewed {new Date(report.aiAnalysis.doctorReview.reviewedAt).toLocaleString()}
        </p>
      )}
      <Button
        size="sm"
        disabled={!remarks.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Saving…" : "Save review & update severity"}
      </Button>
    </div>
  );
}
