import type { SymptomScanResult } from "../core/types.js";
import { getAiConfig } from "../config/ai.config.js";
import { buildSymptomEnhancePrompt } from "../prompts/symptom.prompts.js";
import { generateGeminiJson } from "../models/gemini.client.js";

/** Optional Gemini layer — enriches wording only; severity/risk stay from rules. */
export async function enhanceSymptomScanWithGemini(
  rules: SymptomScanResult,
  input: {
    symptoms: string[];
    description?: string;
    analysisDetails?: string[];
  },
): Promise<Partial<SymptomScanResult> | null> {
  if (!getAiConfig().apiKey) return null;

  const prompt = buildSymptomEnhancePrompt({
    symptoms: input.symptoms,
    description: input.description,
    severity: rules.severity,
    risk: rules.risk,
    possibleConditions: rules.possibleConditions,
    emergency: rules.emergency,
    analysisDetails: input.analysisDetails,
  });

  const json = await generateGeminiJson<{
    patientProblemSummary?: string;
    recommendation?: string;
    tips?: string[];
  }>([{ text: prompt }], { maxOutputTokens: 320 });

  if (!json) return null;

  return {
    recommendation: json.recommendation
      ? String(json.recommendation)
      : rules.recommendation,
    preventiveSuggestions: Array.isArray(json.tips)
      ? [...json.tips.map(String), ...rules.preventiveSuggestions].slice(0, 5)
      : rules.preventiveSuggestions,
    possibleConditions: rules.possibleConditions,
    patientProblemSummary: json.patientProblemSummary
      ? String(json.patientProblemSummary)
      : undefined,
  };
}
