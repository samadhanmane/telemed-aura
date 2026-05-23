import type { ExtractedVitals, GeminiVisionFindings, SeverityLevel } from "../core/types.js";
import { SEVERE_DISEASE_PATTERNS } from "./disease-severity.rules.js";
import { severityFromRemarks } from "./remark-severity.rules.js";

const SEVERITY_RANK: Record<SeverityLevel, number> = {
  Low: 0,
  Moderate: 1,
  High: 2,
  Critical: 3,
};

function maxSeverity(a: SeverityLevel, b: SeverityLevel): SeverityLevel {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

function vitalsSeverity(v: ExtractedVitals): { severity: SeverityLevel; risk: number; flags: string[] } {
  const flags: string[] = [];
  let severity: SeverityLevel = "Low";
  let risk = 25;

  if (v.bloodPressureSystolic != null && v.bloodPressureDiastolic != null) {
    if (v.bloodPressureSystolic >= 180 || v.bloodPressureDiastolic >= 120) {
      severity = maxSeverity(severity, "Critical");
      risk = Math.max(risk, 90);
      flags.push("Hypertensive crisis range BP");
    } else if (v.bloodPressureSystolic >= 140 || v.bloodPressureDiastolic >= 90) {
      severity = maxSeverity(severity, "High");
      risk = Math.max(risk, 72);
      flags.push("Elevated blood pressure");
    } else if (v.bloodPressureSystolic >= 130 || v.bloodPressureDiastolic >= 85) {
      severity = maxSeverity(severity, "Moderate");
      risk = Math.max(risk, 48);
    }
  }

  const glucose = v.fastingGlucose ?? v.randomGlucose;
  if (glucose != null) {
    if (glucose >= 300) {
      severity = maxSeverity(severity, "Critical");
      risk = Math.max(risk, 88);
      flags.push("Very high blood glucose");
    } else if (glucose >= 200) {
      severity = maxSeverity(severity, "High");
      risk = Math.max(risk, 70);
      flags.push("High blood glucose");
    } else if (glucose >= 126) {
      severity = maxSeverity(severity, "Moderate");
      risk = Math.max(risk, 52);
    }
  }

  if (v.hba1c != null && v.hba1c >= 8) {
    severity = maxSeverity(severity, "High");
    risk = Math.max(risk, 68);
    flags.push("HbA1c indicates poor glycemic control");
  } else if (v.hba1c != null && v.hba1c >= 6.5) {
    severity = maxSeverity(severity, "Moderate");
    risk = Math.max(risk, 50);
  }

  if (v.hemoglobin != null && v.hemoglobin < 7) {
    severity = maxSeverity(severity, "Critical");
    risk = Math.max(risk, 85);
    flags.push("Severe anemia (Hb)");
  } else if (v.hemoglobin != null && v.hemoglobin < 10) {
    severity = maxSeverity(severity, "High");
    risk = Math.max(risk, 65);
    flags.push("Low hemoglobin");
  }

  if (v.ldl != null && v.ldl > 160) {
    severity = maxSeverity(severity, "Moderate");
    risk = Math.max(risk, 55);
    flags.push("High LDL");
  }

  if (v.oxygenSaturation != null && v.oxygenSaturation < 90) {
    severity = maxSeverity(severity, "Critical");
    risk = Math.max(risk, 92);
    flags.push("Low oxygen saturation");
  }

  return { severity, risk, flags };
}

/**
 * Rule-only severity — Gemini output is NOT used here.
 */
export function computeRuleSeverity(input: {
  category: string;
  reportText: string;
  extractedVitals: ExtractedVitals;
  severeConditions: string[];
  moderateConditions: string[];
  visionFindings?: GeminiVisionFindings | null;
  mlRiskAdjustment?: number;
  isImagingStudy?: boolean;
  visionUsed?: boolean;
  /** OCR, vision findings, synthesis bullets, doctor remarks — rule keyword scan only */
  remarkTexts?: string[];
}): {
  severity: SeverityLevel;
  riskScore: number;
  abnormalities: string[];
} {
  const combined = `${input.category} ${input.reportText}`.toLowerCase();
  const abnormalities: string[] = [];
  let severity: SeverityLevel = "Low";
  let riskScore = 30;

  const vitalsResult = vitalsSeverity(input.extractedVitals);
  severity = maxSeverity(severity, vitalsResult.severity);
  riskScore = Math.max(riskScore, vitalsResult.risk);
  abnormalities.push(...vitalsResult.flags);

  for (const label of input.severeConditions) {
    severity = maxSeverity(severity, "High");
    riskScore = Math.max(riskScore, 78);
    abnormalities.push(`Detected condition: ${label}`);
    const rule = SEVERE_DISEASE_PATTERNS.find((p) => p.label === label);
    if (rule?.minSeverity === "Critical") {
      severity = "Critical";
      riskScore = Math.max(riskScore, 90);
    }
  }

  for (const label of input.moderateConditions) {
    severity = maxSeverity(severity, "Moderate");
    riskScore = Math.max(riskScore, 45);
    if (!abnormalities.some((a) => a.includes(label))) {
      abnormalities.push(`Screening flag: ${label}`);
    }
  }

  const catLower = input.category.toLowerCase();
  const isImaging =
    Boolean(input.isImagingStudy) ||
    catLower.includes("x-ray") ||
    catLower.includes("radiology") ||
    catLower.includes("ct") ||
    catLower.includes("mri") ||
    catLower.includes("ecg") ||
    catLower.includes("dermatology") ||
    catLower.includes("skin") ||
    combined.includes("x-ray") ||
    combined.includes("radiograph") ||
    combined.includes("chest x");

  if (isImaging) {
    const hasVision =
      Boolean(input.visionUsed) &&
      Boolean(
        input.visionFindings?.imagingSummary ||
          input.visionFindings?.visibleFindings?.length ||
          input.visionFindings?.clinicalFlags?.length,
      );

    if (hasVision) {
      severity = maxSeverity(severity, "Moderate");
      riskScore = Math.max(riskScore, 52);
      abnormalities.push("Imaging study — AI vision read applied; clinician must confirm");
      for (const f of input.visionFindings!.visibleFindings?.slice(0, 5) ?? []) {
        abnormalities.push(`Imaging note: ${f}`);
      }
      for (const f of input.visionFindings!.clinicalFlags?.slice(0, 4) ?? []) {
        abnormalities.push(`Image flag: ${f}`);
      }
      if (input.visionFindings!.imagingSummary) {
        abnormalities.push(
          `Imaging summary: ${input.visionFindings!.imagingSummary.slice(0, 120)}`,
        );
      }
      const visionBlob = [
        input.visionFindings!.imagingSummary ?? "",
        ...(input.visionFindings!.clinicalFlags ?? []),
        ...(input.visionFindings!.visibleFindings ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (
        /opacity|infiltrat|consolidat|pneumonia|effusion|collapse|fracture|critical|severe|extensive|bilateral/i.test(
          visionBlob,
        )
      ) {
        severity = maxSeverity(severity, "High");
        riskScore = Math.max(riskScore, 72);
      }
    } else {
      severity = maxSeverity(severity, "Moderate");
      riskScore = Math.max(riskScore, 58);
      abnormalities.push(
        "Medical image uploaded — automated rules cannot grade the film without AI vision; not a low-risk result",
      );
    }
  }

  if (input.remarkTexts?.length) {
    const remarkResult = severityFromRemarks(input.remarkTexts, { severity, riskScore });
    severity = maxSeverity(severity, remarkResult.severity);
    riskScore = Math.min(98, riskScore + remarkResult.riskBump);
    abnormalities.push(...remarkResult.flags);
  }

  if (combined.includes("critical") || combined.includes("urgent")) {
    severity = maxSeverity(severity, "High");
    riskScore = Math.max(riskScore, 75);
  }

  if (input.mlRiskAdjustment != null) {
    riskScore = Math.min(98, Math.max(riskScore, Math.round(riskScore + input.mlRiskAdjustment)));
    if (input.mlRiskAdjustment > 15) severity = maxSeverity(severity, "Moderate");
    if (input.mlRiskAdjustment > 25) severity = maxSeverity(severity, "High");
  }

  if (severity === "Critical") riskScore = Math.max(riskScore, 88);
  else if (severity === "High") riskScore = Math.max(riskScore, 65);
  else if (severity === "Moderate") riskScore = Math.max(riskScore, 42);
  else riskScore = Math.min(riskScore, 40);

  return { severity, riskScore, abnormalities };
}
