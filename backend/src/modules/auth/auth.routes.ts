import { Router } from "express";
import * as authController from "./auth.controller.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";
import { uploadDoctorCertificate } from "../../shared/middleware/upload.middleware.js";

export const authRoutes = Router();

authRoutes.get("/specialties", authController.specialties);
authRoutes.post("/register", authController.register);
authRoutes.post(
  "/register/doctor",
  uploadDoctorCertificate.single("certificate"),
  authController.registerDoctor,
);
authRoutes.post("/login", authController.login);
authRoutes.post("/forgot-password/request", authController.requestForgotPasswordOtp);
authRoutes.post("/forgot-password/reset", authController.resetPasswordWithOtp);
authRoutes.get("/me", requireAuth, authController.me);
authRoutes.patch("/me/profile", requireAuth, authController.updateProfile);
