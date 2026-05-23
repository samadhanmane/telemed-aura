import { Router } from "express";
import { computeSeverity } from "./triage.service.js";

export const triageRoutes = Router();

triageRoutes.post("/severity", (req, res) => {
  const { findings, emergency, risk } = req.body;
  const result = computeSeverity(findings ?? [], Boolean(emergency), Number(risk) || 50);
  return res.json({ success: true, ...result });
});
