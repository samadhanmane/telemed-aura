import type { ExtractedVitals } from "../core/types.js";

/**
 * Lightweight ML-style risk adjustment (weighted features).
 * Returns delta to add to rule riskScore (-10 .. +25).
 */
export function mlRiskAdjustment(input: {
  extractedVitals: ExtractedVitals;
  detectedConditions: string[];
  textLength: number;
  category: string;
}): number {
  let score = 0;
  const v = input.extractedVitals;

  if (v.bloodPressureSystolic && v.bloodPressureSystolic > 130) score += 4;
  if (v.fastingGlucose && v.fastingGlucose > 110) score += 5;
  if (v.hba1c && v.hba1c > 6) score += 6;
  if (v.hemoglobin && v.hemoglobin < 11) score += 7;
  if (v.ldl && v.ldl > 130) score += 4;

  score += Math.min(10, input.detectedConditions.length * 3);
  if (input.textLength < 50) score += 3;
  if (/x-ray|radiology|ct/i.test(input.category)) score += 5;

  return Math.min(25, Math.max(-5, score));
}
