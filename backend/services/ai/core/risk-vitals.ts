import type { SeverityLevel, VitalsRiskInput } from "./types.js";

export function calculateVitalsRisk(vitals: VitalsRiskInput) {
  let risk: SeverityLevel = "Low";
  let score = 85;
  const flags: string[] = [];

  const sys = vitals.bloodPressureSystolic ?? 0;
  const dia = vitals.bloodPressureDiastolic ?? 0;
  if (sys > 140 || dia > 90) {
    risk = "High";
    score = Math.min(score, 45);
    flags.push("Elevated blood pressure");
  }

  if ((vitals.sugarLevel ?? 0) > 180) {
    risk = "High";
    score = Math.min(score, 40);
    flags.push("High blood glucose");
  }

  if ((vitals.oxygenLevel ?? 100) < 92) {
    risk = "Critical";
    score = Math.min(score, 20);
    flags.push("Low blood oxygen — urgent care");
  }

  if ((vitals.heartRate ?? 0) > 120) {
    score = Math.min(score, 50);
    flags.push("Elevated heart rate");
  }

  return {
    risk,
    healthScore: score,
    flags,
    recommendation:
      risk === "Critical"
        ? "Emergency consultation required"
        : risk === "High"
          ? "Schedule specialist consultation soon"
          : "Vitals within acceptable range — continue monitoring",
  };
}
