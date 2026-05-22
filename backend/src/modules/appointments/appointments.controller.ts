import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as appointmentsService from "./appointments.service.js";

export async function create(req: AuthRequest, res: Response) {
  try {
    const { doctorId, date, time, specialty } = req.body;
    if (!doctorId || !date || !time || !specialty) {
      return res.status(400).json({ error: "doctorId, date, time, specialty required" });
    }
    const appointment = await appointmentsService.createAppointment(req.user!.userId, {
      doctorId,
      date,
      time,
      specialty,
    });
    return res.status(201).json({ appointment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Booking failed";
    return res.status(400).json({ error: msg });
  }
}

export async function list(req: AuthRequest, res: Response) {
  const appointments = await appointmentsService.listAppointments(
    req.user!.userId,
    req.user!.role,
  );
  return res.json({ appointments });
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status required" });
    const appointment = await appointmentsService.updateStatus(
      String(req.params.id),
      req.user!.userId,
      req.user!.role,
      status,
    );
    return res.json({ appointment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return res.status(400).json({ error: msg });
  }
}

export async function videoSession(req: AuthRequest, res: Response) {
  try {
    const result = await appointmentsService.createVideoSession(
      String(req.params.id),
      req.user!.userId,
      req.user!.role,
    );
    return res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Session denied";
    return res.status(403).json({ error: msg });
  }
}

export async function endVideoSession(req: AuthRequest, res: Response) {
  try {
    const appointment = await appointmentsService.endVideoSession(
      String(req.params.id),
      req.user!.userId,
      req.user!.role,
    );
    return res.json({ appointment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not end session";
    return res.status(400).json({ error: msg });
  }
}
