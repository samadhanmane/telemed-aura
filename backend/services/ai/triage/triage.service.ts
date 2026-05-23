import { computeTriageSeverity, severityToPriority } from "../core/triage.js";
import type { SeverityLevel } from "../core/types.js";

export function computeSeverity(
  findings: string[],
  emergency = false,
  risk = 50,
): { severity: SeverityLevel; priority: number } {
  const severity = computeTriageSeverity(findings, emergency, risk);
  return { severity, priority: severityToPriority(severity, emergency) };
}
