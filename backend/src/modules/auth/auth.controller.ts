import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as authService from "./auth.service.js";
import { SPECIALTIES } from "../../constants/specialties.js";

export async function register(req: AuthRequest, res: Response) {
  try {
    const { role, name, email, password, phone, specialty, licenseNumber, experienceYears, consultationFee, bio } =
      req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    let user;
    if (role === "doctor") {
      if (!specialty || !licenseNumber || experienceYears == null || consultationFee == null) {
        return res.status(400).json({ error: "Doctor fields are required" });
      }
      const valid = SPECIALTIES.some((s) => s.id === specialty);
      if (!valid) return res.status(400).json({ error: "Invalid specialty" });

      user = await authService.registerDoctor({
        name,
        email,
        password,
        phone,
        specialty,
        licenseNumber,
        experienceYears: Number(experienceYears),
        consultationFee: Number(consultationFee),
        bio,
      });
    } else {
      user = await authService.registerPatient({ name, email, password, phone });
    }

    const { token } = await authService.login(email, password);
    return res.status(201).json({ user, token });
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
    const msg = e instanceof Error ? e.message : "Login failed";
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
