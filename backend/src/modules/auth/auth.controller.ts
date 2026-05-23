import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as authService from "./auth.service.js";
import * as passwordResetService from "./password-reset.service.js";
import { SPECIALTIES } from "../../constants/specialties.js";

export async function register(req: AuthRequest, res: Response) {
  try {
    const { role, name, email, password, phone, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    if (role === "doctor") {
      return res.status(400).json({
        error: "Doctor registration requires a medical certificate — use POST /auth/register/doctor with multipart form",
      });
    }

    const user = await authService.registerPatient({ name, email, password, phone, location });
    const { token } = await authService.login(email, password);
    return res.status(201).json({ user, token });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Registration failed";
    return res.status(400).json({ error: msg });
  }
}

export async function registerDoctor(req: AuthRequest, res: Response) {
  try {
    const file = req.file;
    if (!file?.buffer) {
      return res.status(400).json({ error: "Medical certificate PDF or image is required" });
    }

    const { name, email, password, phone, specialty, licenseNumber, experienceYears, bio } = req.body;
    if (!name || !email || !password || !specialty || !licenseNumber || experienceYears == null) {
      return res.status(400).json({ error: "All doctor fields and certificate are required" });
    }

    const valid = SPECIALTIES.some((s) => s.id === specialty);
    if (!valid) return res.status(400).json({ error: "Invalid specialty" });

    const result = await authService.registerDoctor({
      name,
      email,
      password,
      phone,
      specialty,
      licenseNumber,
      experienceYears: Number(experienceYears),
      bio,
      certificateBuffer: file.buffer,
      certificateMimeType: file.mimetype,
      certificateFilename: file.originalname,
    });

    return res.status(201).json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Registration failed";
    return res.status(400).json({ error: msg });
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const result = await authService.login(email, password);
    return res.json(result);
  } catch (e) {
    const err = e as Error & { code?: string };
    const msg = err.message ?? "Login failed";
    if (err.code === "REGISTRATION_PENDING") {
      return res.status(403).json({ error: msg, code: err.code });
    }
    if (err.code === "REGISTRATION_REJECTED") {
      return res.status(403).json({ error: msg, code: err.code });
    }
    return res.status(401).json({ error: msg });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const user = await authService.getMe(req.user!.userId);
    return res.json({ user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Not found";
    return res.status(404).json({ error: msg });
  }
}

export function specialties(_req: AuthRequest, res: Response) {
  return res.json({ specialties: SPECIALTIES });
}

export async function requestForgotPasswordOtp(req: AuthRequest, res: Response) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }
    const result = await passwordResetService.requestPasswordResetOtp(email);
    return res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not send code";
    return res.status(503).json({ error: msg });
  }
}

export async function resetPasswordWithOtp(req: AuthRequest, res: Response) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, verification code, and new password are required" });
    }
    const result = await passwordResetService.resetPasswordWithOtp(email, String(otp), newPassword);
    return res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Password reset failed";
    return res.status(400).json({ error: msg });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const user = await authService.updateProfile(req.user!.userId, req.body);
    return res.json({ user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return res.status(400).json({ error: msg });
  }
}
