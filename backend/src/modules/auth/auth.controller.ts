import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as authService from "./auth.service.js";
import * as passwordResetService from "./password-reset.service.js";
import { SPECIALTIES } from "../../constants/specialties.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { badRequest } from "../../shared/errors/app-error.js";

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  if (role === "doctor") {
    throw badRequest(
      "Doctor registration requires a medical certificate — use the doctor registration form",
    );
  }

  const user = await authService.registerPatient(req.body);
  const { token } = await authService.login(req.body.email, req.body.password);
  return sendSuccess(
    res,
    "Registration completed successfully",
    { user, token },
    201,
  );
});

export const registerDoctor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file?.buffer) {
    throw badRequest("Medical certificate PDF or image is required");
  }

  const result = await authService.registerDoctor({
    ...req.body,
    certificateBuffer: file.buffer,
    certificateMimeType: file.mimetype,
    certificateFilename: file.originalname,
  });

  return sendSuccess(res, result.message, result, 201);
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password);
  return sendSuccess(res, "Login successful", result);
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  return sendSuccess(res, "Profile loaded", { user });
});

export const specialties = asyncHandler(async (_req: AuthRequest, res: Response) => {
  return sendSuccess(res, "Specialties loaded", { specialties: SPECIALTIES });
});

export const requestForgotPasswordOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await passwordResetService.requestPasswordResetOtp(req.body.email);
  return sendSuccess(res, result.message, result);
});

export const resetPasswordWithOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await passwordResetService.resetPasswordWithOtp(
    req.body.email,
    String(req.body.otp),
    req.body.newPassword,
  );
  return sendSuccess(res, result.message, result);
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.updateProfile(req.user!.userId, req.body);
  return sendSuccess(res, "Profile updated", { user });
});
