import { compactList, compactVitals, truncateForPrompt } from "./prompt-utils.js";
import type { GeminiVisionFindings, RuleAnalysisPartial } from "../core/types.js";
import { getAiConfig } from "../config/ai.config.js";
import type { RuleCoverageAssessment } from "../pipeline/rule-coverage.js";

export function buildGeminiVerdictPrompt(input: {
  name: string;
  category: string;
  reportText: string;
  rules: RuleAnalysisPartial;
  vision: GeminiVisionFindings | null;
  severity: string;
  riskScore: number;
  coverage: RuleCoverageAssessment;
}): string {
  const cfg = getAiConfig();
  const visionLine = input.vision?.imagingSummary
    ? `Imaging OCR/vision: ${input.vision.imagingSummary.slice(0, 400)}
Findings: ${compactList(input.vision.visibleFindings ?? [], 5)}
Flags: ${compactList(input.vision.clinicalFlags ?? [], 4)}`
    : "";

  const labLines =
    input.rules.labMarkers?.length
      ? input.rules.labMarkers
          .map(
            (m) =>
              `${m.test}: ${m.value} ${m.unit} [${m.status}] (ref ${m.refLow}-${m.refHigh})`,
          )
          .join("\n")
      : "(no structured labs parsed — read raw text)";

  const ruleInferences =
    input.rules.inferredConditions?.length
      ? input.rules.inferredConditions
          .map(
            (i) =>
              `- ${i.name} (${i.likelihood}): ${i.evidence?.join("; ") ?? i.note ?? ""}`,
          )
          .join("\n")
      : "(none)";

  const rejected =
    input.rules.keywordRejected?.map((r) => `- SKIP "${r.label}": ${r.reason}`).join("\n") ?? "";

  const ruleSymptoms = compactList(input.rules.symptomsFromReport ?? [], 8);

  const imagingNote =
    input.rules.documentType === "xray" ||
    input.rules.documentType === "ct_scan" ||
    input.coverage.reasons.some((r) => r.includes("Imaging"))
      ? "\nIMPORTANT: This is an IMAGING study (X-ray/CT/photo). OCR text is NOT reliable. If an image is attached, base finalVerdict primarily on what you SEE in the image (opacities, tubes, fractures, etc.), not on missing lab numbers.\n"
      : "";

  return `You are a senior clinical documentation assistant for telehealth in India.
Your job: read the FULL extracted medical document and produce the PRIMARY patient-facing verdict.
Automated rules are INCOMPLETE for many conditions (cancer, fractures, spinal injury, knee/ACL, infections, cardiac, etc.) — you must interpret the actual text.
${imagingNote}

Rule engine (reference only — may be wrong or incomplete):
- Screening level: ${input.severity}, risk index ${input.riskScore}%
- Rule confidence: ${input.coverage.level} — ${input.coverage.reasons.join(" ")}
- Parsed vitals: ${compactVitals(input.rules.extractedVitals)}
- Structured labs:\n${labLines}
- Rule-inferred conditions:\n${ruleInferences}
- Rule symptoms: ${ruleSymptoms || "(none)"}
- Rule abnormalities: ${compactList(input.rules.abnormalities, 6)}
${rejected ? `Rejected rule keywords:\n${rejected}` : ""}
${visionLine}

Report file: ${input.name}
Category: ${input.category}
Document type hint: ${input.rules.documentType}

FULL EXTRACTED TEXT (source of truth):
${truncateForPrompt(input.reportText, Math.max(cfg.maxSynthesisChars, 3500))}

INSTRUCTIONS:
1. Extract symptoms/complaints actually stated or implied in the report (not template boilerplate).
2. List possible conditions across specialties: labs, cancer screening, fractures, spine, joints, heart, lungs, diabetes, thyroid, infection, etc. Only if supported by report wording or values.
3. If rules conflict with the text (e.g. "anemia" in sample template but normal Hb), trust the values and text.
4. Write finalVerdict: 3-5 sentences — what the report shows, main concerns, urgency, and that a qualified doctor must confirm.
5. clinicalBrief: 5-10 lines for the patient (use \\n between lines).
6. assessmentBasis: 4-8 numbered reasoning steps (what evidence → what conclusion).
7. ruleAgreement: "supports" if rules match text, "extends" if you add conditions rules missed, "overrides" if rules were misleading.

Return JSON only:
{
  "finalVerdict": "string",
  "clinicalBrief": "string with \\n",
  "patientProblemSummary": "max 2 sentences",
  "summary": "3 sentences",
  "symptomsFromReport": ["max 8"],
  "possibleDiseases": [{"name":"string","likelihood":"low|moderate|high","note":"evidence from report"}],
  "assessmentBasis": ["step strings"],
  "ruleAgreement": "supports|extends|overrides",
  "suggestedScreeningLevel": "Low|Moderate|High|Critical",
  "insights": ["max 5 with numbers if present"],
  "pros": ["max 3"],
  "cons": ["max 4"],
  "doList": ["max 5"],
  "avoidList": ["max 3"]
}
Not a definitive diagnosis. Cite specific findings from the document.`;
}
