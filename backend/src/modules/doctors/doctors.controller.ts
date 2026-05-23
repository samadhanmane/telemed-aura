import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as doctorsService from "./doctors.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const specialty = req.query.specialty as string | undefined;
  const doctors = await doctorsService.listDoctors(specialty);
  return sendSuccess(res, "Doctors loaded", { doctors });
});

export const slots = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const date = req.query.date as string;
  const slotsList = await doctorsService.getAvailableSlots(String(id), date);
  return sendSuccess(res, "Time slots loaded", { date, slots: slotsList });
});

export const getMyAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const availability = await doctorsService.getMyAvailability(req.user!.userId);
  return sendSuccess(res, "Availability loaded", { availability });
});

export const updateMyAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const availability = await doctorsService.updateMyAvailability(req.user!.userId, req.body);
  return sendSuccess(res, "Availability saved", { availability });
});
