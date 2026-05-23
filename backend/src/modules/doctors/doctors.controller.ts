import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as doctorsService from "./doctors.service.js";

export async function list(req: AuthRequest, res: Response) {
  const specialty = req.query.specialty as string | undefined;
  const doctors = await doctorsService.listDoctors(specialty);
  return res.json({ doctors });
}

export async function slots(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const date = req.query.date as string;
  if (!date) return res.status(400).json({ error: "date query required (YYYY-MM-DD)" });
  const slots = await doctorsService.getAvailableSlots(String(id), date);
  return res.json({ date, slots });
}

export async function getMyAvailability(req: AuthRequest, res: Response) {
  try {
    const availability = await doctorsService.getMyAvailability(req.user!.userId);
    return res.json({ availability });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load availability";
    return res.status(400).json({ error: msg });
  }
}

export async function updateMyAvailability(req: AuthRequest, res: Response) {
  try {
    const availability = await doctorsService.updateMyAvailability(
      req.user!.userId,
      req.body,
    );
    return res.json({ availability });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save availability";
    return res.status(400).json({ error: msg });
  }
}
