import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as appointmentsService from "./appointments.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { assertFutureAppointmentDate } from "../../shared/validations/appointment.schemas.js";

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { doctorId, date, time, specialty } = req.body;
  assertFutureAppointmentDate(date, time);
  const appointment = await appointmentsService.createAppointment(req.user!.userId, {
    doctorId,
    date,
    time,
    specialty,
  });
  return sendSuccess(res, "Appointment booked successfully", { appointment }, 201);
});

export const getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
  const appointment = await appointmentsService.getAppointmentById(
    String(req.params.id),
    req.user!.userId,
    req.user!.role,
  );
  return sendSuccess(res, "Appointment loaded", { appointment });
});

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const appointments = await appointmentsService.listAppointments(
    req.user!.userId,
    req.user!.role,
  );
  return sendSuccess(res, "Appointments loaded", { appointments });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, conclusion, vitals } = req.body;
  const appointment = await appointmentsService.updateStatus(
    String(req.params.id),
    req.user!.userId,
    req.user!.role,
    status,
    status === "completed" ? { conclusion, vitals } : undefined,
  );
  const message =
    status === "confirmed"
      ? "Appointment confirmed successfully"
      : status === "cancelled"
        ? "Appointment cancelled"
        : status === "completed"
          ? "Consultation marked as completed"
          : "Appointment updated";
  return sendSuccess(res, message, { appointment });
});

export const videoSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await appointmentsService.createVideoSession(
    String(req.params.id),
    req.user!.userId,
    req.user!.role,
  );
  return sendSuccess(res, "Video session ready", result);
});

export const leaveVideoSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const appointment = await appointmentsService.leaveVideoSession(
    String(req.params.id),
    req.user!.userId,
    req.user!.role,
    req.body,
  );
  return sendSuccess(res, "Left consultation", { appointment });
});

export const endVideoSession = leaveVideoSession;
