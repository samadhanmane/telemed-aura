import { Router } from "express";
import * as doctorsController from "./doctors.controller.js";
import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { slotsQuerySchema } from "../../shared/validations/clinical.schemas.js";

export const doctorsRoutes = Router();

doctorsRoutes.get("/", doctorsController.list);

doctorsRoutes.get(
  "/me/availability",
  requireAuth,
  requireRole("doctor"),
  doctorsController.getMyAvailability,
);
doctorsRoutes.put(
  "/me/availability",
  requireAuth,
  requireRole("doctor"),
  doctorsController.updateMyAvailability,
);

doctorsRoutes.get("/:id/slots", validate(slotsQuerySchema, "query"), doctorsController.slots);
