import type { SeverityLevel } from "../core/types.js";

const SEVERITY_RANK: Record<SeverityLevel, number> = {
  Low: 0,
  Moderate: 1,
  High: 2,
  Critical: 3,
};

function maxSeverity(a: SeverityLevel, b: SeverityLevel): SeverityLevel {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/** Critical phrases from OCR, vision notes, PDF text, or clinician remarks. */
const CRITICAL_PATTERNS =
  /\b(malignant|metastas|infarct|hemorrhage|haemorrhage|pneumothorax|sepsis|tamponade|cardiac arrest|life[- ]?threatening|hypertensive crisis|severe hypox|acute (?:coronary|mi|stroke)|critical value|imminent|massive (?:bleed|hemorrhage))\b/i;

const HIGH_PATTERNS =
  /\b(opacity|infiltrat|consolidation|fracture|dislocation|mass|lesion|nodule|effusion|cardiomegaly|pneumonia|embol|dvt|tumor|tumour|malignan|positive for|markedly elevated|severely (?:low|high|abnormal)|uncontrolled|acute infection|severe anemia|severe anaemia|critical finding|suspicious|abnormal (?:finding|result)|significant (?:finding|abnormality))\b/i;

const MODERATE_PATTERNS =
  /\b(borderline|slightly elevated|mild(?:ly)?|monitor|follow[- ]?up|recommend(?:ed)? repeat|chronic|suboptimal|below normal|above normal|deviat|watch|needs? (?:review|attention))\b/i;

const IMAGING_DOC_TYPES = /x[- ]?ray|radiology|ct scan|mri|ultrasound|ecg|ekg|dermatology|skin/i;

export type RemarkSeverityResult = {
  severity: SeverityLevel;
  riskBump: number;
  flags: string[];
};

/**
 * Rule-only bump from free-text remarks (vision, PDF/OCR, synthesis bullets, doctor notes).
 * Never trusts an LLM severity score — only keyword patterns on text.
 */
export function severityFromRemarks(
  remarkTexts: string[],
  base: { severity: SeverityLevel; riskScore: number },
): RemarkSeverityResult {
  const combined = remarkTexts.filter(Boolean).join(" ").slice(0, 12000);
  if (!combined.trim()) {
    return { severity: base.severity, riskBump: 0, flags: [] };
  }

  let severity = base.severity;
  let riskBump = 0;
  const flags: string[] = [];

  if (CRITICAL_PATTERNS.test(combined)) {
    severity = maxSeverity(severity, "Critical");
    riskBump = Math.max(riskBump, 28);
    flags.push("Critical language in report/imaging remarks");
  }

  if (HIGH_PATTERNS.test(combined)) {
    severity = maxSeverity(severity, "High");
    riskBump = Math.max(riskBump, 18);
    flags.push("Significant finding noted in document remarks");
  }

  if (MODERATE_PATTERNS.test(combined) && severity === "Low") {
    severity = maxSeverity(severity, "Moderate");
    riskBump = Math.max(riskBump, 10);
    flags.push("Moderate concern language in remarks");
  }

  if (IMAGING_DOC_TYPES.test(combined) && /review|radiologist|correlate/i.test(combined)) {
    severity = maxSeverity(severity, "Moderate");
    riskBump = Math.max(riskBump, 8);
  }

  return { severity, riskBump, flags };
}

export function collectDocumentRemarks(input: {
  reportText: string;
  vision?: {
    imagingSummary?: string;
    visibleFindings?: string[];
    suggestedFollowUp?: string[];
    clinicalFlags?: string[];
  } | null;
  synthesis?: {
    insights?: string[];
    doctorNote?: string;
    narrative?: string;
    patientProblemSummary?: string;
  } | null;
  doctorRemarks?: string;
}): string[] {
  const parts: string[] = [];
  if (input.reportText) parts.push(input.reportText.slice(0, 4000));
  if (input.vision?.imagingSummary) parts.push(input.vision.imagingSummary);
  if (input.vision?.visibleFindings?.length) parts.push(...input.vision.visibleFindings);
  if (input.vision?.clinicalFlags?.length) parts.push(...input.vision.clinicalFlags);
  if (input.vision?.suggestedFollowUp?.length) parts.push(...input.vision.suggestedFollowUp);
  if (input.synthesis?.patientProblemSummary) parts.push(input.synthesis.patientProblemSummary);
  if (input.synthesis?.insights?.length) parts.push(...input.synthesis.insights);
  if (input.synthesis?.doctorNote) parts.push(input.synthesis.doctorNote);
  if (input.synthesis?.narrative) parts.push(input.synthesis.narrative.slice(0, 800));
  if (input.doctorRemarks) parts.push(input.doctorRemarks);
  return parts;
}

export function severityToRiskScore(severity: string): number {
  switch (severity) {
    case "Critical":
      return 90;
    case "High":
      return 72;
    case "Moderate":
      return 48;
    default:
      return 32;
  }
}
