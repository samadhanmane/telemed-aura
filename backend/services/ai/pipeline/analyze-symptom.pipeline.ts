import type { SpecialtyId } from "../../../src/constants/specialties.js";
import { getSpecialtyLabel } from "../../../src/constants/specialties.js";
import { analyzeSymptoms } from "../core/symptom-analyzer.js";
import { severityToPriority } from "../core/triage.js";
import type { SymptomScanResult, VitalsRiskInput } from "../core/types.js";
import { computeSymptomSeverity } from "../rules/symptom-severity.engine.js";
import { analyzeSymptomNarrativeWithGemini } from "../synthesis/symptom-gemini-analyze.js";
import { enhanceSymptomScanWithGemini } from "../synthesis/symptom-gemini.js";

const BODY_SYSTEM_SPECIALIST: Record<string, SpecialtyId> = {
  cardiovascular: "cardiology",
  cardiology: "cardiology",
  respiratory: "general_physician",
  neurology: "neurology",
  gastro: "general_physician",
  gastrointestinal: "general_physician",
  dermatology: "dermatology",
  musculoskeletal: "orthopedics",
  orthopedics: "orthopedics",
  psychiatry: "psychology",
  psychology: "psychology",
  pediatric: "pediatrics",
  pediatrics: "pediatrics",
  general: "general_physician",
};

export async function runSymptomAnalysisPipeline(input: {
  symptoms: string[];
  description?: string;
  bodyArea?: string;
  age?: number;
  chronicDiseases?: string[];
  vitals?: VitalsRiskInput;
}): Promise<
  SymptomScanResult & {
    analysisDetails?: string[];
    symptomCategory?: string;
    vitalsUsed?: boolean;
    geminiAnalysisUsed?: boolean;
  }
> {
  const base = analyzeSymptoms({
    symptoms: input.symptoms,
    description: input.description,
    bodyArea: input.bodyArea,
    age: input.age,
    chronicDiseases: input.chronicDiseases,
  });

  const geminiAnalysis = await analyzeSymptomNarrativeWithGemini({
    symptoms: input.symptoms,
    description: input.description,
    bodyArea: input.bodyArea,
    age: input.age,
    chronicDiseases: input.chronicDiseases,
  });

  const patientTexts = [
    input.description ?? "",
    ...(input.symptoms ?? []),
    input.bodyArea ?? "",
  ].filter(Boolean);

  const { severity, riskScore, abnormalities } = computeSymptomSeverity({
    baseSeverity: base.severity,
    baseRisk: base.risk,
    emergency: base.emergency,
    patientTexts,
    vitals: input.vitals,
    age: input.age,
    chronicDiseases: input.chronicDiseases,
  });

  if (geminiAnalysis?.clinicalFlags?.length) {
    for (const flag of geminiAnalysis.clinicalFlags.slice(0, 3)) {
      abnormalities.push(`AI clinical note: ${flag}`);
    }
  }

  let possibleConditions = [
    ...new Set([
      ...base.possibleConditions,
      ...(geminiAnalysis?.suggestedConditions ?? []),
    ]),
  ].slice(0, 6);

  let suggestedSpecialtyId = base.suggestedSpecialtyId;
  if (geminiAnalysis?.bodySystem) {
    const key = geminiAnalysis.bodySystem.toLowerCase().replace(/\s+/g, "_");
    const mapped =
      BODY_SYSTEM_SPECIALIST[key] ??
      BODY_SYSTEM_SPECIALIST[geminiAnalysis.bodySystem.toLowerCase()];
    if (mapped) suggestedSpecialtyId = mapped;
  }

  const triagePriority = severityToPriority(severity, base.emergency);
  const requiresDoctor =
    base.emergency ||
    riskScore >= 58 ||
    severity === "High" ||
    severity === "Critical";

  const analysisDetails = [
    ...abnormalities,
    ...(geminiAnalysis?.clinicalFlags?.map((f) => `AI noted: ${f}`) ?? []),
  ].slice(0, 12);

  const symptomCategory =
    geminiAnalysis?.bodySystem ??
    (input.bodyArea ? `${input.bodyArea} area` : "General");

  let result: SymptomScanResult & {
    analysisDetails?: string[];
    symptomCategory?: string;
    vitalsUsed?: boolean;
    geminiAnalysisUsed?: boolean;
  } = {
    risk: riskScore,
    severity,
    triagePriority,
    possibleConditions,
    suggestedSpecialist: getSpecialtyLabel(suggestedSpecialtyId),
    suggestedSpecialtyId,
    emergency: base.emergency || severity === "Critical",
    preventiveSuggestions: base.preventiveSuggestions,
    requiresDoctor,
    recommendation: base.recommendation,
    analysisDetails,
    symptomCategory,
    vitalsUsed: Boolean(
      input.vitals &&
        Object.values(input.vitals).some((v) => v != null && v !== undefined),
    ),
    geminiAnalysisUsed: Boolean(geminiAnalysis),
  };

  const enhanced = await enhanceSymptomScanWithGemini(result, {
    symptoms: input.symptoms,
    description: input.description,
    analysisDetails,
  });

  if (enhanced?.recommendation) result.recommendation = enhanced.recommendation;
  if (enhanced?.preventiveSuggestions?.length) {
    result.preventiveSuggestions = enhanced.preventiveSuggestions;
  }
  if (enhanced?.patientProblemSummary) {
    result.patientProblemSummary = enhanced.patientProblemSummary;
  }

  return result;
}
