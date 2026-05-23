import { Router } from "express";
import { scannerRoutes } from "../symptom-scanner/scanner.routes.js";
import { triageRoutes } from "../triage/triage.routes.js";
import { scanAnalyzerRoutes } from "../scan-analyzer/scan.routes.js";
import { ocrRoutes } from "../prescription-ocr/ocr.routes.js";
import { riskRoutes } from "../risk-prediction/risk.routes.js";
import { healthSummaryRoutes } from "../health-summary/health-summary.routes.js";
import { suggestMedicines } from "../core/medicine-suggestions.js";

export const aiRouter = Router();

aiRouter.use("/scanner", scannerRoutes);
aiRouter.use("/triage", triageRoutes);
aiRouter.use("/scan-analyzer", scanAnalyzerRoutes);
aiRouter.use("/prescription-ocr", ocrRoutes);
aiRouter.use("/risk", riskRoutes);
aiRouter.use("/health-summary", healthSummaryRoutes);

aiRouter.post("/medicines/suggest", (req, res) => {
  const { condition } = req.body;
  if (!condition) return res.status(400).json({ error: "condition required" });
  return res.json({ success: true, medicines: suggestMedicines(String(condition)) });
});

aiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ai",
    features: ["scanner", "triage", "scan-analyzer", "prescription-ocr", "risk", "health-summary"],
    gemini: Boolean(process.env.AI_API_KEY || process.env.GEMINI_API_KEY),
  });
});
