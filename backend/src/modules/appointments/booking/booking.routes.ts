import { Router } from "express";
import { requireAuth } from "../../../shared/middleware/auth.middleware.js";

export const bookingRoutes = Router();

bookingRoutes.use(requireAuth);
/** Book slot — body includes severity from AI triage for priority queue */
bookingRoutes.post("/", (_req, res) => res.status(501).json({ message: "Not implemented" }));
bookingRoutes.get("/queue", (_req, res) => res.status(501).json({ message: "Not implemented" }));
