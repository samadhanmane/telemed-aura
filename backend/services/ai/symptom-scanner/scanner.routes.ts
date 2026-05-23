import { Router } from "express";
import { runSymptomAnalysis } from "./scanner.service.js";

export const scannerRoutes = Router();

scannerRoutes.post("/analyze", (req, res) => {
  try {
    const { symptoms, description, bodyArea, age, chronicDiseases } = req.body;
    if (!symptoms?.length && !description) {
      return res.status(400).json({ error: "symptoms or description required" });
    }
    const result = runSymptomAnalysis({
      symptoms: symptoms ?? [],
      description,
      bodyArea,
      age,
      chronicDiseases,
    });
    return res.json({ success: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    return res.status(500).json({ success: false, error: msg });
  }
});
