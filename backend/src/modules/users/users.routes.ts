import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

export const userRoutes = Router();

userRoutes.use(requireAuth);
userRoutes.get("/me", (_req, res) => res.status(501).json({ message: "Not implemented" }));
