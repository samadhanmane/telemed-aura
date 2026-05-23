import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  FileText,
  MessageCircle,
  Pill,
  Upload,
  Stethoscope,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ReportAnalysisPanel } from "@/components/reports/ReportAnalysisPanel";
import { ReportScanProgressPanel } from "@/components/reports/ReportScanProgressPanel";
import { ReportChatPanel } from "@/components/reports/ReportChatPanel";
import {
  ACCEPTED_FILE_TYPES,
  MAX_REPORT_FILE_BYTES,
  REPORT_CATEGORIES,
  fetchDocumentLibrary,
  uploadDocument,
  validateDocFile,
  type DocumentType,
  type LibraryDocument,
  type UploadDocumentResponse,
} from "@/lib/api/doc-assistant";
import { usePrescriptions } from "@/lib/api/hooks/use-prescriptions";
import { resolveUploadUrl } from "@/lib/api/upload-url";
import { DownloadFileButton } from "@/components/files/DownloadFileButton";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";

const TAB_VALUES = ["upload", "library", "chat", "doctor-rx"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UploadTab({ onUploaded }: { onUploaded?: () => void }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocumentType>("report");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [file, setFile] = useState<File | null>(null);
  const [lastResult, setLastResult] = useState<UploadDocumentResponse | null>(null);

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Choose a file first");
      const err = validateDocFile(file);
      if (err) throw new Error(err);
      return uploadDocument(file, {
        documentType: docType,
        name: name || file.name,
        category: docType === "report" ? category : undefined,
      });
    },
    onSuccess: (data) => {
      setLastResult(data);
      const scan =
        data.documentType === "report"
          ? data.scanSummary
          : data.scanSummary ?? data.result?.scanSummary;
      if (scan) {
        toast.success(
          `Scanned ${scan.pagesScanned}/${scan.totalPages} pages (${scan.scanSuccessPercent}% OK)`,
        );
      } else {
        toast.success(
          data.documentType === "report" ? "Report analyzed" : "Prescription scanned",
        );
      }
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["doc-library"] });
      qc.invalidateQueries({ queryKey: ["my-reports"] });
      qc.invalidateQueries({ queryKey: ["prescription-uploads"] });
      onUploaded?.();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Upload failed")),
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-primary/20 p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Upload className="h-4 w-4 text-primary" />
          Upload & scan document
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, PNG, JPG, DOCX — max 20MB. Multi-page lab reports, X-ray/MRI PDFs, handwritten or
          digital prescriptions. Legacy .doc files are not supported — use DOCX or PDF.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={docType === "report" ? "default" : "outline"}
            size="sm"
            onClick={() => setDocType("report")}
          >
            <FileText className="mr-1 h-3 w-3" />
            Medical report
          </Button>
          <Button
            type="button"
            variant={docType === "prescription" ? "default" : "outline"}
            size="sm"
            onClick={() => setDocType("prescription")}
          >
            <Pill className="mr-1 h-3 w-3" />
            Prescription
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Document name</Label>
            <Input
              placeholder={docType === "report" ? "e.g. Lipid profile" : "e.g. Dr. Sharma Rx"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {docType === "report" && (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <Label>File (max 20MB)</Label>
          <Input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (!f) {
                setFile(null);
                return;
              }
              const err = validateDocFile(f);
              if (err) {
                toast.error(err);
                e.target.value = "";
                setFile(null);
                return;
              }
              setFile(f);
            }}
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>

        {uploadMutation.isPending && (
          <p className="mt-3 text-xs text-primary animate-pulse">
            Extracting pages → OCR/vision → AI analysis → indexing for chat…
          </p>
        )}

        <Button
          className="mt-4 w-full sm:w-auto"
          disabled={!file || uploadMutation.isPending}
          onClick={() => uploadMutation.mutate()}
        >
          {uploadMutation.isPending
            ? "Scanning & analyzing…"
            : docType === "report"
              ? "Upload & analyze report"
              : "Upload & scan prescription"}
        </Button>

        {docType === "prescription" && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Prescriptions are read with Gemini vision (best for handwriting and photos).
            Digital PDFs use text extraction per page.
          </p>
        )}
      </Card>

      {lastResult && <UploadResultCard result={lastResult} />}
    </div>
  );
}

