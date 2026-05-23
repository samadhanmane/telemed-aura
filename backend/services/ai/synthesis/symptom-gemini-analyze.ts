import { getAiConfig } from "../config/ai.config.js";
import { buildSymptomAnalysisPrompt } from "../prompts/symptom.prompts.js";
import { generateGeminiJson } from "../models/gemini.client.js";

export type GeminiSymptomAnalysis = {
  clinicalFlags: string[];
  suggestedConditions: string[];
  bodySystem?: string;
  narrativeForRules?: string;
};

/**
 * Gemini reads the patient's description — outputs flags only (no severity/risk scores).
 */
export async function analyzeSymptomNarrativeWithGemini(input: {
  symptoms: string[];
  description?: string;
  bodyArea?: string;
  age?: number;
  chronicDiseases?: string[];
}): Promise<GeminiSymptomAnalysis | null> {
  if (!getAiConfig().apiKey) return null;

  const hasText =
    (input.description?.trim().length ?? 0) > 8 ||
    input.symptoms.length > 0;
  if (!hasText) return null;

  const prompt = buildSymptomAnalysisPrompt(input);
  const json = await generateGeminiJson<{
    clinicalFlags?: string[];
    suggestedConditions?: string[];
    bodySystem?: string;
    narrativeForRules?: string;
  }>([{ text: prompt }], { maxOutputTokens: 384 });

  if (!json) return null;

  return {
    clinicalFlags: Array.isArray(json.clinicalFlags)
      ? json.clinicalFlags.map(String).slice(0, 6)
      : [],
    suggestedConditions: Array.isArray(json.suggestedConditions)
      ? json.suggestedConditions.map(String).slice(0, 5)
      : [],
    bodySystem: json.bodySystem ? String(json.bodySystem) : undefined,
    narrativeForRules: json.narrativeForRules
      ? String(json.narrativeForRules).slice(0, 400)
      : undefined,
  };
}
