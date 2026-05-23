import { Router } from "express";
import * as authController from "./auth.controller.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";
import { uploadDoctorCertificate } from "../../shared/middleware/upload.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { authRateLimiter } from "../../shared/middleware/rate-limit.middleware.js";
import {
  registerPatientSchema,
  registerDoctorSchema,
  loginSchema,
  forgotPasswordRequestSchema,
  forgotPasswordResetSchema,
  updateProfileSchema,
} from "../../shared/validations/auth.schemas.js";

export const authRoutes = Router();

authRoutes.get("/specialties", authController.specialties);

authRoutes.post(
  "/register",
  authRateLimiter,
  validate(registerPatientSchema),
  authController.register,
);

authRoutes.post(
  "/register/doctor",
  authRateLimiter,
  uploadDoctorCertificate.single("certificate"),
  validate(registerDoctorSchema),
  authController.registerDoctor,
);

authRoutes.post("/login", authRateLimiter, validate(loginSchema), authController.login);

authRoutes.post(
  "/forgot-password/request",
  authRateLimiter,
  validate(forgotPasswordRequestSchema),
  authController.requestForgotPasswordOtp,
);

authRoutes.post(
  "/forgot-password/reset",
  authRateLimiter,
  validate(forgotPasswordResetSchema),
  authController.resetPasswordWithOtp,
);

authRoutes.get("/me", requireAuth, authController.me);
authRoutes.patch(
  "/me/profile",
  requireAuth,
  validate(updateProfileSchema),
  authController.updateProfile,
);