function UploadResultCard({ result }: { result: UploadDocumentResponse }) {
  if (result.documentType === "report" && result.report.aiAnalysis) {
    const scan = result.scanSummary ?? result.report.aiAnalysis.pipeline?.scanSummary;
    return (
      <Card className="rounded-2xl p-5 shadow-soft">
        <p className="text-sm font-semibold">Latest: {result.report.name}</p>
        {result.chunkIndexed != null && result.chunkIndexed > 0 && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Indexed {result.chunkIndexed} text chunks for Ask AI
          </p>
        )}
        {scan && (
          <div className="mt-3">
            <ReportScanProgressPanel scan={scan} />
          </div>
        )}
        <ReportAnalysisPanel analysis={result.report.aiAnalysis} />
      </Card>
    );
  }

  if (result.documentType === "prescription" && result.result) {
    const scan = result.scanSummary ?? result.result.scanSummary;
    return (
      <Card className="rounded-2xl p-5 shadow-soft">
        <p className="text-sm font-semibold">Prescription scan result</p>
        {scan && (
          <div className="mt-3">
            <ReportScanProgressPanel scan={scan} />
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Method: {result.extractionMethod ?? result.result.extractionMethod ?? "OCR"}
          {result.result.visionUsed && " · Gemini vision (handwriting)"}
        </p>
        {result.result.medicines.length > 0 ? (
          <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
            {result.result.medicines.map((m, i) => (
              <li key={i}>
                <span className="font-medium text-foreground">{m.name}</span> — {m.dosage},{" "}
                {m.frequency}, {m.duration}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-amber-600">
            Could not read medicines — try a clearer photo or PDF export.
          </p>
        )}
      </Card>
    );
  }

  return null;
}

function LibraryStats({ docs }: { docs: LibraryDocument[] }) {
  const reports = docs.filter((d) => d.documentType === "report").length;
  const rx = docs.filter((d) => d.documentType === "prescription").length;
  const pages = docs.reduce((n, d) => n + (d.pageCount ?? d.scanSummary?.totalPages ?? 0), 0);
  return (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      <Badge variant="outline">{docs.length} documents</Badge>
      <Badge variant="outline">{reports} reports</Badge>
      <Badge variant="outline">{rx} prescriptions</Badge>
      {pages > 0 && <Badge variant="outline">{pages} pages scanned</Badge>}
    </div>
  );
}

function LibraryTab() {
  const [filter, setFilter] = useState<"all" | DocumentType>("all");
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["doc-library"],
    queryFn: fetchDocumentLibrary,
  });

  const filtered =
    filter === "all" ? docs : docs.filter((d) => d.documentType === filter);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading documents…</p>;
  }

  if (!docs.length) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No documents yet. Use Upload & scan to add reports or prescriptions.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LibraryStats docs={docs} />
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="report">Reports only</SelectItem>
              <SelectItem value="prescription">Prescriptions only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents match this filter.</p>
      ) : (
        filtered.map((d) => <DocumentLibraryCard key={`${d.documentType}-${d.id}`} doc={d} />)
      )}
    </div>
  );
}

