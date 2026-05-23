import type { PossibleDisease, SeverityLevel } from "../core/types.js";
import type { ClinicalReportOutput } from "./clinical-report-builder.js";
import type { GeminiClinicalVerdict } from "../synthesis/gemini-clinical-verdict.js";
import type { ParsedLabMarker } from "../rules/cbc-lab-parser.js";
import type { GeminiVisionFindings } from "../core/types.js";
import { buildVerdictFromVisionFindings } from "./vision-verdict.js";

export type HybridVerdictResult = {
  finalVerdict: string;
  clinicalBrief: string;
  patientProblemSummary: string;
  summary: string;
  assessmentBasis: string[];
  symptomsFromReport: string[];
  possibleDiseases: PossibleDisease[];
  insights: string[];
  verdictSource: "rules+gemini" | "rules-only" | "gemini-primary";
};

/**
 * Always combine rule-based extraction with Gemini (when available) — never rely on only one.
 */
export function buildHybridVerdict(input: {
  clinical: ClinicalReportOutput;
  gemini: GeminiClinicalVerdict | null;
  markers: ParsedLabMarker[];
  severity: SeverityLevel;
  riskScore: number;
  synthesisUsed: boolean;
  quotaLimited: boolean;
  isImaging?: boolean;
  visionUsed?: boolean;
  visionFindings?: GeminiVisionFindings | null;
  reportName?: string;
}): HybridVerdictResult {
  const abnormal = input.markers.filter(
    (m) => m.status === "low" || m.status === "high" || m.status === "critical",
  );
  const critical = input.markers.filter((m) => m.status === "critical");

  let assessmentBasis = [...input.clinical.assessmentBasis];
  let possibleDiseases = [...input.clinical.possibleDiseases];
  let symptoms = [...input.clinical.symptomsFromReport];
  let insights = [...input.clinical.insights];

  let clinicalBrief = input.clinical.clinicalBrief;
  let patientProblemSummary = input.clinical.patientProblemSummary;
  let summary = input.clinical.summary;
  let finalVerdict = input.clinical.finalVerdict;
  let verdictSource: HybridVerdictResult["verdictSource"] = "rules-only";

  if (input.gemini) {
    verdictSource =
      input.gemini.verdictPrimary && input.gemini.ruleAgreement !== "supports"
        ? "gemini-primary"
        : "rules+gemini";

    possibleDiseases = mergeDiseaseLists(input.clinical.possibleDiseases, input.gemini.possibleDiseases);
    symptoms = [...new Set([...input.gemini.symptomsFromReport, ...symptoms])].slice(0, 10);

    assessmentBasis = [
      "── Rule-based extraction (labs & numeric screening) ──",
      ...input.clinical.assessmentBasis.filter((s) => !s.startsWith("WARNING")),
      "── AI clinical interpretation (Gemini) ──",
      ...input.gemini.assessmentBasis,
      `AI agreement with rules: ${input.gemini.ruleAgreement}.`,
      ...(input.gemini.suggestedScreeningLevel
        ? [`AI screening suggestion: ${input.gemini.suggestedScreeningLevel} (rule index: ${input.severity} / ${input.riskScore}%).`]
        : []),
    ];

    const ruleLabSummary =
      abnormal.length > 0
        ? `Rule engine: ${abnormal.length} abnormal value(s) — ${abnormal.map((m) => `${m.test} ${m.value} (${m.status})`).join("; ")}.`
        : input.markers.length > 0
          ? `Rule engine: ${input.markers.length} lab value(s) parsed; none outside reference on automated read.`
          : "Rule engine: could not parse structured lab numbers — AI read the full report text below.";

    clinicalBrief = [
      input.gemini.clinicalBrief,
      "",
      ruleLabSummary,
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 1600);

    const geminiVerdict = input.gemini.finalVerdict.trim();
    const ruleVerdict = buildRuleVerdictSnippet(input.markers, abnormal, critical, input.severity, input.riskScore);

    finalVerdict = [
      geminiVerdict,
      "",
      `Rule-based check: ${ruleVerdict}`,
      "Combined screening only — your doctor must confirm diagnosis and treatment.",
    ].join("\n");

    patientProblemSummary =
      input.gemini.patientProblemSummary || patientProblemSummary;
    summary = input.gemini.summary || summary;
    insights = [...new Set([...input.gemini.insights, ...insights])].slice(0, 8);
  } else if (input.visionUsed && input.visionFindings && !input.gemini) {
    const fromVision = buildVerdictFromVisionFindings({
      vision: input.visionFindings,
      reportName: input.reportName ?? "Medical image",
      severity: input.severity,
      riskScore: input.riskScore,
    });
    finalVerdict = fromVision.finalVerdict;
    clinicalBrief = fromVision.clinicalBrief;
    patientProblemSummary = fromVision.patientProblemSummary;
    summary = fromVision.summary;
    assessmentBasis = [...fromVision.assessmentBasis, ...assessmentBasis];
    possibleDiseases = mergeDiseaseLists(fromVision.possibleDiseases, possibleDiseases);
    insights = [...new Set([...fromVision.insights, ...insights])].slice(0, 8);
    verdictSource = "rules+gemini";
  } else if (input.isImaging && !input.visionUsed && !input.gemini) {
    finalVerdict = input.clinical.finalVerdict;
    clinicalBrief = input.clinical.clinicalBrief;
    assessmentBasis.unshift(
      "Imaging study: Gemini vision did not return findings for this upload.",
    );
  } else if (input.quotaLimited && input.isImaging) {
    assessmentBasis.unshift(
      "Imaging study: AI vision/clinical interpretation was not available for this upload.",
    );
  }

  if (abnormal.length > 0 || critical.length > 0) {
    const fix = buildRuleVerdictSnippet(input.markers, abnormal, critical, input.severity, input.riskScore);
    if (finalVerdict.includes("no abnormal lab")) {
      finalVerdict = fix;
    }
  }

  return {
    finalVerdict,
    clinicalBrief,
    patientProblemSummary,
    summary,
    assessmentBasis,
    symptomsFromReport: symptoms,
    possibleDiseases,
    insights,
    verdictSource,
  };
}

