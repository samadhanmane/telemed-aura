import { Router } from "express";

export const triageRoutes = Router();

/** Returns severity for booking priority queue */
triageRoutes.post("/severity", (_req, res) => res.status(501).json({ message: "Not implemented" }));
