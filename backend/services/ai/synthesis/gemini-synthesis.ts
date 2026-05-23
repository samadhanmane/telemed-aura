import type {
  ExtractedVitals,
  GeminiVisionFindings,
  PossibleDisease,
  RuleAnalysisPartial,
} from "../core/types.js";
import { getAiConfig } from "../config/ai.config.js";
import { buildSynthesisPrompt } from "../prompts/document.prompts.js";
import { generateGeminiJson } from "../models/gemini.client.js";

export type SynthesisResult = {
  patientProblemSummary: string;
  summary: string;
  clinicalBrief?: string;
  possibleDiseases?: PossibleDisease[];
  insights: string[];
  doctorNote?: string;
  narrative?: string;
  pros?: string[];
  cons?: string[];
  doList?: string[];
  avoidList?: string[];
};

export async function synthesizeReportWithGemini(input: {
  name: string;
  category: string;
  reportText: string;
  rules: RuleAnalysisPartial;
  vision: GeminiVisionFindings | null;
  severity: string;
  riskScore: number;
}): Promise<SynthesisResult | null> {
  const cfg = getAiConfig();
  if (!cfg.apiKey) return null;

  const prompt = buildSynthesisPrompt({
    name: input.name,
    category: input.category,
    ocrExcerpt: input.reportText,
    vitals: input.rules.extractedVitals,
    conditions: input.rules.detectedConditions,
    abnormalities: input.rules.abnormalities,
    severity: input.severity,
    riskScore: input.riskScore,
    vision: input.vision,
    rules: input.rules,
  });

  const json = await generateGeminiJson<{
    clinicalBrief?: string;
    patientProblemSummary?: string;
    summary?: string;
    possibleDiseases?: { name?: string; likelihood?: string; note?: string }[];
    insights?: string[];
    doctorNote?: string;
    pros?: string[];
    cons?: string[];
    doList?: string[];
    avoidList?: string[];
  }>([{ text: prompt }], {
    maxOutputTokens: Math.max(cfg.maxOutputTokensSynthesis, 720),
    slotKind: "generate",
  });

  if (!json?.summary && !json?.patientProblemSummary && !json?.clinicalBrief) return null;

  const diseases: PossibleDisease[] = Array.isArray(json.possibleDiseases)
    ? json.possibleDiseases
        .filter((d) => d?.name)
        .slice(0, 6)
        .map((d) => ({
          name: String(d.name),
          likelihood: String(d.likelihood ?? "moderate"),
          source: "gemini" as const,
          note: d.note ? String(d.note) : undefined,
        }))
    : [];

  return {
    clinicalBrief: json.clinicalBrief
      ? String(json.clinicalBrief).slice(0, 1200)
      : undefined,
    patientProblemSummary: String(json.patientProblemSummary ?? json.summary ?? "").slice(0, 400),
    summary: String(json.summary ?? json.patientProblemSummary ?? "").slice(0, 600),
    possibleDiseases: diseases,
    insights: Array.isArray(json.insights) ? json.insights.map(String).slice(0, 5) : [],
    doctorNote: json.doctorNote ? String(json.doctorNote) : undefined,
    pros: Array.isArray(json.pros) ? json.pros.map(String).slice(0, 5) : [],
    cons: Array.isArray(json.cons) ? json.cons.map(String).slice(0, 5) : [],
    doList: Array.isArray(json.doList) ? json.doList.map(String).slice(0, 6) : [],
    avoidList: Array.isArray(json.avoidList) ? json.avoidList.map(String).slice(0, 5) : [],
    narrative: JSON.stringify(json),
  };
}

/** @deprecated Use readPrescriptionWithGemini — kept for callers that import synthesis. */
export async function synthesizePrescriptionWithGemini(
  ocrText: string,
  imageBuffer?: Buffer,
  mimeType?: string,
): Promise<{ medicines: { name: string; dosage: string; frequency: string; duration: string }[]; notes: string } | null> {
  if (!imageBuffer || !mimeType) return null;
  const { readPrescriptionWithGemini } = await import("../prescription/prescription-gemini-reader.js");
  const read = await readPrescriptionWithGemini({
    buffer: imageBuffer,
    mimeType,
    ocrHint: ocrText,
  });
  if (!read?.medicines.length) return null;
  return { medicines: read.medicines, notes: read.notes };
}
