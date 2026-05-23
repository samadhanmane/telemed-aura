import { Router } from "express";
import * as appointmentsController from "./appointments.controller.js";
import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from "../../shared/validations/appointment.schemas.js";

export const appointmentRoutes = Router();

appointmentRoutes.use(requireAuth);

appointmentRoutes.get("/", appointmentsController.list);
appointmentRoutes.get("/:id", appointmentsController.getOne);
appointmentRoutes.post(
  "/",
  requireRole("patient"),
  validate(createAppointmentSchema),
  appointmentsController.create,
);
appointmentRoutes.patch(
  "/:id",
  requireRole("doctor", "admin"),
  validate(updateAppointmentSchema),
  appointmentsController.update,
);
appointmentRoutes.post("/:id/video-session/leave", appointmentsController.leaveVideoSession);
appointmentRoutes.post("/:id/video-session/end", appointmentsController.endVideoSession);
appointmentRoutes.post("/:id/video-session", appointmentsController.videoSession);
