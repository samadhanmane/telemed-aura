import type { SeverityLevel } from "./triage.types.js";

/** Map scanner output → low | moderate | high | critical */
export function computeSeverity(_findings: string[]): SeverityLevel {
  return "moderate";
}
