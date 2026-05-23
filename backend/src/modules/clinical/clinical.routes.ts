import { Router } from "express";
import * as clinicalController from "./clinical.controller.js";
import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware.js";
import { uploadReport } from "../../shared/middleware/upload.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import {
  clinicalNoteSchema,
  prescriptionCreateSchema,
  followUpSchema,
  reportReviewSchema,
  urgentBookSchema,
  criticalBookSchema,
  rescheduleSchema,
} from "../../shared/validations/clinical.schemas.js";
export const clinicalRoutes = Router();

clinicalRoutes.use(requireAuth);

clinicalRoutes.get(
  "/patients/:patientId/context",
  requireRole("doctor"),
  clinicalController.getPatientContext,
);
clinicalRoutes.put(
  "/patients/:patientId/notes",
  requireRole("doctor"),
  validate(clinicalNoteSchema),
  clinicalController.updateNote,
);
clinicalRoutes.post(
  "/patients/:patientId/prescriptions",
  requireRole("doctor"),
  validate(prescriptionCreateSchema),
  clinicalController.createPrescription,
);
clinicalRoutes.post(
  "/follow-up",
  requireRole("doctor"),
  validate(followUpSchema),
  clinicalController.scheduleFollowUp,
);

clinicalRoutes.get("/doctor/triage-queue", requireRole("doctor"), clinicalController.getTriageQueue);
clinicalRoutes.get(
  "/doctor/critical-patients",
  requireRole("doctor"),
  clinicalController.listCriticalPatients,
);
clinicalRoutes.get(
  "/patients/:patientId/severity",
  requireRole("doctor"),
  clinicalController.getPatientSeverity,
);
clinicalRoutes.post(
  "/doctor/urgent-book",
  requireRole("doctor"),
  validate(urgentBookSchema),
  clinicalController.urgentBook,
);
clinicalRoutes.post(
  "/doctor/accept-critical",
  requireRole("doctor"),
  validate(urgentBookSchema),
  clinicalController.acceptCriticalPatient,
);
clinicalRoutes.get(
  "/patient/critical-alert",
  requireRole("patient"),
  clinicalController.getPatientCriticalAlert,
);
clinicalRoutes.post(
  "/patient/critical-alert/dismiss",
  requireRole("patient"),
  clinicalController.dismissPatientCriticalAlert,
);
clinicalRoutes.post(
  "/patient/critical-book",
  requireRole("patient"),
  validate(criticalBookSchema),
  clinicalController.patientCriticalBook,
);
clinicalRoutes.post(
  "/doctor/reschedule",
  requireRole("doctor"),
  validate(rescheduleSchema),
  clinicalController.rescheduleBooking,
);
clinicalRoutes.get(
  "/doctor/next-free-slot",
  requireRole("doctor"),
  clinicalController.nextFreeSlot,
);

clinicalRoutes.get("/reports", requireRole("patient"), clinicalController.listMyReports);
clinicalRoutes.post(
  "/reports",
  requireRole("patient"),
  uploadReport.single("file"),
  clinicalController.uploadReport,
);
clinicalRoutes.get("/doctor/reports", requireRole("doctor"), clinicalController.listDoctorReports);
clinicalRoutes.patch(
  "/reports/:reportId/review",
  requireRole("doctor"),
  validate(reportReviewSchema),
  clinicalController.reviewReport,
);
clinicalRoutes.get(
  "/doctor/prescriptions",
  requireRole("doctor"),
  clinicalController.listDoctorPrescriptions,
);
clinicalRoutes.get("/prescriptions", requireRole("patient"), clinicalController.listMyPrescriptions);