function mergeDiseaseLists(a: PossibleDisease[], b?: PossibleDisease[]): PossibleDisease[] {
  const map = new Map<string, PossibleDisease>();
  for (const d of a) map.set(d.name.toLowerCase(), d);
  for (const d of b ?? []) {
    const k = d.name.toLowerCase();
    const ex = map.get(k);
    if (ex) {
      map.set(k, {
        ...ex,
        source: ex.source === "rules" && d.source === "gemini" ? "both" : d.source,
        likelihood: d.likelihood || ex.likelihood,
        note: [ex.note, d.note].filter(Boolean).join(" "),
      });
    } else {
      map.set(k, d);
    }
  }
  return [...map.values()].slice(0, 10);
}

function buildRuleVerdictSnippet(
  markers: ParsedLabMarker[],
  abnormal: ParsedLabMarker[],
  critical: ParsedLabMarker[],
  severity: SeverityLevel,
  riskScore: number,
): string {
  if (critical.length) {
    return `CRITICAL values on report: ${critical.map((m) => `${m.test} ${m.value} ${m.unit}`).join(", ")}. Urgent medical review needed.`;
  }
  if (abnormal.length) {
    return `${abnormal.length} abnormal result(s): ${abnormal.map((m) => `${m.test}=${m.value} (${m.status})`).join(", ")}. Screening ${severity} (${riskScore}%).`;
  }
  if (markers.length >= 3) {
    return `${markers.length} lab tests parsed; automated screening level ${severity} (${riskScore}%).`;
  }
  return `Limited structured data extracted; screening level ${severity} (${riskScore}%) from text flags.`;
}
