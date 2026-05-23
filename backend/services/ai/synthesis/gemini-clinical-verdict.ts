import type { GeminiVisionFindings, PossibleDisease, RuleAnalysisPartial } from "../core/types.js";
import { getAiConfig } from "../config/ai.config.js";
import { buildGeminiVerdictPrompt } from "../prompts/gemini-verdict.prompts.js";
import type { RuleCoverageAssessment } from "../pipeline/rule-coverage.js";
import { generateGeminiJson } from "../models/gemini.client.js";

export type GeminiClinicalVerdict = {
  finalVerdict: string;
  clinicalBrief: string;
  patientProblemSummary: string;
  summary: string;
  symptomsFromReport: string[];
  possibleDiseases: PossibleDisease[];
  assessmentBasis: string[];
  ruleAgreement: "supports" | "extends" | "overrides";
  suggestedScreeningLevel?: string;
  insights: string[];
  pros?: string[];
  cons?: string[];
  doList?: string[];
  avoidList?: string[];
  /** Gemini was primary authority for narrative (rules insufficient). */
  verdictPrimary: boolean;
};

type GeminiVerdictJson = {
  finalVerdict?: string;
  clinicalBrief?: string;
  patientProblemSummary?: string;
  summary?: string;
  symptomsFromReport?: string[];
  possibleDiseases?: { name?: string; likelihood?: string; note?: string }[];
  assessmentBasis?: string[];
  ruleAgreement?: string;
  suggestedScreeningLevel?: string;
  insights?: string[];
  pros?: string[];
  cons?: string[];
  doList?: string[];
  avoidList?: string[];
};

/**
 * Primary clinical interpretation when rules are incomplete or document is complex.
 * Uses one Gemini generate call (same budget as synthesis).
 */
export async function runGeminiClinicalVerdict(input: {
  name: string;
  category: string;
  reportText: string;
  rules: RuleAnalysisPartial;
  vision: GeminiVisionFindings | null;
  severity: string;
  riskScore: number;
  coverage: RuleCoverageAssessment;
  /** For X-ray/photo uploads — multimodal verdict when OCR has no labs. */
  imageBuffer?: Buffer;
  mimeType?: string;
  isImagingStudy?: boolean;
}): Promise<GeminiClinicalVerdict | null> {
  const cfg = getAiConfig();
  if (!cfg.apiKey) return null;

  const prompt = buildGeminiVerdictPrompt(input);
  const useImage =
    Boolean(input.imageBuffer) &&
    Boolean(input.mimeType?.startsWith("image/")) &&
    Boolean(input.isImagingStudy) &&
    !input.vision?.imagingSummary;

  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
    { text: prompt },
  ];
  if (useImage && input.imageBuffer && input.mimeType) {
    parts.push({
      inlineData: {
        mimeType: input.mimeType,
        data: input.imageBuffer.toString("base64"),
      },
    });
  }

  const json = await generateGeminiJson<GeminiVerdictJson>(parts, {
    modelId: useImage ? cfg.visionModel : undefined,
    maxOutputTokens: Math.max(cfg.maxOutputTokensSynthesis, 900),
    slotKind: useImage ? "vision" : "generate",
    waitForSlot: true,
  });

  if (!json?.finalVerdict && !json?.clinicalBrief && !json?.summary) return null;

  const agreement = (json.ruleAgreement ?? "extends").toLowerCase();
  const ruleAgreement =
    agreement === "supports" || agreement === "overrides" ? agreement : "extends";

  const diseases: PossibleDisease[] = Array.isArray(json.possibleDiseases)
    ? json.possibleDiseases
        .filter((d) => d?.name?.trim())
        .slice(0, 8)
        .map((d) => ({
          name: String(d.name).trim(),
          likelihood: String(d.likelihood ?? "moderate"),
          source: "gemini" as const,
          note: d.note ? String(d.note) : undefined,
        }))
    : [];

  const symptoms = Array.isArray(json.symptomsFromReport)
    ? json.symptomsFromReport.map(String).filter((s) => s.length > 2).slice(0, 8)
    : [];

  const basis = Array.isArray(json.assessmentBasis)
    ? json.assessmentBasis.map(String).slice(0, 10)
    : [];

  return {
    finalVerdict: String(json.finalVerdict ?? json.summary ?? "").slice(0, 800),
    clinicalBrief: String(json.clinicalBrief ?? json.summary ?? "").slice(0, 1400),
    patientProblemSummary: String(json.patientProblemSummary ?? "").slice(0, 450),
    summary: String(json.summary ?? json.finalVerdict ?? "").slice(0, 650),
    symptomsFromReport: symptoms,
    possibleDiseases: diseases,
    assessmentBasis: basis,
    ruleAgreement,
    suggestedScreeningLevel: json.suggestedScreeningLevel
      ? String(json.suggestedScreeningLevel)
      : undefined,
    insights: Array.isArray(json.insights) ? json.insights.map(String).slice(0, 6) : [],
    pros: Array.isArray(json.pros) ? json.pros.map(String).slice(0, 5) : [],
    cons: Array.isArray(json.cons) ? json.cons.map(String).slice(0, 5) : [],
    doList: Array.isArray(json.doList) ? json.doList.map(String).slice(0, 6) : [],
    avoidList: Array.isArray(json.avoidList) ? json.avoidList.map(String).slice(0, 5) : [],
    verdictPrimary: input.coverage.preferGeminiVerdict || ruleAgreement !== "supports",
  };
}
