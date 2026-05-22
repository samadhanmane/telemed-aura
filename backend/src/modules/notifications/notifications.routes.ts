import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);
/** In-app notifications — triggers email via services/email */
notificationRoutes.get("/", (_req, res) => res.status(501).json({ message: "Not implemented" }));
