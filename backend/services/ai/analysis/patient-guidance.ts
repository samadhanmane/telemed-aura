import type { ExtractedVitals, PatientGuidance, RuleAnalysisPartial, SeverityLevel } from "../core/types.js";

/** Rule-based pros/cons/do/avoid from parsed vitals and flags (no Gemini scores). */
export function buildRuleBasedGuidance(input: {
  rules: RuleAnalysisPartial;
  severity: SeverityLevel;
  riskScore: number;
  isImaging?: boolean;
  visionUsed?: boolean;
}): PatientGuidance {
  const { rules, severity, riskScore } = input;
  const v = rules.extractedVitals;
  const pros: string[] = [];
  const cons: string[] = [];
  const doList: string[] = [];
  const avoidList: string[] = [];

  if (v.bloodPressureSystolic != null && v.bloodPressureSystolic < 130 && (v.bloodPressureDiastolic ?? 0) < 85) {
    pros.push("Blood pressure reading is within a generally healthy range on this report.");
  }
  if ((v.fastingGlucose ?? v.randomGlucose ?? 999) < 100) {
    pros.push("Blood sugar value on this report is not in the diabetic range.");
  }
  if (v.hemoglobin != null && v.hemoglobin >= 12) {
    pros.push("Hemoglobin is not flagged as severely low.");
  }
  if (v.ldl != null && v.ldl < 130) {
    pros.push("LDL cholesterol is below a commonly cited high-risk threshold.");
  }
  if (rules.chartData.length >= 3) {
    pros.push("Several lab markers were extracted — useful for tracking trends.");
  }
  if (severity === "Low" && riskScore < 40 && !input.isImaging) {
    pros.push("Automated screening shows low concern on available text.");
  }
  if (input.isImaging) {
    cons.push(
      input.visionUsed
        ? "Imaging findings need confirmation by a qualified clinician."
        : "This is an X-ray/image — automated screening cannot grade the film without AI vision.",
    );
    doList.push("Share this image with a doctor or radiologist for official interpretation.");
    avoidList.push("Do not assume a low screening score means a normal X-ray.");
  }

  if (v.bloodPressureSystolic != null && v.bloodPressureSystolic >= 140) {
    cons.push(`Elevated blood pressure (${v.bloodPressureSystolic}/${v.bloodPressureDiastolic ?? "—"} mmHg).`);
    avoidList.push("Avoid excess salt, heavy lifting, and skipping BP medicines without doctor advice.");
    doList.push("Recheck blood pressure and share readings with your doctor.");
  }
  if ((v.fastingGlucose ?? v.randomGlucose ?? 0) >= 126) {
    cons.push(`High blood sugar (${v.fastingGlucose ?? v.randomGlucose} mg/dL) on this report.`);
    avoidList.push("Limit sugary drinks, refined carbs, and fasting skips if you are on diabetes meds.");
    doList.push("Discuss glucose control and HbA1c testing with your physician.");
  }
  if (v.hemoglobin != null && v.hemoglobin < 10) {
    cons.push(`Low hemoglobin (${v.hemoglobin} g/dL) — possible anemia.`);
    doList.push("Ask about iron studies, B12, and causes of low Hb.");
  }
  if (v.ldl != null && v.ldl >= 160) {
    cons.push(`High LDL (${v.ldl} mg/dL).`);
    doList.push("Discuss diet, activity, and lipid-lowering options with your doctor.");
  }

  for (const a of rules.abnormalities.slice(0, 3)) {
    cons.push(a);
  }
  if (rules.detectedConditions.length) {
    cons.push(`Terms flagged in document: ${rules.detectedConditions.slice(0, 3).join(", ")}.`);
  }

  doList.push("Keep this report in Doc Assistant and discuss results at your next visit.");
  if (severity === "High" || severity === "Critical") {
    doList.push("Book a specialist or GP consultation soon — do not rely on AI alone.");
    avoidList.push("Do not ignore worsening symptoms while waiting for follow-up.");
  } else if (severity === "Moderate") {
    doList.push("Monitor symptoms and repeat labs if your doctor advises.");
  }

  if (!avoidList.length) {
    avoidList.push("Do not change prescription doses based only on this AI summary.");
  }
  if (!pros.length) {
    pros.push("Report uploaded and processed — share the original file with your clinician.");
  }

  return {
    pros: [...new Set(pros)].slice(0, 5),
    cons: [...new Set(cons)].slice(0, 5),
    doList: [...new Set(doList)].slice(0, 6),
    avoidList: [...new Set(avoidList)].slice(0, 5),
  };
}

export function mergeGuidance(
  rule: PatientGuidance,
  fromSynthesis?: Partial<PatientGuidance>,
): PatientGuidance {
  if (!fromSynthesis) return rule;
  return {
    pros: [...new Set([...(fromSynthesis.pros ?? []), ...rule.pros])].slice(0, 6),
    cons: [...new Set([...(fromSynthesis.cons ?? []), ...rule.cons])].slice(0, 6),
    doList: [...new Set([...(fromSynthesis.doList ?? []), ...rule.doList])].slice(0, 7),
    avoidList: [...new Set([...(fromSynthesis.avoidList ?? []), ...rule.avoidList])].slice(0, 6),
  };
}
