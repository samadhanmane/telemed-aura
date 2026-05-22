export type SeverityLevel = "low" | "moderate" | "high" | "critical";

export interface TriageResult {
  severity: SeverityLevel;
  riskPercent: number;
  urgencyNote: string;
}
