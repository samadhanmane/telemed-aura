import type { SeverityLevel, TriagePriority } from "./types.js";

export function severityToPriority(severity: SeverityLevel, emergency: boolean): TriagePriority {
  if (emergency || severity === "Critical") return 1;
  if (severity === "High") return 2;
  if (severity === "Moderate") return 3;
  return 4;
}

export function computeTriageSeverity(
  findings: string[],
  emergency: boolean,
  risk: number,
): SeverityLevel {
  if (emergency || risk >= 85) return "Critical";
  if (risk >= 65) return "High";
  if (risk >= 45 || findings.length > 2) return "Moderate";
  return "Low";
}
