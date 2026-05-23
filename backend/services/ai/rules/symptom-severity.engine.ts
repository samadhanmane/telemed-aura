import type { SeverityLevel, VitalsRiskInput } from "../core/types.js";
import { stableRiskForSeverity } from "./symptom-triage.rules.js";

const SEVERITY_RANK: Record<SeverityLevel, number> = {
  Low: 0,
  Moderate: 1,
  High: 2,
  Critical: 3,
};

function maxSeverity(a: SeverityLevel, b: SeverityLevel): SeverityLevel {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/** Symptom-only red flags in patient text — NOT document/imaging remark patterns. */
const SYMPTOM_CRITICAL =
  /\b(cannot breathe|can't breathe|choking|heart attack|stroke|unconscious|seizure|severe bleeding|suicidal)\b/i;

const SYMPTOM_HIGH =
  /\b(chest pain|severe shortness of breath|difficulty breathing|worst headache|thunderclap|facial droop|slurred speech|vomit blood|fainting|passed out)\b/i;

/** Rule-based vitals — never from LLM. */
export function vitalsContribution(vitals: VitalsRiskInput): {
  severity: SeverityLevel;
  riskBump: number;
  flags: string[];
} {
  const flags: string[] = [];
  let severity: SeverityLevel = "Low";
  let riskBump = 0;

  const sys = vitals.bloodPressureSystolic;
  const dia = vitals.bloodPressureDiastolic;

  if (sys != null && dia != null) {
    if (sys >= 180 || dia >= 120) {
      severity = "Critical";
      riskBump = Math.max(riskBump, 28);
      flags.push("Blood pressure in hypertensive crisis range");
    } else if (sys >= 140 || dia >= 90) {
      severity = maxSeverity(severity, "High");
      riskBump = Math.max(riskBump, 14);
      flags.push("Elevated blood pressure");
    } else if (sys >= 130 || dia >= 85) {
      severity = maxSeverity(severity, "Moderate");
      riskBump = Math.max(riskBump, 6);
      flags.push("Borderline elevated blood pressure");
    }
  }

  const sugar = vitals.sugarLevel;
  if (sugar != null) {
    if (sugar >= 300) {
      severity = maxSeverity(severity, "Critical");
      riskBump = Math.max(riskBump, 26);
      flags.push("Very high blood glucose");
    } else if (sugar >= 200) {
      severity = maxSeverity(severity, "High");
      riskBump = Math.max(riskBump, 12);
      flags.push("High blood glucose");
    } else if (sugar >= 126) {
      severity = maxSeverity(severity, "Moderate");
      riskBump = Math.max(riskBump, 6);
      flags.push("Elevated blood glucose");
    } else if (sugar < 54) {
      severity = "Critical";
      riskBump = Math.max(riskBump, 24);
      flags.push("Low blood glucose — urgent");
    }
  }

  const spo2 = vitals.oxygenLevel;
  if (spo2 != null) {
    if (spo2 < 90) {
      severity = "Critical";
      riskBump = Math.max(riskBump, 30);
      flags.push("Low oxygen saturation (SpO₂) — seek urgent care");
    } else if (spo2 < 94) {
      severity = maxSeverity(severity, "High");
      riskBump = Math.max(riskBump, 12);
      flags.push("Below normal oxygen saturation");
    }
  }

  if ((vitals.heartRate ?? 0) >= 130) {
    severity = maxSeverity(severity, "High");
    riskBump = Math.max(riskBump, 10);
    flags.push("Elevated heart rate");
  }

  return { severity, riskBump, flags };
}

/** Conservative bump from patient narrative only — avoids Gemini/doc remark false positives. */
export function severityFromSymptomNarrative(remarkTexts: string[]): {
  severity: SeverityLevel;
  riskBump: number;
  flags: string[];
} {
  const combined = remarkTexts.filter(Boolean).join(" ").slice(0, 4000);
  if (!combined.trim()) {
    return { severity: "Low", riskBump: 0, flags: [] };
  }

  let severity: SeverityLevel = "Low";
  let riskBump = 0;
  const flags: string[] = [];

  if (SYMPTOM_CRITICAL.test(combined)) {
    severity = "Critical";
    riskBump = 20;
    flags.push("Critical wording in your symptom description");
  } else if (SYMPTOM_HIGH.test(combined)) {
    severity = "High";
    riskBump = 12;
    flags.push("Urgent wording in your symptom description");
  }

  return { severity, riskBump, flags };
}

export function computeSymptomSeverity(input: {
  baseSeverity: SeverityLevel;
  baseRisk: number;
  emergency: boolean;
  /** Patient symptoms + description only — do not pass Gemini condition lists. */
  patientTexts: string[];
  vitals?: VitalsRiskInput;
  age?: number;
  chronicDiseases?: string[];
}): {
  severity: SeverityLevel;
  riskScore: number;
  abnormalities: string[];
} {
  let severity = input.emergency ? "Critical" : input.baseSeverity;
  let riskScore = input.emergency ? Math.max(input.baseRisk, 92) : input.baseRisk;
  const abnormalities: string[] = [];

  if (input.patientTexts.length) {
    const narrative = severityFromSymptomNarrative(input.patientTexts);
    severity = maxSeverity(severity, narrative.severity);
    riskScore = Math.min(95, riskScore + narrative.riskBump);
    abnormalities.push(...narrative.flags);
  }

  if (input.vitals) {
    const v = vitalsContribution(input.vitals);
    severity = maxSeverity(severity, v.severity);
    riskScore = Math.min(95, riskScore + v.riskBump);
    abnormalities.push(...v.flags);
  }

  if (input.age != null && input.age >= 65 && severity !== "Low") {
    riskScore = Math.min(90, riskScore + 4);
    abnormalities.push("Age 65+ — lower threshold for clinician review");
  }

  if (input.chronicDiseases?.length) {
    abnormalities.push(`Chronic conditions: ${input.chronicDiseases.join(", ")}`);
    if (severity === "Moderate") riskScore = Math.min(88, riskScore + 3);
  }

  const floor = stableRiskForSeverity(severity, input.emergency);
  const ceiling =
    severity === "Low" ? 42 : severity === "Moderate" ? 58 : severity === "High" ? 78 : 98;
  riskScore = Math.max(floor, Math.min(ceiling, riskScore));

  return { severity, riskScore, abnormalities: [...new Set(abnormalities)].slice(0, 10) };
}
