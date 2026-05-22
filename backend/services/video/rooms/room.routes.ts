import { Router } from "express";

export const roomRoutes = Router();

/** Create room for appointmentId */
roomRoutes.post("/", (_req, res) => res.status(501).json({ message: "Not implemented" }));
/** Join token for patient/doctor */
roomRoutes.post("/:roomId/token", (_req, res) => res.status(501).json({ message: "Not implemented" }));
roomRoutes.get("/:roomId", (_req, res) => res.status(501).json({ message: "Not implemented" }));
