import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  AlertTriangle,
  Activity,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Stethoscope,
  FileText,
} from "lucide-react";
import type { ReportAiAnalysis, ReportChartSeries } from "@/lib/api/clinical";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ReportScanProgressPanel } from "@/components/reports/ReportScanProgressPanel";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(25 95% 53%)",
  "hsl(var(--success))",
  "hsl(var(--muted-foreground))",
];

const SCAN_CHART_IDS = new Set(["scan-pages", "scan-quality", "scan-images", "severity-indicator"]);

function likelihoodVariant(l: string): "default" | "secondary" | "destructive" | "outline" {
  const x = l.toLowerCase();
  if (x === "high") return "destructive";
  if (x === "moderate") return "secondary";
  return "outline";
}

function LabTable({ findings }: { findings: NonNullable<ReportAiAnalysis["keyLabFindings"]> }) {
  if (!findings.length) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Test</th>
            <th className="px-3 py-2 font-medium">Your value</th>
            <th className="px-3 py-2 font-medium">Reference</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((row, i) => (
            <tr key={i} className="border-b border-border/40 last:border-0">
              <td className="px-3 py-2 font-medium">{row.test}</td>
              <td className="px-3 py-2">{row.value}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.refRange ?? "—"}</td>
              <td className="px-3 py-2">
                {row.status && row.status !== "normal" ? (
                  <Badge
                    variant={row.status === "high" || row.status === "low" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {row.status}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GuidanceSection({ guidance }: { guidance: NonNullable<ReportAiAnalysis["guidance"]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {guidance.pros.length > 0 && (
        <Card className="rounded-xl border-success/30 bg-success/5 p-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-success">
            <ThumbsUp className="h-3 w-3" /> Positives
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
            {guidance.pros.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </Card>
      )}
      {guidance.cons.length > 0 && (
        <Card className="rounded-xl border-destructive/30 bg-destructive/5 p-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-destructive">
            <ThumbsDown className="h-3 w-3" /> Concerns
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
            {guidance.cons.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Card>
      )}
      {guidance.doList.length > 0 && (
        <Card className="rounded-xl border-primary/25 bg-primary/5 p-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-primary">
            <CheckCircle2 className="h-3 w-3" /> What you should do
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
            {guidance.doList.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </Card>
      )}
      {guidance.avoidList.length > 0 && (
        <Card className="rounded-xl border-warning/30 bg-warning/5 p-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-warning">
            <XCircle className="h-3 w-3" /> What to avoid
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
            {guidance.avoidList.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

type ChartPointInput = ReportChartSeries["data"][number];

/** Recharts forwards data keys to SVG — never pass `ref` (reserved by React). */
function toSafePoints(points: ChartPointInput[]): { label: string; value: number }[] {
  return points
    .map((d) => ({
      label: String(d.label ?? ""),
      value: Number(d.value),
    }))
    .filter((d) => Number.isFinite(d.value) && d.label.length > 0);
}

function parseRefMidpoint(ref?: string): number {
  if (!ref) return 0;
  const parts = String(ref)
    .split(/[-–]/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => Number.isFinite(n));
  if (parts.length >= 2) return (parts[0]! + parts[1]!) / 2;
  const single = parseFloat(ref);
  return Number.isFinite(single) ? single : 0;
}

function ChartBlock({ chart: rawChart }: { chart: ReportChartSeries }) {
  const points = toSafePoints(rawChart.data);
  if (!points.length) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">No chart data for this panel.</p>
    );
  }

  const chartType = rawChart.type;

  if (chartType === "risk") {
    const v = points[0]?.value ?? 0;
    const pieData = [
      { name: "Risk", value: v },
      { name: "Remainder", value: Math.max(0, 100 - v) },
    ];
    return (
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={60} startAngle={180} endAngle={0}>
              <Cell fill="hsl(var(--primary))" />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <p className="text-center text-xs font-medium">{v}% screening risk index</p>
      </div>
    );
  }

  if (chartType === "pie") {
    const pieData = points.map((d) => ({ name: d.label, value: d.value }));
    return (
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={70} label={false}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === "radar") {
    const radarData = toSafePoints(rawChart.data).map((d) => {
      const raw = rawChart.data.find((r) => String(r.label) === d.label);
      const refMid = parseRefMidpoint(raw?.ref);
      return {
        marker: d.label,
        value: d.value,
        reference: refMid > 0 ? refMid : d.value * 0.85,
      };
    });
    return (
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="marker" tick={{ fontSize: 8 }} />
            <Radar
              name="Your value"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.35}
            />
            <Radar
              name="Reference"
              dataKey="reference"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted))"
              fillOpacity={0.2}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === "area") {
    return (
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.25}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === "line") {
    return (
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === "vitals") {
    return (
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 9 }} />
            <YAxis type="category" dataKey="label" width={72} tick={{ fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="value" name="mmHg" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === "comparison") {
    const enriched = toSafePoints(rawChart.data).map((d) => {
      const raw = rawChart.data.find((r) => String(r.label) === d.label);
      return {
        label: d.label,
        value: d.value,
        refVal: parseRefMidpoint(raw?.ref),
      };
    });
    return (
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={enriched}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="value" name="Your value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="refVal" name="Reference" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportAnalysisPanel({ analysis }: { analysis: ReportAiAnalysis }) {
  const medicalCharts = (
    analysis.charts?.length
      ? analysis.charts.filter(
          (c) => !SCAN_CHART_IDS.has(c.id) && Array.isArray(c.data) && c.data.length > 0,
        )
      : analysis.chartData.length > 0
        ? [
            {
              id: "legacy",
              title: "Lab markers",
              type: "bar" as const,
              data: analysis.chartData.map(({ label, value }) => ({ label, value })),
            },
          ]
        : []
  ) as ReportChartSeries[];

  const briefLines = (analysis.clinicalBrief ?? analysis.summary)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="mt-4 space-y-4 rounded-xl bg-muted/50 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium">Medical report analysis</span>
        <Badge
          variant={analysis.severity === "Critical" || analysis.severity === "High" ? "destructive" : "secondary"}
        >
          {analysis.severity} · {analysis.riskScore}% screening risk
        </Badge>
        {analysis.pipeline?.geminiVerdictPrimary && (
          <Badge variant="outline" className="border-primary/40 text-[10px]">
            AI primary verdict
          </Badge>
        )}
        {analysis.pipeline?.ruleConfidence && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            Rule coverage: {analysis.pipeline.ruleConfidence}
          </Badge>
        )}
        {analysis.pipeline?.synthesisUsed && !analysis.pipeline?.geminiVerdictPrimary && (
          <Badge variant="outline" className="text-[10px]">
            Gemini + rules
          </Badge>
        )}
        {analysis.pipeline?.visionScanOk && (
          <Badge variant="outline" className="border-primary/40 text-[10px]">
            Gemini scanned image
          </Badge>
        )}
        {analysis.pipeline?.geminiQuotaLimited && !analysis.pipeline?.visionScanOk && (
            <Badge variant="outline" className="border-destructive/50 text-[10px] text-destructive">
              Image scan blocked (API limit)
            </Badge>
          )}
        {!analysis.pipeline?.synthesisUsed &&
          analysis.pipeline?.geminiQuotaLimited &&
          (analysis.pipeline?.documentType === "xray" ||
            analysis.pipeline?.documentType === "ct_scan") && (
            <Badge variant="outline" className="border-warning/50 text-[10px] text-warning">
              Imaging — AI read unavailable
            </Badge>
          )}
        {!analysis.pipeline?.synthesisUsed &&
          analysis.pipeline?.geminiQuotaLimited &&
          analysis.pipeline?.documentType !== "xray" &&
          analysis.pipeline?.documentType !== "ct_scan" && (
            <Badge variant="outline" className="border-warning/50 text-[10px] text-warning">
              Rules only (AI quota)
            </Badge>
          )}
        {analysis.pipeline?.geminiRuleAgreement && analysis.pipeline.synthesisUsed && (
          <Badge variant="outline" className="text-[10px]">
            AI {analysis.pipeline.geminiRuleAgreement} rules
          </Badge>
        )}
      </div>

      {analysis.finalVerdict && (
        <Card className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Final screening verdict</p>
          <p className="mt-2 text-sm leading-relaxed">{analysis.finalVerdict}</p>
        </Card>
      )}

      <Card className="rounded-xl border-primary/25 bg-background p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <FileText className="h-3.5 w-3.5" />
          Your medical report summary
        </p>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground">
          {briefLines.map((line, i) => (
            <p key={i} className={line.startsWith("•") ? "pl-1" : undefined}>
              {line}
            </p>
          ))}
        </div>
        {analysis.patientProblemSummary && (
          <p className="mt-3 border-t border-border/50 pt-3 text-xs">
            <span className="font-medium text-foreground">Key takeaway: </span>
            <span className="text-muted-foreground">{analysis.patientProblemSummary}</span>
          </p>
        )}
      </Card>

      {analysis.symptomsFromReport && analysis.symptomsFromReport.length > 0 && (
        <Card className="rounded-xl border-border/60 bg-background/80 p-3">
          <p className="text-xs font-semibold">Symptoms / complaints in report text</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {analysis.symptomsFromReport.map((s, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                {s}
              </Badge>
            ))}
          </ul>
        </Card>
      )}

      {analysis.assessmentBasis && analysis.assessmentBasis.length > 0 && (
        <Card className="rounded-xl border-border/60 bg-background/60 p-3">
          <p className="text-xs font-semibold">How we reached this conclusion</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs text-muted-foreground">
            {analysis.assessmentBasis.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Card>
      )}

      {analysis.possibleDiseases && analysis.possibleDiseases.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold">
            <Stethoscope className="h-3.5 w-3.5 text-primary" />
            Possible conditions (from lab values + AI)
          </p>
          <ul className="space-y-2">
            {analysis.possibleDiseases.map((d, i) => (
              <li
                key={i}
                className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{d.name}</span>
                  <Badge variant={likelihoodVariant(d.likelihood)} className="text-[10px]">
                    {d.likelihood}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {d.source === "gemini"
                      ? "Gemini analysis"
                      : d.source === "both"
                        ? "Labs + Gemini"
                        : "Lab / rules"}
                  </Badge>
                </div>
                {d.note && <p className="mt-1 text-muted-foreground">{d.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.keyLabFindings && analysis.keyLabFindings.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold">
            <Activity className="h-3.5 w-3.5" />
            Values extracted from your report
          </p>
          <LabTable findings={analysis.keyLabFindings} />
        </div>
      )}

      {analysis.guidance && <GuidanceSection guidance={analysis.guidance} />}

      {medicalCharts.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold">Lab & vitals charts</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {medicalCharts.map((chart) => (
              <Card key={chart.id} className="rounded-xl p-3">
                <p className="mb-2 text-xs font-medium">{chart.title}</p>
                <ChartBlock chart={chart} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {analysis.abnormalities && analysis.abnormalities.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
          <p className="flex items-center gap-1 font-medium text-destructive">
            <AlertTriangle className="h-3 w-3" /> Flags from your report
          </p>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {analysis.abnormalities.slice(0, 6).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.insights?.length > 0 && (
        <ul className="list-inside list-disc text-xs text-muted-foreground">
          {analysis.insights.map((ins, i) => (
            <li key={i}>{ins}</li>
          ))}
        </ul>
      )}

      {analysis.pipeline?.scanSummary && (
        <Collapsible>
          <CollapsibleTrigger className="text-[10px] text-muted-foreground underline-offset-2 hover:underline">
            Technical scan details (OCR / pages)
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ReportScanProgressPanel scan={analysis.pipeline.scanSummary} />
          </CollapsibleContent>
        </Collapsible>
      )}

      <p className="text-[10px] text-muted-foreground">
        Possible conditions and summaries are AI-assisted screening from your uploaded report — not a
        diagnosis. Your doctor must confirm before any treatment.
      </p>
    </div>
  );
}
