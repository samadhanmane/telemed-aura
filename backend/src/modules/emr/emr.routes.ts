import { Router } from "express";
import * as emrController from "./emr.controller.js";
import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware.js";

export const emrRoutes = Router();

emrRoutes.use(requireAuth);

emrRoutes.get("/me", requireRole("patient"), emrController.getMyEmr);
emrRoutes.post("/me/snapshot", requireRole("patient"), emrController.generateMySnapshot);
emrRoutes.patch("/me/profile", requireRole("patient"), emrController.updateMyProfile);
emrRoutes.post("/me/vitals", requireRole("patient"), emrController.recordMyVitals);

emrRoutes.get("/doctor/patients", requireRole("doctor"), emrController.listDoctorPatientsEmr);
emrRoutes.get("/patients/:patientId", requireRole("doctor"), emrController.getPatientEmrForDoctor);
emrRoutes.post(
  "/patients/:patientId/snapshot",
  requireRole("doctor"),
  emrController.generatePatientSnapshot,
);
emrRoutes.post(
  "/consultations/:appointmentId/complete",
  requireRole("doctor"),
  emrController.saveConsultationConclusion,
);
