import type {
  AiAnalysisResult,
  ChartSeries,
  GeminiVisionFindings,
  KeyLabFinding,
  PossibleDisease,
  RuleAnalysisPartial,
  SeverityLevel,
} from "../core/types.js";

const SCAN_CHART_IDS = new Set(["scan-pages", "scan-quality", "scan-images", "severity-indicator"]);

/** Medical lab/vitals charts only — no scan coverage or quality metrics. */
export function enrichCharts(
  rules: RuleAnalysisPartial,
  riskScore: number,
  _severity: SeverityLevel,
): ChartSeries[] {
  const charts = rules.charts.filter((c) => !SCAN_CHART_IDS.has(c.id));
  const riskIdx = charts.findIndex((c) => c.id === "risk-gauge");
  if (riskIdx >= 0) {
    charts[riskIdx] = {
      ...charts[riskIdx]!,
      title: "Health risk index (rules + ML)",
      data: [{ label: "Risk", value: riskScore, ref: "100", unit: "%" }],
    };
  } else {
    charts.push({
      id: "risk-gauge",
      title: "Health risk index",
      type: "risk",
      data: [{ label: "Risk", value: riskScore, ref: "100", unit: "%" }],
    });
  }

  const lipidPoints = [
    rules.extractedVitals.ldl != null && { label: "LDL", value: rules.extractedVitals.ldl, unit: "mg/dL" },
    rules.extractedVitals.hdl != null && { label: "HDL", value: rules.extractedVitals.hdl, unit: "mg/dL" },
    rules.extractedVitals.triglycerides != null && {
      label: "TG",
      value: rules.extractedVitals.triglycerides,
      unit: "mg/dL",
    },
  ].filter(Boolean) as ChartSeries["data"];

  if (lipidPoints.length >= 2) {
    charts.push({
      id: "lipid-pie",
      title: "Lipid profile (share)",
      type: "pie",
      data: lipidPoints,
    });
  }

  const radarLabs = rules.chartData.filter((d) => d.ref != null).slice(0, 6);
  if (radarLabs.length >= 4) {
    charts.push({
      id: "labs-radar",
      title: "Lab markers vs reference",
      type: "radar",
      data: radarLabs.map((d) => ({
        label: d.label,
        value: d.value,
        ref: d.ref,
        unit: d.unit,
      })),
    });
  }

  const v = rules.extractedVitals;
  const glucose = v.fastingGlucose ?? v.randomGlucose;
  if (glucose != null && !charts.some((c) => c.id === "glucose-line")) {
    charts.push({
      id: "glucose-trend",
      title: "Blood glucose vs target",
      type: "area",
      data: [
        { label: "Your value", value: glucose, ref: v.fastingGlucose ? "100" : "140", unit: "mg/dL" },
        { label: "Target", value: v.fastingGlucose ? 90 : 120, unit: "mg/dL" },
      ],
    });
  }

  return charts;
}

export function buildAnalysisDetails(input: {
  rules: RuleAnalysisPartial;
  vision: GeminiVisionFindings | null;
  severity: SeverityLevel;
  riskScore: number;
  keyLabFindings?: KeyLabFinding[];
  possibleDiseases?: PossibleDisease[];
  assessmentBasis?: string[];
}): string[] {
  if (input.assessmentBasis?.length) {
    return input.assessmentBasis.slice(0, 12);
  }

  const lines: string[] = [
    `Screening level: ${input.severity} (${input.riskScore}% risk index from lab rules)`,
    `Report type: ${input.vision?.documentType ?? input.rules.documentType}`,
  ];
  if (input.keyLabFindings?.length) {
    lines.push(
      ...input.keyLabFindings.slice(0, 8).map((l) => {
        const flag = l.status && l.status !== "normal" ? ` [${l.status}]` : "";
        return `${l.test}: ${l.value}${l.refRange ? ` (ref ${l.refRange})` : ""}${flag}`;
      }),
    );
  }
  if (input.possibleDiseases?.length) {
    lines.push(
      ...input.possibleDiseases.slice(0, 4).map(
        (d) => `Possible: ${d.name} (${d.likelihood})${d.note ? ` — ${d.note}` : ""}`,
      ),
    );
  } else if (input.rules.detectedConditions.length) {
    lines.push(`Terms in report: ${input.rules.detectedConditions.join(", ")}`);
  }
  if (input.rules.abnormalities.length) {
    lines.push(...input.rules.abnormalities.slice(0, 4).map((a) => `• ${a}`));
  }
  if (input.vision?.visibleFindings?.length) {
    lines.push(...input.vision.visibleFindings.slice(0, 3).map((f) => `Imaging: ${f}`));
  }
  return lines;
}

export function assembleFinalOutput(partial: {
  patientProblemSummary: string;
  clinicalBrief?: string;
  finalVerdict?: string;
  assessmentBasis?: string[];
  symptomsFromReport?: string[];
  possibleDiseases?: PossibleDisease[];
  keyLabFindings?: KeyLabFinding[];
  summary: string;
  insights: string[];
  analysisDetails: string[];
  riskScore: number;
  severity: SeverityLevel;
  suggestedSpecialist?: string;
  rules: RuleAnalysisPartial;
  vision: GeminiVisionFindings | null;
  pipeline: AiAnalysisResult["pipeline"];
  geminiNarrative?: string;
  doctorNote?: string;
  guidance?: AiAnalysisResult["guidance"];
}): AiAnalysisResult {
  const charts = enrichCharts(partial.rules, partial.riskScore, partial.severity);
  const insights = [
    ...new Set([
      ...partial.insights,
      ...(partial.doctorNote ? [`Doctor note: ${partial.doctorNote}`] : []),
    ]),
  ].slice(0, 6);

  return {
    patientProblemSummary: partial.patientProblemSummary,
    clinicalBrief: partial.clinicalBrief,
    finalVerdict: partial.finalVerdict,
    assessmentBasis: partial.assessmentBasis,
    symptomsFromReport: partial.symptomsFromReport,
    possibleDiseases: partial.possibleDiseases,
    keyLabFindings: partial.keyLabFindings,
    analysisDetails: partial.analysisDetails,
    summary: partial.summary,
    riskScore: partial.riskScore,
    severity: partial.severity,
    suggestedSpecialist: partial.suggestedSpecialist,
    insights,
    chartData: partial.rules.chartData,
    charts,
    abnormalities: partial.rules.abnormalities,
    extractedVitals: partial.rules.extractedVitals,
    geminiNarrative: partial.geminiNarrative,
    pipeline: partial.pipeline,
    guidance: partial.guidance,
  };
}
