import type { SeverityLevel } from "./types.js";

/**
 * Wellness index 0–100 (higher = better overall tracked wellness).
 * Separate from scan "screening risk index" (higher = more urgent triage).
 */
export function computeWellnessScoreFromScan(input: {
  previousScore: number;
  scanRisk: number;
  severity: SeverityLevel;
}): number {
  const prev = input.previousScore ?? 82;
  const scanWellness = Math.max(15, Math.min(98, 100 - input.scanRisk * 0.85));
  let blended = Math.round(prev * 0.65 + scanWellness * 0.35);

  if (input.severity === "Critical") blended = Math.min(blended, 35);
  else if (input.severity === "High") blended = Math.min(blended, 50);
  else if (input.severity === "Moderate") blended = Math.min(blended, 72);

  return Math.max(20, Math.min(98, blended));
}

/** Screening / triage urgency index 0–100 (higher = needs attention sooner). */
export function screeningRiskIndex(scanRisk: number, severity: SeverityLevel): number {
  const base = scanRisk;
  if (severity === "Critical") return Math.max(base, 90);
  if (severity === "High") return Math.max(base, 65);
  if (severity === "Moderate") return Math.min(Math.max(base, 38), 58);
  return Math.min(base, 42);
}
