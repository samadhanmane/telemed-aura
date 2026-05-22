import { Router } from "express";
import { scannerRoutes } from "../symptom-scanner/scanner.routes.js";
import { triageRoutes } from "../triage/triage.routes.js";

export const aiRouter = Router();

aiRouter.use("/scanner", scannerRoutes);
aiRouter.use("/triage", triageRoutes);
aiRouter.post("/risk-score", (_req, res) => res.status(501).json({ message: "Not implemented" }));
