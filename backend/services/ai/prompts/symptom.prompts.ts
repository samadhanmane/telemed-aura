import { compactList } from "./prompt-utils.js";
import { truncateForPrompt } from "./prompt-utils.js";
import { getAiConfig } from "../config/ai.config.js";

/** Gemini reads description — outputs clinical flags, NOT severity scores. */
export function buildSymptomAnalysisPrompt(input: {
  symptoms: string[];
  description?: string;
  bodyArea?: string;
  age?: number;
  chronicDiseases?: string[];
}): string {
  const cfg = getAiConfig();
  const chronic =
    input.chronicDiseases?.length ? `Chronic:${compactList(input.chronicDiseases, 4)}` : "";
  return `Rural telehealth triage assistant. Read patient symptoms and free-text description.
Symptoms:${compactList(input.symptoms, 10)}
Body area:${input.bodyArea ?? "general"}
Age:${input.age ?? "unknown"}
${chronic}
Description:${truncateForPrompt(input.description ?? "", 600)}
JSON only:{"clinicalFlags":["max 5 short objective phrases e.g. chest pain at rest"],"suggestedConditions":["max 4 possible conditions, not definitive diagnosis"],"bodySystem":"respiratory|cardiovascular|neurology|gastro|dermatology|musculoskeletal|psychiatry|general|pediatric","narrativeForRules":"1 sentence clinical gist for rule engine"}
No severity field. No risk percent. No triage level.`;
}

export function buildSymptomEnhancePrompt(input: {
  symptoms: string[];
  description?: string;
  severity: string;
  risk: number;
  possibleConditions: string[];
  emergency: boolean;
  analysisDetails?: string[];
}): string {
  return `Symptom triage helper. Rules+vitals+AI flags already set: severity=${input.severity} risk=${input.risk}% emergency=${input.emergency}. DO NOT change scores.
Symptoms:${compactList(input.symptoms, 8)}
Note:${(input.description ?? "").slice(0, 300)}
Conditions:${compactList(input.possibleConditions, 4)}
Flags:${compactList(input.analysisDetails ?? [], 4)}
JSON:{"patientProblemSummary":"max 2 sentences plain English what patient may be facing","recommendation":"max 2 sentences next steps","tips":["max 3 short tips"]}`;
}
