import { Router } from "express";

export const scannerRoutes = Router();

scannerRoutes.post("/analyze", (_req, res) => res.status(501).json({ message: "Not implemented" }));
