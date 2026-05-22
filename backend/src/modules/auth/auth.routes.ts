import { Router } from "express";
import * as authController from "./auth.controller.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

export const authRoutes = Router();

authRoutes.get("/specialties", authController.specialties);
authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.get("/me", requireAuth, authController.me);
