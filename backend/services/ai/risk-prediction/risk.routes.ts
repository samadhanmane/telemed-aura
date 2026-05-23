import { Router } from "express";
import { calculateVitalsRisk } from "../core/risk-vitals.js";
import { analyzeSymptoms } from "../core/symptom-analyzer.js";

export const riskRoutes = Router();

riskRoutes.post("/vitals", (req, res) => {
  try {
    const result = calculateVitalsRisk(req.body);
    return res.json({ success: true, result });
  } catch (e) {
    return res.status(500).json({ error: "Risk calculation failed" });
  }
});

riskRoutes.post("/combined", (req, res) => {
  try {
    const { symptoms, description, ...vitals } = req.body;
    const symptomResult = symptoms?.length || description
      ? analyzeSymptoms({ symptoms: symptoms ?? [], description })
      : null;
    const vitalsResult = calculateVitalsRisk(vitals);

    const combinedScore = Math.min(
      symptomResult?.risk ?? 30,
      vitalsResult.healthScore < 50 ? 80 : 100 - vitalsResult.healthScore,
    );

    return res.json({
      success: true,
      symptom: symptomResult,
      vitals: vitalsResult,
      combinedRiskScore: Math.round(combinedScore),
      priority: symptomResult?.triagePriority ?? 4,
    });
  } catch (e) {
    return res.status(500).json({ error: "Combined risk failed" });
  }
});
