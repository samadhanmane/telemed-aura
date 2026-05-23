import { Router } from "express";
import * as appointmentsController from "./appointments.controller.js";
import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware.js";

export const appointmentRoutes = Router();

appointmentRoutes.use(requireAuth);

appointmentRoutes.get("/", appointmentsController.list);
appointmentRoutes.get("/:id", appointmentsController.getOne);
appointmentRoutes.post("/", requireRole("patient"), appointmentsController.create);
appointmentRoutes.patch("/:id", requireRole("doctor", "admin"), appointmentsController.update);
appointmentRoutes.post("/:id/video-session/end", appointmentsController.endVideoSession);
appointmentRoutes.post("/:id/video-session", appointmentsController.videoSession);
