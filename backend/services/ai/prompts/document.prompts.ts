import { compactList, compactVitals, truncateForPrompt } from "./prompt-utils.js";
import type { ExtractedVitals, GeminiVisionFindings, RuleAnalysisPartial } from "../core/types.js";
import { getAiConfig } from "../config/ai.config.js";

/** Minimal vision prompt — JSON only, no severity scores from model. */
export function buildVisionPrompt(input: {
  category: string;
  reportName: string;
  ocrPreview: string;
}): string {
  const cfg = getAiConfig();
  return `Rural telehealth. Analyze medical image. Category:${input.category} Name:${input.reportName}
OCR:${truncateForPrompt(input.ocrPreview, cfg.maxVisionOcrPreview)}
JSON only:{"documentType":"xray|lab_report|prescription|ecg|ct_scan|skin|other","imagingSummary":"max 2 short sentences","visibleFindings":["max 3 objective items"],"clinicalFlags":["max 3 short phrases e.g. opacity noted"],"suggestedFollowUp":["max 2 items"]}
No diagnosis. No risk scores. No severity field.`;
}

export type SynthesisPromptInput = {
  name: string;
  category: string;
  ocrExcerpt: string;
  vitals: ExtractedVitals;
  conditions: string[];
  abnormalities: string[];
  severity: string;
  riskScore: number;
  vision: GeminiVisionFindings | null;
  rules?: RuleAnalysisPartial;
};

/** Compact synthesis — structured JSON reduces tokens vs long prose. */
export function buildSynthesisPrompt(input: SynthesisPromptInput): string {
  const cfg = getAiConfig();
  const visionLine = input.vision?.imagingSummary
    ? `Img:${input.vision.imagingSummary.slice(0, 200)}`
    : "";
  const labLines =
    input.rules?.labMarkers?.length
      ? input.rules.labMarkers
          .map(
            (m) =>
              `${m.test}: ${m.value} ${m.unit} [${m.status}] ref ${m.refLow}-${m.refHigh}`,
          )
          .join("\n")
      : "";
  const inferredLines =
    input.rules?.inferredConditions?.length
      ? input.rules.inferredConditions
          .map((i) => `${i.name} (${i.likelihood}): ${i.evidence?.join("; ") ?? ""}`)
          .join("\n")
      : "";
  const rejectedKw =
    input.rules?.keywordRejected?.map((r) => `IGNORE ${r.label}: ${r.reason}`).join("\n") ?? "";

  return `You are a medical report assistant for Indian telehealth. Read the lab/imaging report and write a clear patient summary.
Rules engine severity=${input.severity} risk=${input.riskScore}% — do NOT change scores.
Report: ${input.name} (${input.category})
Parsed vitals: ${compactVitals(input.vitals)}
Structured labs from OCR:
${labLines || "(none parsed — read raw text carefully)"}
Rule-based screening (verify against raw text):
${inferredLines || compactList(input.conditions)}
Do NOT diagnose from template/sample words (Drlogy, example, template) if labs are normal.
${rejectedKw}
Abnormalities: ${compactList(input.abnormalities, 4)}
${visionLine}
Raw report text:
${truncateForPrompt(input.ocrExcerpt, cfg.maxSynthesisChars)}

Return JSON only:
{
  "clinicalBrief": "5-10 short lines (use \\n between lines). Plain language: what the report shows, sugar/BP/cholesterol if present, main concerns, and that a doctor must confirm.",
  "patientProblemSummary": "2 sentences max — what the patient may be facing",
  "summary": "3 sentences — overall interpretation",
  "possibleDiseases": [{"name":"condition name","likelihood":"low|moderate|high","note":"1 sentence why based on report values"}],
  "insights": ["max 4 bullets with specific numbers from the report"],
  "doctorNote": "1 sentence for clinician",
  "pros": ["max 3 positives"],
  "cons": ["max 3 concerns"],
  "doList": ["max 4 actions"],
  "avoidList": ["max 3 avoid"]
}
Base possibleDiseases on actual values in the text (e.g. high glucose → prediabetes/diabetes screening). Not a final diagnosis.`;
}

export function buildRuleOnlySummary(input: {
  name: string;
  category: string;
  rules: RuleAnalysisPartial;
  severity: string;
  riskScore: number;
}): {
  patientProblemSummary: string;
  summary: string;
  insights: string[];
} {
  const problems: string[] = [];
  if (input.rules.detectedConditions.length) {
    problems.push(`Possible concerns: ${input.rules.detectedConditions.slice(0, 3).join(", ")}`);
  }
  if (input.rules.abnormalities.length) {
    problems.push(input.rules.abnormalities[0]!);
  }
  const v = input.rules.extractedVitals;
  if (v.bloodPressureSystolic != null && v.bloodPressureSystolic >= 140) {
    problems.push("Blood pressure appears elevated on this report.");
  }
  if ((v.fastingGlucose ?? v.randomGlucose ?? 0) >= 126) {
    problems.push("Blood sugar reading may be high — discuss with your doctor.");
  }
  if (v.hemoglobin != null && v.hemoglobin < 10) {
    problems.push("Hemoglobin is low on this report.");
  }

  const patientProblemSummary =
    problems.length > 0
      ? problems.slice(0, 2).join(" ")
      : `Your ${input.name} (${input.category}) was processed; no major automated flags. Share with your doctor.`;

  return {
    patientProblemSummary,
    summary: `${input.name}: ${input.severity} significance (${input.riskScore}% rule-based risk). ${patientProblemSummary}`,
    insights: input.rules.insights.slice(0, 5),
  };
}