function DocumentLibraryCard({ doc }: { doc: LibraryDocument }) {
  const [open, setOpen] = useState(false);
  const hasDetail =
    (doc.documentType === "report" && doc.aiAnalysis) ||
    (doc.scanSummary && doc.scanSummary.totalPages > 0);

  return (
    <Card className="rounded-2xl p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {doc.documentType === "report" ? (
              <FileText className="h-4 w-4 text-primary" />
            ) : (
              <Pill className="h-4 w-4 text-primary" />
            )}
            <span className="font-semibold">{doc.name}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {doc.documentType === "report" ? doc.category : "Prescription"} ·{" "}
            {formatDate(doc.uploadedAt)}
            {doc.pageCount != null && ` · ${doc.pageCount} page(s)`}
          </p>
        </div>
        <Badge variant="secondary">{doc.documentType}</Badge>
      </div>

      {doc.scanSummary && (
        <div className="mt-3">
          <ReportScanProgressPanel scan={doc.scanSummary} />
        </div>
      )}

      {doc.documentType === "prescription" && doc.medicines && doc.medicines.length > 0 && (
        <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
          {doc.medicines.map((m, i) => (
            <li key={i}>
              {m.name} — {m.dosage}, {m.frequency}
            </li>
          ))}
        </ul>
      )}

      {hasDetail && (
        <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              {open ? "Hide" : "Show"} full analysis
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {doc.documentType === "report" && doc.aiAnalysis && (
              <ReportAnalysisPanel analysis={doc.aiAnalysis} />
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {resolveUploadUrl(doc.fileUrl) && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <a href={resolveUploadUrl(doc.fileUrl)} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1 h-3 w-3" /> Open
            </a>
          </Button>
          <DownloadFileButton
            fileUrl={doc.fileUrl}
            fileName={doc.name}
            label="Download"
            variant="link"
            className="h-auto p-0"
          />
        </div>
      )}
    </Card>
  );
}

function DoctorPrescriptionsTab() {
  const { data: list = [], isLoading } = usePrescriptions();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading doctor prescriptions…</p>;
  }

  if (!list.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Prescriptions from your doctors after consultations appear here. Upload photos of old Rx
        under Upload & scan.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {list.map((rx) => (
        <Card key={rx.id} className="rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="font-medium">{rx.doctorName}</span>
            <Badge variant="outline" className="text-[10px]">
              {rx.specialization}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{rx.date}</p>
          <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
            {rx.medicines.map((m, i) => (
              <li key={i}>
                {m.name} — {m.dosage}, {m.frequency}, {m.duration}
              </li>
            ))}
          </ul>
          {rx.instructions && (
            <p className="mt-2 text-xs italic text-muted-foreground">{rx.instructions}</p>
          )}
        </Card>
      ))}
    </ul>
  );
}

export function DocAssistantHub({ defaultTab = "upload" }: { defaultTab?: string }) {
  const navigate = useNavigate();
  const tab: TabValue = TAB_VALUES.includes(defaultTab as TabValue)
    ? (defaultTab as TabValue)
    : "upload";

  const setTab = (value: string) => {
    navigate({
      to: "/patient/doc-assistant",
      search: { tab: value as TabValue },
      replace: true,
    });
  };

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-2 gap-1 sm:grid-cols-4">
        <TabsTrigger value="upload" className="text-xs sm:text-sm">
          <Upload className="mr-1 hidden h-3 w-3 sm:inline" />
          Upload
        </TabsTrigger>
        <TabsTrigger value="library" className="text-xs sm:text-sm">
          <FileText className="mr-1 hidden h-3 w-3 sm:inline" />
          My documents
        </TabsTrigger>
        <TabsTrigger value="chat" className="text-xs sm:text-sm">
          <MessageCircle className="mr-1 hidden h-3 w-3 sm:inline" />
          Ask AI
        </TabsTrigger>
        <TabsTrigger value="doctor-rx" className="text-xs sm:text-sm">
          <Stethoscope className="mr-1 hidden h-3 w-3 sm:inline" />
          Doctor Rx
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload">
        <UploadTab onUploaded={() => setTab("library")} />
      </TabsContent>
      <TabsContent value="library">
        <LibraryTab />
      </TabsContent>
      <TabsContent value="chat">
        <ReportChatPanel />
      </TabsContent>
      <TabsContent value="doctor-rx">
        <DoctorPrescriptionsTab />
      </TabsContent>
    </Tabs>
  );
}
