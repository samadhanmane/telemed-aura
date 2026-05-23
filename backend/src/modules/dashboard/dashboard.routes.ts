import { Router } from "express";
import * as dashboardController from "./dashboard.controller.js";
import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

dashboardRoutes.get("/patient", requireRole("patient"), dashboardController.patientHome);
dashboardRoutes.get("/patient/timeline", requireRole("patient"), dashboardController.patientTimeline);
dashboardRoutes.get("/patient/analytics", requireRole("patient"), dashboardController.patientAnalytics);
dashboardRoutes.get("/doctor/patients", requireRole("doctor"), dashboardController.listDoctorPatients);
dashboardRoutes.get("/doctor", requireRole("doctor"), dashboardController.doctorHome);
dashboardRoutes.get("/doctor/analytics", requireRole("doctor"), dashboardController.doctorAnalytics);
dashboardRoutes.get(
  "/doctor/patients/:patientId",
  requireRole("doctor"),
  dashboardController.doctorPatient,
);
dashboardRoutes.get("/admin", requireRole("admin"), dashboardController.adminHome);
dashboardRoutes.get("/admin/users", requireRole("admin"), dashboardController.adminUsers);
dashboardRoutes.get("/admin/doctors", requireRole("admin"), dashboardController.adminDoctors);
dashboardRoutes.patch(
  "/admin/doctors/:doctorId/approve",
  requireRole("admin"),
  dashboardController.approveDoctor,
);
dashboardRoutes.patch(
  "/admin/doctors/:doctorId/reject",
  requireRole("admin"),
  dashboardController.rejectDoctor,
);
dashboardRoutes.get("/admin/patients", requireRole("admin"), dashboardController.adminPatients);
dashboardRoutes.get(
  "/admin/ai-monitoring",
  requireRole("admin"),
  dashboardController.adminAiMonitoring,
);
