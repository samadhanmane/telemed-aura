import type { SeverityLevel } from "../core/types.js";

/**
 * Symptom triage aligned with common ED / primary-care frameworks:
 * - Critical: life-threatening red flags (WHO MCM red signs, ESI 1–2 patterns)
 * - High: urgent evaluation within hours (chest pain, severe dyspnea, neuro deficits)
 * - Moderate: same-day / 24–48h care (fever + cough cluster, persistent GI symptoms)
 * - Low: self-care / routine visit (isolated mild cold symptoms, mild headache, fatigue)
 */

const SEVERITY_RANK: Record<SeverityLevel, number> = {
  Low: 0,
  Moderate: 1,
  High: 2,
  Critical: 3,
};

export function maxSymptomSeverity(a: SeverityLevel, b: SeverityLevel): SeverityLevel {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

const CRITICAL_PATTERNS =
  /\b(cannot breathe|can't breathe|choking|crushing chest|heart attack|cardiac arrest|stroke|unconscious|unresponsive|seizure|convulsio|severe bleeding|massive bleed|suicidal|kill myself|overdose|anaphylaxis|throat closing|cyanosis|blue lips)\b/i;

const HIGH_PATTERNS =
  /\b(chest pain|crushing pain|pressure in chest|severe shortness of breath|severe breathlessness|difficulty breathing|trouble breathing|severe headache|worst headache|thunderclap|sudden severe|worst ever|vision loss|facial droop|arm weakness|slurred speech|confusion sudden|severe abdominal|vomit blood|blood in stool|black stool|high fever.*(?:confusion|stiff neck)|stiff neck|heavy bleeding|fainting|syncope|passed out)\b/i;

const MODERATE_PATTERNS =
  /\b(fever|persistent fever|productive cough|wheez|uti|burning urination|nausea|vomiting|diarrhea|abdominal pain|stomach pain|back pain|rash|dizziness|migraine|sore throat|cough|fatigue|body ache)\b/i;

const MILD_SYMPTOM_CHIPS = new Set([
  "fever",
  "headache",
  "cough",
  "fatigue",
  "sore throat",
  "body ache",
]);

export type SymptomTriageResult = {
  severity: SeverityLevel;
  riskScore: number;
  redFlags: string[];
  matchedTier: string;
};

export function stableRiskForSeverity(severity: SeverityLevel, emergency: boolean): number {
  if (emergency || severity === "Critical") return 92;
  switch (severity) {
    case "High":
      return 68;
    case "Moderate":
      return 44;
    default:
      return 24;
  }
}

export function triageSymptomText(input: {
  symptoms: string[];
  description?: string;
  bodyArea?: string;
}): SymptomTriageResult {
  const text = [...input.symptoms, input.description ?? "", input.bodyArea ?? ""]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const redFlags: string[] = [];
  let severity: SeverityLevel = "Low";
  let matchedTier = "mild_or_unspecified";

  if (!text) {
    return { severity: "Low", riskScore: 22, redFlags, matchedTier: "no_input" };
  }

  if (CRITICAL_PATTERNS.test(text)) {
    severity = "Critical";
    matchedTier = "critical_red_flag";
    redFlags.push("Life-threatening symptom pattern detected");
  }

  if (HIGH_PATTERNS.test(text)) {
    severity = maxSymptomSeverity(severity, "High");
    if (matchedTier === "mild_or_unspecified") matchedTier = "high_urgent";
    redFlags.push("Urgent symptom pattern — seek care today");
  }

  const chipSet = new Set(input.symptoms.map((s) => s.toLowerCase().trim()));
  const onlyMildChips =
    chipSet.size > 0 &&
    [...chipSet].every((s) => MILD_SYMPTOM_CHIPS.has(s)) &&
    !HIGH_PATTERNS.test(text) &&
    !CRITICAL_PATTERNS.test(text);

  if (onlyMildChips && severity === "Low") {
    return {
      severity: "Low",
      riskScore: stableRiskForSeverity("Low", false),
      redFlags,
      matchedTier: "mild_chips_only",
    };
  }

  if (severity === "Low" && MODERATE_PATTERNS.test(text)) {
    const chipCount = chipSet.size;
    if (chipCount >= 3 || /fever.*cough|cough.*fever/i.test(text)) {
      severity = "Moderate";
      matchedTier = "moderate_multi_symptom";
    } else if (chipCount === 2) {
      severity = "Moderate";
      matchedTier = "moderate_two_symptoms";
    } else {
      severity = "Moderate";
      matchedTier = "moderate_general";
    }
  }

  const emergency = severity === "Critical";
  const riskScore = stableRiskForSeverity(severity, emergency);

  return { severity, riskScore, redFlags, matchedTier };
}
